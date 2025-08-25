import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${requestId}] Chat history GET API called at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Request URL: ${request.url}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()));
    
    // Get authenticated user
    console.log(`[${requestId}] Attempting to authenticate user with Clerk...`);
    const { userId } = await auth();
    console.log(`[${requestId}] Clerk auth result - userId: ${userId}`);
    
    if (!userId) {
      console.log(`[${requestId}] Authentication failed - no userId returned`);
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Unauthorized - user must be signed in to view chat history',
          timestamp: Date.now()
        },
        { status: 401 }
      );
    }

    console.log(`[${requestId}] User authenticated successfully: ${userId}`);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    console.log(`[${requestId}] Query parameters - limit: ${limit}, offset: ${offset}`);

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

    // Call backend API to get chat history
    const backendUrl = 'http://143.198.58.6:8080';
    const fullUrl = `${backendUrl}/v1/api/chat-history?limit=${limit}&offset=${offset}`;
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
          errorMessage: errorData.errorMessage || `Failed to fetch chat history: ${response.status}`,
          timestamp: Date.now()
        },
        { status: response.status }
      );
    }

    const chatHistoryData = await response.json();
    console.log(`[${requestId}] Backend response data received, length: ${JSON.stringify(chatHistoryData).length}`);
    
    const endTime = Date.now();
    console.log(`[${requestId}] Chat history GET request completed successfully in ${endTime - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      data: chatHistoryData,
      timestamp: Date.now()
    });

  } catch (error) {
    const endTime = Date.now();
    console.error(`[${requestId}] Chat history GET API error after ${endTime - startTime}ms:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${requestId}] Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error while fetching chat history',
        timestamp: Date.now(),
        requestId,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${requestId}] Chat history POST API called at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Request URL: ${request.url}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()));
    
    // Get authenticated user
    console.log(`[${requestId}] Attempting to authenticate user with Clerk...`);
    const { userId } = await auth();
    console.log(`[${requestId}] Clerk auth result - userId: ${userId}`);
    
    if (!userId) {
      console.log(`[${requestId}] Authentication failed - no userId returned`);
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Unauthorized - user must be signed in to save chat history',
          timestamp: Date.now()
        },
        { status: 401 }
      );
    }

    console.log(`[${requestId}] User authenticated successfully: ${userId}`);

    const body = await request.json();
    console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));
    
    const { sessionId, title, messages } = body;

    // Validate required fields
    if (!sessionId || !title || !messages) {
      console.log(`[${requestId}] Validation failed - missing required fields`);
      console.log(`[${requestId}] sessionId: ${!!sessionId}, title: ${!!title}, messages: ${!!messages}`);
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Missing required fields: sessionId, title, or messages',
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Validation passed, processing request...`);

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

    // Prepare request data
    const saveData = {
      userId,
      sessionId,
      title,
      messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log(`[${requestId}] Prepared save data:`, JSON.stringify(saveData, null, 2));

    // Call backend API to save chat history
    const backendUrl = 'http://143.198.58.6:8080';
    const fullUrl = `${backendUrl}/v1/api/chat-history`;
    console.log(`[${requestId}] Calling backend API to save: ${fullUrl}`);
    console.log(`[${requestId}] Backend request headers:`, headers);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(saveData),
    });

    console.log(`[${requestId}] Backend response status: ${response.status}`);
    console.log(`[${requestId}] Backend response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[${requestId}] Backend API error: ${response.status}`, errorData);
      return NextResponse.json(
        {
          success: false,
          errorMessage: errorData.errorMessage || `Failed to save chat history: ${response.status}`,
          timestamp: Date.now()
        },
        { status: response.status }
      );
    }

    const saveResult = await response.json();
    console.log(`[${requestId}] Backend save response:`, JSON.stringify(saveResult, null, 2));
    
    const endTime = Date.now();
    console.log(`[${requestId}] Chat history POST request completed successfully in ${endTime - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      data: saveResult,
      timestamp: Date.now()
    });

  } catch (error) {
    const endTime = Date.now();
    console.error(`[${requestId}] Chat history POST API error after ${endTime - startTime}ms:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${requestId}] Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error while saving chat history',
        timestamp: Date.now(),
        requestId,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${requestId}] Chat history DELETE API called at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Request URL: ${request.url}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()));
    
    // Get authenticated user
    console.log(`[${requestId}] Attempting to authenticate user with Clerk...`);
    const { userId } = await auth();
    console.log(`[${requestId}] Clerk auth result - userId: ${userId}`);
    
    if (!userId) {
      console.log(`[${requestId}] Authentication failed - no userId returned`);
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Unauthorized - user must be signed in to delete chat history',
          timestamp: Date.now()
        },
        { status: 401 }
      );
    }

    console.log(`[${requestId}] User authenticated successfully: ${userId}`);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    console.log(`[${requestId}] Session ID from query: ${sessionId}`);

    if (!sessionId) {
      console.log(`[${requestId}] Validation failed - missing sessionId`);
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Session ID is required for deletion',
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Validation passed, proceeding with deletion...`);

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

    // Call backend API to delete chat history
    const backendUrl = 'http://143.198.58.6:8080';
    const fullUrl = `${backendUrl}/v1/api/chat-history/${sessionId}`;
    console.log(`[${requestId}] Calling backend API to delete: ${fullUrl}`);
    console.log(`[${requestId}] Backend request headers:`, headers);
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
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
          errorMessage: errorData.errorMessage || `Failed to delete chat history: ${response.status}`,
          timestamp: Date.now()
        },
        { status: response.status }
      );
    }

    const endTime = Date.now();
    console.log(`[${requestId}] Chat history DELETE request completed successfully in ${endTime - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Chat history deleted successfully',
      timestamp: Date.now()
    });

  } catch (error) {
    const endTime = Date.now();
    console.error(`[${requestId}] Chat history DELETE API error after ${endTime - startTime}ms:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${requestId}] Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error while deleting chat history',
        timestamp: Date.now(),
        requestId,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
