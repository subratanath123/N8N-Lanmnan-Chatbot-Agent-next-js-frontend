import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Unauthorized - user must be signed in to view conversation messages',
          timestamp: Date.now()
        },
        { status: 401 }
      );
    }

    const { conversationId } = params;

    if (!conversationId) {
      return NextResponse.json(
        { 
          success: false,
          errorMessage: 'Conversation ID is required',
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

    // Call backend API to get conversation messages
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/v1/api/chat-history/${conversationId}/messages`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
    
    return NextResponse.json({
      success: true,
      data: conversationData,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Conversation messages API error:', error);
    return NextResponse.json(
      {
        success: false,
        errorMessage: 'Internal server error while fetching conversation messages',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
