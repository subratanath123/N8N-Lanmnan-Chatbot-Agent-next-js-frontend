import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Twitter/X OAuth 2.0 callback — exchanges code for access token,
 * then saves the account to the backend.
 *
 * codeVerifier and clerkToken come from short-lived HTTP-only cookies set
 * by the authorize route (avoids the oversized-state problem that caused
 * "Something went wrong / You weren't able to give access" on Twitter).
 *
 * URL: /auth/social/twitter/callback  (no /api prefix — avoids backend proxy)
 */
export async function GET(request: NextRequest) {
  let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (!frontendUrl) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    frontendUrl = origin || (referer ? new URL(referer).origin : "https://subratapc.net");
  }
  frontendUrl = frontendUrl.replace(/\/+$/, "");

  const successUrl = `${frontendUrl}/oauth-success-social?platform=twitter`;
  const errorUrl   = `${frontendUrl}/oauth-success-social?platform=twitter&error=true`;

  const clearCookies = (res: NextResponse) => {
    const opts = { httpOnly: true, path: "/", maxAge: 0 };
    res.cookies.set("tw_pkce_verifier", "", opts);
    res.cookies.set("tw_csrf_state",    "", opts);
    res.cookies.set("tw_clerk_token",   "", opts);
    return res;
  };

  try {
    const { searchParams } = new URL(request.url);
    const code             = searchParams.get("code");
    const stateParam       = searchParams.get("state");
    const twitterError     = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Twitter returned an error on its consent screen
    if (twitterError) {
      return clearCookies(
        NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent(errorDescription || twitterError)}`)
      );
    }

    if (!code) {
      return clearCookies(
        NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("Missing authorization code")}`)
      );
    }

    // Read values from cookies
    const codeVerifier = request.cookies.get("tw_pkce_verifier")?.value || null;
    const csrfState    = request.cookies.get("tw_csrf_state")?.value    || null;
    const clerkToken   = request.cookies.get("tw_clerk_token")?.value   || null;

    if (!codeVerifier) {
      return clearCookies(
        NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("Session expired. Please try connecting again.")}`)
      );
    }

    // CSRF check — only if the cookie was set (browsers in popups sometimes drop cookies)
    if (csrfState && stateParam && csrfState !== stateParam) {
      return clearCookies(
        NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("CSRF state mismatch. Please try again.")}`)
      );
    }

    const clientId     = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return clearCookies(
        NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("Twitter OAuth not configured on server.")}`)
      );
    }

    const redirectUri = `${frontendUrl}/auth/social/twitter/callback`;

    // ── Exchange code for tokens ────────────────────────────────────────────
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type:    "authorization_code",
        redirect_uri:  redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("[twitter-callback] Token exchange failed:", tokenData);
      return clearCookies(
        NextResponse.redirect(
          `${errorUrl}&message=${encodeURIComponent(tokenData.error_description || tokenData.error || "Failed to get access token from Twitter.")}`
        )
      );
    }

    // ── Fetch Twitter user info ─────────────────────────────────────────────
    const userRes  = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    const username = userData.data?.username || null;

    // ── Save account to backend ─────────────────────────────────────────────
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (clerkToken) headers["Authorization"] = `Bearer ${clerkToken}`;

    let backendRes: Response;
    try {
      backendRes = await fetch(`${backendUrl}/v1/api/social-accounts/twitter`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          accessToken:  tokenData.access_token,
          refreshToken: tokenData.refresh_token  || null,
          expiresIn:    tokenData.expires_in     || null,
          username,
        }),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const isCert =
        msg.toLowerCase().includes("self-signed certificate") ||
        msg.toLowerCase().includes("certificate is not yet valid") ||
        (fetchErr instanceof Error && (fetchErr as Error & { cause?: { code?: string } }).cause?.code === "DEPTH_ZERO_SELF_SIGNED_CERT");

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
      console.error("[twitter-callback] Backend error:", errText);
      return clearCookies(
        NextResponse.redirect(
          `${errorUrl}&message=${encodeURIComponent("Account connected but could not be saved to backend. Please try again.")}`
        )
      );
    }

    return clearCookies(NextResponse.redirect(successUrl));
  } catch (err) {
    console.error("[twitter-callback] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Unexpected error occurred";
    return clearCookies(
      NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent(msg)}`)
    );
  }
}
