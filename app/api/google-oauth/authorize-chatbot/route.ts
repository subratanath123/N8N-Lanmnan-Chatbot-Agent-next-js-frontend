import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth authorization endpoint for chatbot owners
 * This generates the Google OAuth URL for the chatbot owner to connect their Google Calendar
 * The access token will be stored against the chatbot for use when consumers interact
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatbotId = searchParams.get('chatbotId');
    const clerkToken = searchParams.get('clerkToken');
    
    console.log('[authorize-chatbot] Request received:', { chatbotId, hasClerkToken: !!clerkToken });
    
    if (!chatbotId) {
      console.error('[authorize-chatbot] Missing chatbotId');
      return NextResponse.json({ error: 'Missing chatbotId' }, { status: 400 });
    }
    
    // Get OAuth credentials from environment
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    console.log('[authorize-chatbot] Checking environment variables:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdPrefix: clientId?.substring(0, 20) + '...'
    });
    
    if (!clientId) {
      console.error('[authorize-chatbot] GOOGLE_CLIENT_ID is not configured');
      return NextResponse.json(
        { error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID in .env.local', errorCode: 'MISSING_CLIENT_ID' },
        { status: 500 }
      );
    }
    
    if (!clientSecret) {
      console.error('[authorize-chatbot] GOOGLE_CLIENT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_SECRET in .env.local', errorCode: 'MISSING_CLIENT_SECRET' },
        { status: 500 }
      );
    }
    
    // Determine the frontend URL for redirect
    let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    
    if (!frontendUrl) {
      // Try to get from request origin
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      
      if (origin) {
        frontendUrl = origin;
      } else if (referer) {
        try {
          frontendUrl = new URL(referer).origin;
        } catch (e) {
          frontendUrl = 'http://localhost:3000';
        }
      } else {
        frontendUrl = 'http://localhost:3000';
      }
    }
    
    // Remove trailing slash to prevent double slashes in redirect URI
    frontendUrl = frontendUrl.replace(/\/+$/, '');
    
    const redirectUri = `${frontendUrl}/api/google-oauth/callback-chatbot`;
    
    console.log('[authorize-chatbot] Using redirect URI:', redirectUri);
    
    // Build state parameter with chatbotId and optional clerkToken
    const state = JSON.stringify({
      chatbotId,
      clerkToken: clerkToken || null
    });
    
    // Build Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
    authUrl.searchParams.set('state', encodeURIComponent(state));
    
    console.log('[authorize-chatbot] Generated auth URL, redirecting...');
    
    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('[authorize-chatbot] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

