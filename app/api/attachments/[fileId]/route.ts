import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for deleting files
 */
export async function DELETE(
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
    const url = new URL(`${backendUrl}/api/attachments/${fileId}`);
    if (chatbotId) {
      url.searchParams.append('chatbotId', chatbotId);
    }
    
    const response = await fetch(url.toString(), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete file' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Attachment delete proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete file',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

