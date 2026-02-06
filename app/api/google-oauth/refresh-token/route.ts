import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, handleOptions } from '../cors';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

/**
 * Refresh Google OAuth access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, chatbotId, refreshToken } = body;

    if (!sessionId || !chatbotId || !refreshToken) {
      const response = NextResponse.json(
        {
          success: false,
          errorMessage: 'Missing required fields: sessionId, chatbotId, or refreshToken',
        },
        { status: 400 }
      );
      return addCorsHeaders(request, response);
    }

    // Exchange refresh token for new access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token refresh failed:', errorData);
      const errorResponse = NextResponse.json(
        {
          success: false,
          errorMessage: 'Failed to refresh access token',
        },
        { status: 500 }
      );
      return addCorsHeaders(request, errorResponse);
    }

    const tokens = await tokenResponse.json();
    const { access_token, expires_in } = tokens;

    // Update tokens in backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const updateResponse = await fetch(`${backendUrl}/v1/api/google-oauth/update-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        chatbotId,
        accessToken: access_token,
        expiresIn: expires_in,
      }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update tokens in backend');
    }

    const successResponse = NextResponse.json({
      success: true,
      accessToken: access_token,
      expiresIn: expires_in,
    });
    return addCorsHeaders(request, successResponse);
  } catch (error) {
    console.error('Refresh token error:', error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error',
      },
      { status: 500 }
    );
    return addCorsHeaders(request, errorResponse);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

