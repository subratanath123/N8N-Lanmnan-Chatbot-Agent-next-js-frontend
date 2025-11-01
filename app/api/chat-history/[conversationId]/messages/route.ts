import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${requestId}] Conversation messages GET API called at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Request URL: ${request.url}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()));
    console.log(`[${requestId}] Route params:`, params);
    
    // Get authenticated user
    console.log(`[${requestId}] Attempting to authenticate user with Clerk...`);
    const { userId } = await auth();
    console.log(`[${requestId}] Clerk auth result - userId: ${userId}`);
    
    if (!userId) {
      console.log(`[${requestId}] Authentication failed - no userId returned`);
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Unauthorized - user must be signed in to view conversation messages',
          timestamp: Date.now()
        },
        { status: 401 }
      );
    }

    console.log(`[${requestId}] User authenticated successfully: ${userId}`);

    const { conversationId } = params;
    console.log(`[${requestId}] Conversation ID from params: ${conversationId}`);

    if (!conversationId) {
      console.log(`[${requestId}] Validation failed - missing conversationId`);
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Conversation ID is required',
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Validation passed, proceeding with request...`);

    // Get authorization header to pass to backend
    const authHeader = request.headers.get('authorization');
    console.log(`[${requestId}] Authorization header present: ${!!authHeader}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log(`[${requestId}] Forwarding authorization header to backend`);
    } else {
      console.log(`[${requestId}] No authorization header found, proceeding without it`);
    }

    // Call backend API to get conversation messages
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const fullUrl = `${backendUrl}/v1/api/chat-history/${conversationId}/messages`;
    console.log(`[${requestId}] Calling backend API: ${fullUrl}`);
    console.log(`[${requestId}] Backend request headers:`, headers);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    console.log(`[${requestId}] Backend response status: ${response.status}`);
    console.log(`[${requestId}] Backend response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[${requestId}] Backend API error: ${response.status}`, errorData);
      return NextResponse.json(
        {
          success: false,
          errorMessage: errorData.errorMessage || `Failed to fetch conversation messages: ${response.status}`,
          timestamp: Date.now()
        },
        { status: response.status }
      );
    }

    const conversationData = await response.json();
    console.log(`[${requestId}] Backend response data received, length: ${JSON.stringify(conversationData).length}`);
    
    const endTime = Date.now();
    console.log(`[${requestId}] Conversation messages GET request completed successfully in ${endTime - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      data: conversationData,
      timestamp: Date.now()
    });

  } catch (error) {
    const endTime = Date.now();
    console.error(`[${requestId}] Conversation messages GET API error after ${endTime - startTime}ms:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${requestId}] Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error while fetching conversation messages',
        timestamp: Date.now(),
        requestId,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
