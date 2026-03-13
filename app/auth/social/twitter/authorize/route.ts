import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

/**
 * Twitter/X OAuth 2.0 PKCE authorize endpoint for Social Media Suite
 * Generates authorization URL with code_challenge for secure token exchange
 * URL: /auth/social/twitter/authorize (no /api prefix - avoids backend proxy)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkToken = searchParams.get("clerkToken");

    const clientId = process.env.TWITTER_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Twitter OAuth not configured. Set TWITTER_CLIENT_ID in .env.local", errorCode: "MISSING_CLIENT_ID" },
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

    const redirectUri = `${frontendUrl}/auth/social/twitter/callback`;

    // PKCE: code_verifier and code_challenge
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

    const state = JSON.stringify({
      clerkToken: clerkToken || null,
      platform: "twitter",
      codeVerifier,
    });

    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "tweet.read tweet.write users.read offline.access");
    authUrl.searchParams.set("state", encodeURIComponent(state));
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("[twitter-authorize] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
