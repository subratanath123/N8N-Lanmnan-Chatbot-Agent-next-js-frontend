import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for file download from the File Attachment API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const backendUrl = process.env.NEXT_PUBLIC_ATTACHMENT_API_URL || process.env.ATTACHMENT_API_URL || 'http://localhost:8080';
    
    // Get query parameters (like chatbotId)
    const { searchParams } = new URL(request.url);
    const chatbotId = searchParams.get('chatbotId');
    
    // Build the backend URL with query parameters
    const url = new URL(`${backendUrl}/api/attachments/download/${fileId}`);
    if (chatbotId) {
      url.searchParams.append('chatbotId', chatbotId);
    }
    
    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }));
      return NextResponse.json(error, { status: response.status });
    }

    // Get the blob and forward it
    const blob = await response.blob();
    const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || fileId;
    
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': response.headers.get('content-length') || '',
      },
    });
  } catch (error) {
    console.error('Attachment download proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to download attachment',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

