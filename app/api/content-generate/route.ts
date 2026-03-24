import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, templateId, fields } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    let token: string | null = null;
    try {
      const { getToken } = await auth();
      token = await getToken();
    } catch {
      // unauthenticated — allowed in some configs
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

    // Try the dedicated backend content endpoint first
    if (backendUrl) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${backendUrl}/v1/api/content/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt, templateId, fields }),
        });

        if (res.ok) {
          const data = await res.json();
          const text =
            data.content || data.text || data.result || data.output ||
            data.message || (typeof data === 'string' ? data : null);
          if (text) return NextResponse.json({ content: text });
        }
      } catch {
        // fall through to N8N
      }
    }

    // Fallback: N8N chat webhook
    const webhookUrl = process.env.N8N_CONTENT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: { role: 'user', content: prompt },
          sessionId: `content-${templateId}-${Date.now()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text =
          data.output || data.content || data.text || data.message ||
          data?.message?.content || (typeof data === 'string' ? data : null);
        if (text) return NextResponse.json({ content: text });
      }
    }

    return NextResponse.json(
      { error: 'No AI backend configured. Set NEXT_PUBLIC_BACKEND_URL or N8N_CONTENT_WEBHOOK_URL.' },
      { status: 503 }
    );
  } catch (err) {
    console.error('[content-generate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
