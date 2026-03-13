import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

/**
 * Facebook OAuth callback - exchanges code for tokens, fetches page info,
 * exchanges for long-lived token, sends to backend for automatic posting
 * URL: /auth/social/facebook/callback (no /api prefix - avoids backend proxy)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    if (!frontendUrl) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      frontendUrl = origin || (referer ? new URL(referer).origin : "https://subratapc.net");
    }
    frontendUrl = frontendUrl.replace(/\/+$/, "");
    const successUrl = `${frontendUrl}/oauth-success-social?platform=facebook`;
    const errorUrl = `${frontendUrl}/oauth-success-social?platform=facebook&error=true`;

    if (error) {
      return NextResponse.redirect(
        `${errorUrl}&message=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        `${errorUrl}&message=${encodeURIComponent("Missing authorization code or state")}`
      );
    }

    let clerkToken: string | null = null;
    try {
      const stateObj = JSON.parse(decodeURIComponent(stateParam));
      clerkToken = stateObj.clerkToken;
    } catch {
      return NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("Invalid state")}`);
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) {
      return NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("Facebook OAuth not configured")}`);
    }

    const redirectUri = `${frontendUrl}/auth/social/facebook/callback`;

    // 1. Exchange code for short-lived user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        })
    );
    const tokenText = await tokenRes.text();
    let tokenData: { access_token?: string; error?: { message?: string } };
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      console.error("[facebook-callback] Token response not JSON:", tokenText);
      return NextResponse.redirect(
        `${errorUrl}&message=${encodeURIComponent("Facebook returned an invalid response. Please try again.")}`
      );
    }

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        `${errorUrl}&message=${encodeURIComponent(tokenData.error?.message || "Failed to get access token")}`
      );
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for long-lived user access token (60 days)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken,
        })
    );
    const longLivedText = await longLivedRes.text();
    let longLivedData: { access_token?: string; expires_in?: number };
    try {
      longLivedData = JSON.parse(longLivedText);
    } catch {
      console.error("[facebook-callback] Long-lived token response not JSON:", longLivedText);
      return NextResponse.redirect(
        `${errorUrl}&message=${encodeURIComponent("Facebook token exchange failed. Please try again.")}`
      );
    }
    const longLivedToken = longLivedData.access_token || shortLivedToken;

    // 3. Fetch user's Facebook Pages (with long-lived page tokens)
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?` +
        new URLSearchParams({
          access_token: longLivedToken,
          fields: "id,name,access_token",
        })
    );
    const pagesText = await pagesRes.text();
    let pagesData: { data?: Array<{ id: string; name: string; access_token: string }> };
    try {
      pagesData = JSON.parse(pagesText);
    } catch {
      console.error("[facebook-callback] Pages response not JSON:", pagesText);
      return NextResponse.redirect(
        `${errorUrl}&message=${encodeURIComponent("Failed to fetch Facebook pages. Please try again.")}`
      );
    }

    const pages = Array.isArray(pagesData.data)
      ? pagesData.data.map((p: { id: string; name: string; access_token: string }) => ({
          pageId: p.id,
          pageName: p.name,
          pageAccessToken: p.access_token,
        }))
      : [];

    // 4. Send to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (clerkToken) headers["Authorization"] = `Bearer ${clerkToken}`;

    const backendEndpoint = `${backendUrl}/v1/api/social-accounts/facebook`;
    const backendBody = JSON.stringify({
      longLivedToken,
      pages,
      expiresIn: longLivedData.expires_in || 5184000, // 60 days in seconds
    });
    let backendRes: Response;
    try {
      const fetchOptions: RequestInit = {
        method: "POST",
        headers,
        body: backendBody,
      };
      backendRes = await fetch(backendEndpoint, fetchOptions);
    } catch (fetchErr) {
      const certTrustError =
        fetchErr instanceof Error &&
        ((fetchErr as Error & { cause?: { code?: string } }).cause?.code ===
          "DEPTH_ZERO_SELF_SIGNED_CERT" ||
          (fetchErr as Error & { cause?: { code?: string } }).cause?.code ===
            "CERT_NOT_YET_VALID" ||
          fetchErr.message.toLowerCase().includes("self-signed certificate") ||
          fetchErr.message.toLowerCase().includes("certificate is not yet valid"));

      if (certTrustError) {
        return NextResponse.redirect(
          `${errorUrl}&message=${encodeURIComponent(
            "Backend TLS certificate is not trusted by Node. Configure NODE_EXTRA_CA_CERTS and restart Next.js."
          )}`
        );
      }
      throw fetchErr;
    }

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      console.error("[facebook-callback] Backend error:", errText);
      const userMessage = errText && !errText.startsWith("<") ? errText : "Failed to save account. Ensure the backend is running and implements POST /v1/api/social-accounts/facebook.";
      return NextResponse.redirect(
        `${errorUrl}&message=${encodeURIComponent(userMessage)}`
      );
    }

    return NextResponse.redirect(`${successUrl}`);
  } catch (err) {
    console.error("[facebook-callback] Error:", err);
    const errorMessage =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Unexpected error occurred";
    const errorCode =
      err instanceof Error
        ? (err as Error & { cause?: { code?: string } }).cause?.code
        : undefined;
    const certTrustError =
      errorCode === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
      errorCode === "CERT_NOT_YET_VALID" ||
      errorMessage.toLowerCase().includes("self-signed certificate") ||
      errorMessage.toLowerCase().includes("certificate is not yet valid");
    const errorCauseMessage =
      err instanceof Error
        ? (err as Error & { cause?: { message?: string } }).cause?.message
        : undefined;
    const userFacingMessage = certTrustError
      ? "TLS certificate trust failed in Node. Ensure NODE_EXTRA_CA_CERTS points to mkcert rootCA.pem and restart Next.js."
      : `FB_CALLBACK_V2: ${errorMessage}${errorCode ? ` (code: ${errorCode})` : ""}${errorCauseMessage ? ` (cause: ${errorCauseMessage})` : ""}`;
    const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || "https://subratapc.net").replace(/\/+$/, "");
    return NextResponse.redirect(
      `${frontendUrl}/oauth-success-social?platform=facebook&error=true&message=${encodeURIComponent(userFacingMessage)}`
    );
  }
}
