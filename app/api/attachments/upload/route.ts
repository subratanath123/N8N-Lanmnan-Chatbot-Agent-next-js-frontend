import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for file upload to the File Attachment API
 * Forwards multipart/form-data requests to the backend attachment service
 */
export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_ATTACHMENT_API_URL || process.env.ATTACHMENT_API_URL || 'http://localhost:8080';
    
    // Forward the request directly to the backend
    const formData = await request.formData();
    
    const response = await fetch(`${backendUrl}/api/attachments/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Attachment upload proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to upload attachment',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

