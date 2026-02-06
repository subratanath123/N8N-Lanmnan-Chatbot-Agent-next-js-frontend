import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth callback handler for chatbot owners
 * This receives the authorization code from Google, exchanges it for tokens,
 * and stores them in the backend against the chatbot
 */
export async function GET(request: NextRequest) {
  console.log('[callback-chatbot] ====== CALLBACK RECEIVED ======');
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('[callback-chatbot] URL params:', {
      hasCode: !!code,
      hasState: !!stateParam,
      error
    });
    
    // Determine frontend URL for redirects
    let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    if (!frontendUrl) {
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
    
    // Remove trailing slash to prevent double slashes in URLs
    frontendUrl = frontendUrl.replace(/\/+$/, '');
    
    // Handle OAuth errors
    if (error) {
      console.error('[callback-chatbot] OAuth error from Google:', error);
      return NextResponse.redirect(`${frontendUrl}/oauth-success-chatbot?error=true&message=${encodeURIComponent(error)}`);
    }
    
    if (!code || !stateParam) {
      console.error('[callback-chatbot] Missing code or state');
      return NextResponse.redirect(`${frontendUrl}/oauth-success-chatbot?error=true&message=${encodeURIComponent('Missing authorization code or state')}`);
    }
    
    // Parse state parameter
    let chatbotId: string;
    let clerkToken: string | null = null;
    
    try {
      const decodedState = decodeURIComponent(stateParam);
      console.log('[callback-chatbot] Decoded state:', decodedState);
      const stateObj = JSON.parse(decodedState);
      chatbotId = stateObj.chatbotId;
      clerkToken = stateObj.clerkToken;
      console.log('[callback-chatbot] Parsed state:', { chatbotId, hasClerkToken: !!clerkToken });
    } catch (e) {
      console.error('[callback-chatbot] Failed to parse state:', e);
      return NextResponse.redirect(`${frontendUrl}/oauth-success-chatbot?error=true&message=${encodeURIComponent('Invalid state parameter')}`);
    }
    
    // Get OAuth credentials
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('[callback-chatbot] Missing OAuth credentials');
      return NextResponse.redirect(`${frontendUrl}/oauth-success-chatbot?error=true&message=${encodeURIComponent('OAuth not configured')}`);
    }
    
    const redirectUri = `${frontendUrl}/api/google-oauth/callback-chatbot`;
    
    console.log('[callback-chatbot] Exchanging code for tokens...');
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[callback-chatbot] Token exchange failed:', tokenData);
      return NextResponse.redirect(`${frontendUrl}/oauth-success-chatbot?error=true&message=${encodeURIComponent(tokenData.error_description || 'Failed to get tokens')}`);
    }
    
    console.log('[callback-chatbot] Token exchange successful:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    });
    
    // Store tokens in the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const backendApiUrl = `${backendUrl}/v1/api/chatbot/google-calendar/${chatbotId}`;
    
    console.log('[callback-chatbot] Storing tokens in backend:', backendApiUrl);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (clerkToken) {
      headers['Authorization'] = `Bearer ${clerkToken}`;
    }
    
    const backendResponse = await fetch(backendApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
      }),
    });
    
    console.log('[callback-chatbot] Backend response status:', backendResponse.status);
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[callback-chatbot] Backend storage failed:', errorText);
      return NextResponse.redirect(`${frontendUrl}/oauth-success-chatbot?error=true&message=${encodeURIComponent('Failed to store tokens')}&chatbotId=${chatbotId}`);
    }
    
    console.log('[callback-chatbot] Tokens stored successfully!');
    
    // Redirect to success page
    return NextResponse.redirect(`${frontendUrl}/oauth-success-chatbot?success=true&chatbotId=${chatbotId}`);
  } catch (error) {
    console.error('[callback-chatbot] Unexpected error:', error);
    
    let frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    return NextResponse.redirect(`${frontendUrl}/oauth-success-chatbot?error=true&message=${encodeURIComponent('Unexpected error occurred')}`);
  }
}

