import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for backend file download (GET /v1/api/file/{fileId}).
 * Used for avatar images when they are stored in the backend file service.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend URL not configured' }, { status: 500 });
    }
    const base = backendUrl.replace(/\/$/, '');
    const url = `${base}/v1/api/file/${fileId}`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }));
      return NextResponse.json(error, { status: response.status });
    }
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('File download proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}
