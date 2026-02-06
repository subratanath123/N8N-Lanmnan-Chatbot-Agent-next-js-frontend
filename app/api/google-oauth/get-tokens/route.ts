import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, handleOptions } from '../cors';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

/**
 * Get Google OAuth tokens for a session
 * Used by the widget to retrieve stored tokens
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

    // Fetch tokens from backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(
      `${backendUrl}/v1/api/google-oauth/get-tokens?sessionId=${encodeURIComponent(sessionId)}&chatbotId=${encodeURIComponent(chatbotId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        const notFoundResponse = NextResponse.json(
          {
            success: false,
            errorMessage: 'No tokens found for this session',
            hasTokens: false,
          },
          { status: 404 }
        );
        return addCorsHeaders(request, notFoundResponse);
      }
      const errorResponse = NextResponse.json(
        {
          success: false,
          errorMessage: 'Failed to retrieve tokens',
        },
        { status: response.status }
      );
      return addCorsHeaders(request, errorResponse);
    }

    const data = await response.json();
    const successResponse = NextResponse.json({
      success: true,
      hasTokens: true,
      ...data,
    });
    return addCorsHeaders(request, successResponse);
  } catch (error) {
    console.error('Get tokens error:', error);
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

