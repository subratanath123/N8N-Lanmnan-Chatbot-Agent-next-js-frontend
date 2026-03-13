import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

/**
 * Facebook OAuth authorize endpoint for Social Media Suite
 * Generates Facebook Login URL - user will grant pages_manage_posts etc.
 * State contains clerkToken for backend auth when storing tokens
 * URL: /auth/social/facebook/authorize (no /api prefix - avoids backend proxy)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkToken = searchParams.get("clerkToken");

    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) {
      return NextResponse.json(
        { error: "Facebook OAuth not configured. Set FACEBOOK_APP_ID in .env.local", errorCode: "MISSING_APP_ID" },
        { status: 500 }
      );
    }

    let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    if (!frontendUrl) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      frontendUrl = origin || (referer ? new URL(referer).origin : "https://subratapc.net");
    }
    frontendUrl = frontendUrl.replace(/\/+$/, "");

    const redirectUri = `${frontendUrl}/auth/social/facebook/callback`;

    // Scopes for posting to Facebook Pages
    const scopes = [
      "pages_show_list",
      "pages_manage_posts",
      "pages_read_engagement",
      "pages_manage_metadata",
      "business_management",
    ].join(",");

    const state = JSON.stringify({
      clerkToken: clerkToken || null,
      platform: "facebook",
    });

    const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", encodeURIComponent(state));

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("[facebook-authorize] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
