import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for listing files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  try {
    const { chatbotId } = params;
    const backendUrl = process.env.NEXT_PUBLIC_ATTACHMENT_API_URL || process.env.ATTACHMENT_API_URL || 'http://localhost:8080';
    
    const response = await fetch(`${backendUrl}/api/attachments/list/${chatbotId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to list files' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Attachment list proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to list files',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

