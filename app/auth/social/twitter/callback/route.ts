import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

/**
 * Twitter/X OAuth 2.0 callback - exchanges code for access token,
 * sends to backend for automatic posting on behalf of user
 * URL: /auth/social/twitter/callback (no /api prefix - avoids backend proxy)
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
    const successUrl = `${frontendUrl}/oauth-success-social?platform=twitter`;
    const errorUrl = `${frontendUrl}/oauth-success-social?platform=twitter&error=true`;

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
    let codeVerifier: string | null = null;
    try {
      const stateObj = JSON.parse(decodeURIComponent(stateParam));
      clerkToken = stateObj.clerkToken;
      codeVerifier = stateObj.codeVerifier;
    } catch {
      return NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("Invalid state")}`);
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    if (!clientId || !clientSecret || !codeVerifier) {
      return NextResponse.redirect(`${errorUrl}&message=${encodeURIComponent("Twitter OAuth not configured")}`);
    }

    const redirectUri = `${frontendUrl}/auth/social/twitter/callback`;

    // Exchange code for access token
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        `${errorUrl}&message=${encodeURIComponent(tokenData.error_description || tokenData.error || "Failed to get access token")}`
      );
    }

    // Optionally fetch user info
    const userRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    const username = userData.data?.username || null;

    // Send to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (clerkToken) headers["Authorization"] = `Bearer ${clerkToken}`;

    const backendEndpoint = `${backendUrl}/v1/api/social-accounts/twitter`;
    const backendBody = JSON.stringify({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresIn: tokenData.expires_in || null,
      username,
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
      console.error("[twitter-callback] Backend error:", errText);
      return NextResponse.redirect(
        `${errorUrl}&message=${encodeURIComponent("Failed to save account. Backend may not be configured.")}`
      );
    }

    return NextResponse.redirect(`${successUrl}`);
  } catch (err) {
    console.error("[twitter-callback] Error:", err);
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
    const userFacingMessage = certTrustError
      ? "TLS certificate trust failed in Node. Ensure NODE_EXTRA_CA_CERTS points to mkcert rootCA.pem and restart Next.js."
      : errorMessage;
    const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || "https://subratapc.net").replace(/\/+$/, "");
    return NextResponse.redirect(
      `${frontendUrl}/oauth-success-social?platform=twitter&error=true&message=${encodeURIComponent(userFacingMessage)}`
    );
  }
}
