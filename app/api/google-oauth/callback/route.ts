import { NextRequest, NextResponse } from 'next/server';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

/**
 * Google OAuth Callback Handler
 * This endpoint receives the authorization code from Google and exchanges it for tokens
 * Stores tokens in database associated with sessionId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains sessionId and chatbotId
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/oauth-error?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        {
          success: false,
          errorMessage: 'Missing code or state parameter',
        },
        { status: 400 }
      );
    }

    // Parse state to get sessionId and chatbotId
    let sessionId: string;
    let chatbotId: string;
    try {
      const stateData = JSON.parse(decodeURIComponent(state));
      sessionId = stateData.sessionId;
      chatbotId = stateData.chatbotId;
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          errorMessage: 'Invalid state parameter',
        },
        { status: 400 }
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/api/google-oauth/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.json(
        {
          success: false,
          errorMessage: 'Failed to exchange authorization code for tokens',
        },
        { status: 500 }
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Store tokens in backend database associated with sessionId
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const storeTokenResponse = await fetch(`${backendUrl}/v1/api/google-oauth/store-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        chatbotId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        tokenType: tokens.token_type || 'Bearer',
      }),
    });

    if (!storeTokenResponse.ok) {
      console.error('Failed to store tokens in backend');
      return NextResponse.json(
        {
          success: false,
          errorMessage: 'Failed to store tokens',
        },
        { status: 500 }
      );
    }

    // Redirect back to the widget with success message
    // The widget will detect the success and update its state
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${frontendUrl}/oauth-success?sessionId=${encodeURIComponent(sessionId)}&chatbotId=${encodeURIComponent(chatbotId)}&oauth-success=true`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error during OAuth callback',
      },
      { status: 500 }
    );
  }
}

