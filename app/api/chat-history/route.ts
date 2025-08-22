import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Unauthorized - user must be signed in to view chat history',
          timestamp: Date.now()
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get authorization header to pass to backend
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Call backend API to get chat history
    const backendUrl = process.env.BACKEND_URL || 'http://https://chat-api-2187.onrender.com';
    const response = await fetch(`${backendUrl}/v1/api/chat-history?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
    
    return NextResponse.json({
      success: true,
      data: chatHistoryData,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error while fetching chat history',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Unauthorized - user must be signed in to save chat history',
          timestamp: Date.now()
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, title, messages } = body;

    // Validate required fields
    if (!sessionId || !title || !messages) {
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Missing required fields: sessionId, title, or messages',
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

    // Get authorization header to pass to backend
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
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

    // Call backend API to save chat history
    const backendUrl = process.env.BACKEND_URL || 'http://https://chat-api-2187.onrender.com';
    const response = await fetch(`${backendUrl}/v1/api/chat-history`, {
      method: 'POST',
      headers,
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
    
    return NextResponse.json({
      success: true,
      data: saveResult,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Save chat history API error:', error);
    return NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error while saving chat history',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Unauthorized - user must be signed in to delete chat history',
          timestamp: Date.now()
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Session ID is required for deletion',
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

    // Get authorization header to pass to backend
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Call backend API to delete chat history
    const backendUrl = process.env.BACKEND_URL || 'http://https://chat-api-2187.onrender.com';
    const response = await fetch(`${backendUrl}/v1/api/chat-history/${sessionId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          errorMessage: errorData.errorMessage || `Failed to delete chat history: ${response.status}`,
          timestamp: Date.now()
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat history deleted successfully',
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Delete chat history API error:', error);
    return NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error while deleting chat history',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
