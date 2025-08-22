import { NextRequest, NextResponse } from 'next/server';
import { N8NRequest, N8NResponse } from '../../../src/component/openwebui/types';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const body: N8NRequest = await request.json();
    const { message, workflowId, webhookUrl, sessionId, additionalParams, attachments, fileReferences } = body;

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
      // Use fileReferences if available, otherwise fall back to attachments
      fileReferences: fileReferences || [],
      attachments: attachments || [], // Keep for backward compatibility
      // Include attachment metadata with mimetype info if attachments exist
      attachmentMetadata: (attachments && attachments.length > 0) ? attachments.map(att => ({
        name: att.name,
        size: att.size,
        type: att.type,
        mimetype: att.type, // Explicit mimetype field
        base64: att.base64
      })) : [],
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
    const backendUrl =  'https://chat-api-2187.onrender.com';
    
    // Choose endpoint based on user authentication status
    const endpoint = userId ? '/v1/api/n8n/authenticated/chat/custom' : '/v1/api/n8n/anonymous/chat/custom';
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add attachment-related headers if attachments or fileReferences are present
    if ((attachments && attachments.length > 0) || (fileReferences && fileReferences.length > 0)) {
      const totalCount = (attachments?.length || 0) + (fileReferences?.length || 0);
      console.log(`Processing request with ${totalCount} file(s) - ${attachments?.length || 0} attachments + ${fileReferences?.length || 0} file references`);
      
      headers['X-Has-Files'] = 'true';
      headers['X-File-Count'] = totalCount.toString();
      
      // Add headers for base64 attachments if present
      if (attachments && attachments.length > 0) {
        headers['X-Has-Attachments'] = 'true';
        headers['X-Attachment-Count'] = attachments.length.toString();
        
        // Add MIME type information for all attachments
        attachments.forEach((attachment, index) => {
          const prefix = index === 0 ? 'X-Attachment' : `X-Attachment-${index + 1}`;
          headers[`${prefix}-Type`] = attachment.type;
          headers[`${prefix}-Name`] = attachment.name;
          headers[`${prefix}-Size`] = attachment.size.toString();
          headers[`${prefix}-MimeType`] = attachment.type; // Explicit MIME type header
        });
      }
      
      // Add headers for file references if present
      if (fileReferences && fileReferences.length > 0) {
        headers['X-Has-File-References'] = 'true';
        headers['X-File-Reference-Count'] = fileReferences.length.toString();
        
        // Add file reference information
        fileReferences.forEach((fileRef, index) => {
          const prefix = index === 0 ? 'X-File-Reference' : `X-File-Reference-${index + 1}`;
          headers[`${prefix}`] = fileRef;
        });
      }
      
      // Add comprehensive file info header
      const fileInfo = [
        ...(attachments || []).map(att => `ATTACHMENT:${att.name}:${att.type}:${att.size}`),
        ...(fileReferences || []).map(ref => `REFERENCE:${ref}`)
      ].join(';');
      headers['X-File-Info'] = fileInfo;
      
      console.log(`File headers added: ${Object.keys(headers).filter(key => key.startsWith('X-')).join(', ')}`);
    } else {
      console.log('No files in request');
    }
    
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

    headers['sessionId'] = sessionId || crypto.randomUUID(); //todo::fix this, otherwise  conversation will not be be relevant

    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(n8nRequest),
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
    const backendUrl =  'https://chat-api-2187.onrender.com';
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
