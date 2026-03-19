import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * LinkedIn OAuth 2.0 authorize endpoint.
 *
 * Opened DIRECTLY in the OAuth popup window (not called via fetch).
 * Sets short-lived cookies then REDIRECTS the popup to LinkedIn's consent screen.
 * LinkedIn uses standard OAuth 2.0 (no PKCE required).
 *
 * Required LinkedIn app products:
 *   - Sign In with LinkedIn using OpenID Connect  → openid, profile, email
 *   - Share on LinkedIn                           → w_member_social
 *
 * URL: /auth/social/linkedin/authorize  (no /api prefix — avoids backend proxy)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkToken = searchParams.get("clerkToken") || "";

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h2 style="color:#dc2626">Configuration Error</h2>
          <p>LINKEDIN_CLIENT_ID is not set. Please add it to your .env.local file.</p>
          <button onclick="window.close()">Close</button>
        </body></html>`,
        { status: 500, headers: { "Content-Type": "text/html" } }
      );
    }

    let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    if (!frontendUrl) {
      const origin  = request.headers.get("origin");
      const referer = request.headers.get("referer");
      frontendUrl = origin || (referer ? new URL(referer).origin : null) || request.nextUrl.origin;
    }
    frontendUrl = frontendUrl.replace(/\/+$/, "");

    const redirectUri = `${frontendUrl}/auth/social/linkedin/callback`;

    // Short CSRF state — LinkedIn is strict about state not being too long
    const csrfState = crypto.randomBytes(16).toString("base64url");

    // Scopes:
    //   openid + profile + email  → Sign In with LinkedIn (OpenID Connect product)
    //   w_member_social           → Share on LinkedIn product
    const scope = "openid profile email w_member_social";

    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id",     clientId);
    authUrl.searchParams.set("redirect_uri",  redirectUri);
    authUrl.searchParams.set("scope",         scope);
    authUrl.searchParams.set("state",         csrfState);

    const isSecure  = frontendUrl.startsWith("https");
    const cookieOpts = {
      httpOnly: true,
      secure:   isSecure,
      sameSite: "lax" as const,
      path:     "/",
      maxAge:   600, // 10 minutes
    };

    const res = NextResponse.redirect(authUrl.toString());
    res.cookies.set("li_csrf_state",  csrfState,  cookieOpts);
    res.cookies.set("li_clerk_token", clerkToken, cookieOpts);
    return res;
  } catch (error) {
    console.error("[linkedin-authorize] Error:", error);
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
