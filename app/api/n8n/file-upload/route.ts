import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Handle multipart form data
    const formData = await request.formData();
    
    // Extract form fields
    const file = formData.get('file') as File;
    const workflowId = formData.get('workflowId') as string;
    const webhookUrl = formData.get('webhookUrl') as string;
    const sessionId = formData.get('sessionId') as string;
    const message = formData.get('message') as string;

    // Validate required fields
    if (!file || !workflowId || !webhookUrl) {
      return NextResponse.json(
        { 
          success: false,
          errorCode: 'MISSING_FIELDS',
          errorMessage: 'Missing required fields: file, workflowId, or webhookUrl',
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

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

    // Prepare the request to the backend file upload endpoint
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('workflowId', workflowId);
    backendFormData.append('webhookUrl', webhookUrl);
    if (sessionId) {
      backendFormData.append('sessionId', sessionId);
    }
    if (message) {
      backendFormData.append('message', message);
    }

    // Call the backend file upload API
    const backendUrl =  'http://143.198.58.6:8080';
    
    // Choose endpoint based on user authentication status
    const endpoint = userId ? '/v1/api/n8n/authenticated/chat/file/direct' : '/v1/api/n8n/anonymous/chat/file/direct';
    
    // Prepare headers
    const headers: Record<string, string> = {};
    
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
      body: backendFormData,
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

    const uploadResponse = await response.json();
    
    // Return success with file reference
    return NextResponse.json({
      success: true,
      fileId: uploadResponse.fileId || `file_${Date.now()}`,
      fileReference: uploadResponse.fileReference || `ref_${Date.now()}`,
      message: 'File uploaded successfully',
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('File upload API error:', error);
    return NextResponse.json(
      {
        success: false,
        errorCode: 'INTERNAL_ERROR',
        errorMessage: 'Internal server error during file upload',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
