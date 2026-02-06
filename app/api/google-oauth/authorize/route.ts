import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, handleOptions } from '../cors';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

/**
 * Generate Google OAuth authorization URL
 * Returns the URL that the widget should redirect to
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const chatbotId = searchParams.get('chatbotId');

    if (!sessionId || !chatbotId) {
      const response = NextResponse.json(
        {
          success: false,
          errorMessage: 'Missing sessionId or chatbotId',
        },
        { status: 400 }
      );
      return addCorsHeaders(request, response);
    }

    // Build authorization URL
    const redirectUri = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/api/google-oauth/callback`;
    const state = encodeURIComponent(JSON.stringify({ sessionId, chatbotId }));
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events');
    authUrl.searchParams.set('access_type', 'offline'); // Required to get refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to get refresh token
    authUrl.searchParams.set('state', state);

    const response = NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
    });
    return addCorsHeaders(request, response);
  } catch (error) {
    console.error('Generate auth URL error:', error);
    const response = NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error',
      },
      { status: 500 }
    );
    return addCorsHeaders(request, response);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

