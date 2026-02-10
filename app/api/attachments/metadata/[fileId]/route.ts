import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for getting file metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const backendUrl = process.env.NEXT_PUBLIC_ATTACHMENT_API_URL || process.env.ATTACHMENT_API_URL || 'http://localhost:8080';
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const chatbotId = searchParams.get('chatbotId');
    
    // Build the backend URL
    const url = new URL(`${backendUrl}/api/attachments/metadata/${fileId}`);
    if (chatbotId) {
      url.searchParams.append('chatbotId', chatbotId);
    }
    
    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get metadata' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Attachment metadata proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to get file metadata',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

