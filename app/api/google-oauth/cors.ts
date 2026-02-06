import { NextRequest, NextResponse } from 'next/server';

/**
 * Add CORS headers to response
 * Allows requests from any origin (for widget embedding)
 */
export function addCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Handle null origin (file:// or other contexts)
  // Use referer as fallback, or allow all origins for widget embedding
  let allowedOrigin = '*';
  
  if (origin && origin !== 'null') {
    allowedOrigin = origin;
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      allowedOrigin = refererUrl.origin;
    } catch (e) {
      // Invalid referer, use wildcard
      allowedOrigin = '*';
    }
  }
  
  // Allow all origins for widget embedding (including null)
  // In production, you might want to restrict this to specific domains
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptions(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(request, response);
}

