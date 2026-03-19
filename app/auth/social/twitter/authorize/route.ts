import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Twitter/X OAuth 2.0 PKCE authorize endpoint.
 *
 * This route is opened DIRECTLY in the OAuth popup window (not called via fetch).
 * It sets short-lived cookies then REDIRECTS the popup to Twitter's consent screen.
 * Keeping everything in one navigation chain ensures cookies are reliably available
 * when Twitter redirects back to /auth/social/twitter/callback.
 *
 * URL: /auth/social/twitter/authorize  (no /api prefix — avoids backend proxy)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkToken = searchParams.get("clerkToken") || "";

    // Resolve frontend origin from env or request headers
    let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    if (!frontendUrl) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      frontendUrl = origin || (referer ? new URL(referer).origin : null) || request.nextUrl.origin;
    }
    frontendUrl = frontendUrl.replace(/\/+$/, "");

    const clientId = process.env.TWITTER_CLIENT_ID;
    if (!clientId) {
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h2 style="color:#dc2626">Configuration Error</h2>
          <p>TWITTER_CLIENT_ID is not set. Please configure it in your environment.</p>
          <button onclick="window.close()">Close</button>
        </body></html>`,
        { status: 500, headers: { "Content-Type": "text/html" } }
      );
    }

    const redirectUri = `${frontendUrl}/auth/social/twitter/callback`;

    // PKCE
    const codeVerifier  = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

    // Short CSRF state only — keeps the state param tiny so Twitter accepts it
    const csrfState = crypto.randomBytes(16).toString("base64url");

    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.set("response_type",         "code");
    authUrl.searchParams.set("client_id",             clientId);
    authUrl.searchParams.set("redirect_uri",          redirectUri);
    authUrl.searchParams.set("scope",                 "tweet.read tweet.write users.read offline.access");
    authUrl.searchParams.set("state",                 csrfState);
    authUrl.searchParams.set("code_challenge",        codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    // Cookie settings — 10-minute window to complete OAuth
    const isSecure = frontendUrl.startsWith("https");
    const cookieOpts = {
      httpOnly: true,
      secure:   isSecure,
      // "lax" works for the redirect chain within the same popup navigation context
      sameSite: "lax" as const,
      path:     "/",
      maxAge:   600,
    };

    // REDIRECT the popup directly to Twitter (do not return JSON).
    // Cookies are set on this redirect response so they belong to the same
    // navigation context as the eventual callback.
    const res = NextResponse.redirect(authUrl.toString());
    res.cookies.set("tw_pkce_verifier", codeVerifier, cookieOpts);
    res.cookies.set("tw_csrf_state",    csrfState,    cookieOpts);
    res.cookies.set("tw_clerk_token",   clerkToken,   cookieOpts);
    return res;
  } catch (error) {
    console.error("[twitter-authorize] Error:", error);
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h2 style="color:#dc2626">Error</h2>
        <p>${error instanceof Error ? error.message : "Unknown error"}</p>
        <button onclick="window.close()">Close</button>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
