import { NextRequest, NextResponse } from 'next/server';
import { N8NRequest, N8NResponse } from '../../../src/component/openwebui/types';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const body: N8NRequest = await request.json();
    const { message, workflowId, webhookUrl, sessionId, additionalParams } = body;

    // Extract user information from the request
    let userId: string | null = null;
    let userEmail: string | null = null;
    
    try {
      const { userId: clerkUserId } = await auth();
      userId = clerkUserId;
      
      // Get user details if authenticated
      if (userId) {
        const user = await auth();
        userEmail = user.user?.emailAddresses?.[0]?.emailAddress || null;
      }
    } catch (error) {
      console.log('User not authenticated or auth error:', error);
    }


    // Validate required fields
    if (!message || !workflowId || !webhookUrl) {
      return NextResponse.json(
        { 
          success: false,
          errorCode: 'MISSING_FIELDS',
          errorMessage: 'Missing required fields: message, workflowId, or webhookUrl',
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

    // Prepare the request to the backend N8N service
    const n8nRequest = {
      message: {
        role: 'user',
        content: message
      },
      workflowId,
      webhookUrl,
      sessionId,
      additionalParams,
      // Include user information if authenticated
      user: userId ? {
        id: userId,
        email: userEmail,
        isAuthenticated: true
      } : {
        isAuthenticated: false
      }
    };

    // Call the backend N8N API with different endpoints based on authentication
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    // Choose endpoint based on user authentication status
    const endpoint = userId ? '/v1/api/n8n/authenticated/chat/custom' : '/v1/api/n8n/anonymous/chat/custom';
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add bearer token for authenticated users
    if (userId) {
      try {
        // Get the authorization header from the original request
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
          headers['Authorization'] = authHeader;
        }
      } catch (error) {
        console.warn('Failed to get auth header:', error);
      }
    }
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(n8nRequest),
    });

    console.log('N8N request:', {
      ...body,
      user: userId ? { id: userId, email: userEmail, isAuthenticated: true } : { isAuthenticated: false },
      endpoint: endpoint,
      backendUrl: `${backendUrl}${endpoint}`
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          errorCode: 'BACKEND_ERROR',
          errorMessage: errorData.errorMessage || `Backend error: ${response.status}`,
          timestamp: Date.now()
        },
        { status: response.status }
      );
    }

    const n8nResponse: N8NResponse = await response.json();
    return NextResponse.json(n8nResponse);

  } catch (error) {
    console.error('N8N API error:', error);
    return NextResponse.json(
      {
        success: false,
        errorCode: 'INTERNAL_ERROR',
        errorMessage: 'Internal server error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const webhookUrl = searchParams.get('webhookUrl');

    if (!workflowId || !webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'MISSING_PARAMS',
          errorMessage: 'Missing required parameters: workflowId and webhookUrl',
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

    // Call the backend N8N health check API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/v1/api/n8n/health/${workflowId}?webhookUrl=${encodeURIComponent(webhookUrl)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          errorCode: 'HEALTH_CHECK_FAILED',
          errorMessage: errorData.errorMessage || `Health check failed: ${response.status}`,
          timestamp: Date.now()
        },
        { status: response.status }
      );
    }

    const healthResponse = await response.json();
    return NextResponse.json(healthResponse);

  } catch (error) {
    console.error('N8N health check error:', error);
    return NextResponse.json(
      {
        success: false,
        errorCode: 'INTERNAL_ERROR',
        errorMessage: 'Internal server error during health check',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
