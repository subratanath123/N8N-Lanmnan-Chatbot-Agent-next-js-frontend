import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * LinkedIn OAuth 2.0 callback.
 *
 * Flow:
 *  1. Validates CSRF state from cookie
 *  2. Exchanges authorization code for access token
 *  3. Fetches user profile via OpenID Connect userinfo endpoint
 *  4. Posts access token + profile to backend for storage
 *  5. Redirects popup to /oauth-success-social so it can postMessage the parent
 *
 * URL: /auth/social/linkedin/callback  (no /api prefix — avoids backend proxy)
 */
export async function GET(request: NextRequest) {
  let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (!frontendUrl) {
    const origin  = request.headers.get("origin");
    const referer = request.headers.get("referer");
    frontendUrl = origin || (referer ? new URL(referer).origin : null) || request.nextUrl.origin;
  }
  frontendUrl = frontendUrl.replace(/\/+$/, "");

  const successUrl = `${frontendUrl}/oauth-success-social?platform=linkedin`;
  const errorUrl   = `${frontendUrl}/oauth-success-social?platform=linkedin&error=true`;

  const clearCookies = (res: NextResponse) => {
    const opts = { httpOnly: true, path: "/", maxAge: 0 };
    res.cookies.set("li_csrf_state",  "", opts);
    res.cookies.set("li_clerk_token", "", opts);
    return res;
  };

  try {
    const { searchParams } = new URL(request.url);
    const code         = searchParams.get("code");
    const stateParam   = searchParams.get("state");
    const linkedInError = searchParams.get("error");
    const errorDesc    = searchParams.get("error_description");

    // LinkedIn returned an error on the consent screen
    if (linkedInError) {
      console.error("[linkedin-callback] LinkedIn error:", linkedInError, errorDesc);
      return clearCookies(
        NextResponse.redirect(
          `${errorUrl}&message=${encodeURIComponent(errorDesc || linkedInError)}`
        )
      );
    }

    if (!code) {
      return clearCookies(
        NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("Missing authorization code")}`)
      );
    }

    // Read cookies set by authorize route
    const csrfCookie  = request.cookies.get("li_csrf_state")?.value  || null;
    const clerkToken  = request.cookies.get("li_clerk_token")?.value || null;

    // CSRF validation
    if (csrfCookie && stateParam && csrfCookie !== stateParam) {
      return clearCookies(
        NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("CSRF state mismatch. Please try again.")}`)
      );
    }

    const clientId     = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return clearCookies(
        NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("LinkedIn OAuth not configured on server.")}`)
      );
    }

    const redirectUri = `${frontendUrl}/auth/social/linkedin/callback`;

    // ── 1. Exchange authorization code for access token ──────────────────────
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "authorization_code",
        code,
        redirect_uri:  redirectUri,
        client_id:     clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenRes.json().catch(() => ({}));

    if (!tokenData.access_token) {
      console.error("[linkedin-callback] Token exchange failed:", tokenData);
      return clearCookies(
        NextResponse.redirect(
          `${errorUrl}&message=${encodeURIComponent(
            tokenData.error_description || tokenData.error || "Failed to get access token from LinkedIn."
          )}`
        )
      );
    }

    const accessToken  = tokenData.access_token  as string;
    const refreshToken = tokenData.refresh_token as string | undefined;
    const expiresIn    = tokenData.expires_in    as number | undefined;

    // ── 2. Fetch user profile via OpenID Connect userinfo endpoint ────────────
    // LinkedIn's OpenID Connect userinfo endpoint returns: sub, name, given_name,
    // family_name, email, picture
    const profileRes  = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profileData = await profileRes.json().catch(() => ({}));

    const linkedInUserId = profileData.sub        as string | undefined;
    const displayName    = profileData.name       as string | undefined
                        || `${profileData.given_name || ""} ${profileData.family_name || ""}`.trim()
                        || "LinkedIn User";
    const email          = profileData.email      as string | undefined;
    const profilePicture = profileData.picture    as string | undefined;

    // ── 3. Save to backend ───────────────────────────────────────────────────
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (clerkToken) headers["Authorization"] = `Bearer ${clerkToken}`;

    let backendRes: Response;
    try {
      backendRes = await fetch(`${backendUrl}/v1/api/social-accounts/linkedin`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          accessToken,
          refreshToken:  refreshToken  || null,
          expiresIn:     expiresIn     || null,
          linkedInUserId: linkedInUserId || null,
          displayName,
          email:          email         || null,
          profilePicture: profilePicture || null,
        }),
      });
    } catch (fetchErr) {
      const msg    = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const isCert =
        msg.toLowerCase().includes("self-signed certificate") ||
        msg.toLowerCase().includes("certificate is not yet valid") ||
        (fetchErr instanceof Error &&
          (fetchErr as Error & { cause?: { code?: string } }).cause?.code === "DEPTH_ZERO_SELF_SIGNED_CERT");

      return clearCookies(
        NextResponse.redirect(
          `${errorUrl}&message=${encodeURIComponent(
            isCert
              ? "Backend TLS certificate is not trusted. Configure NODE_EXTRA_CA_CERTS and restart Next.js."
              : `Backend connection failed: ${msg}`
          )}`
        )
      );
    }

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      console.error("[linkedin-callback] Backend error:", errText);
      return clearCookies(
        NextResponse.redirect(
          `${errorUrl}&message=${encodeURIComponent(
            "Account connected but could not be saved to backend. Please try again."
          )}`
        )
      );
    }

    return clearCookies(NextResponse.redirect(successUrl));
  } catch (err) {
    console.error("[linkedin-callback] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Unexpected error occurred";
    return clearCookies(
      NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent(msg)}`)
    );
  }
}
