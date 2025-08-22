import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${requestId}] Test API GET called at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Request URL: ${request.url}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()));
    console.log(`[${requestId}] Environment check - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[${requestId}] Environment check - VERCEL: ${process.env.VERCEL}`);
    console.log(`[${requestId}] Environment check - VERCEL_ENV: ${process.env.VERCEL_ENV}`);
    
    const endTime = Date.now();
    console.log(`[${requestId}] Test API completed successfully in ${endTime - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Test API is working!',
      timestamp: new Date().toISOString(),
      requestId,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        vercelEnv: process.env.VERCEL_ENV
      },
      headers: Object.fromEntries(request.headers.entries())
    });
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`[${requestId}] Test API error after ${endTime - startTime}ms:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Test API error',
        requestId,
        timestamp: new Date().toISOString(),
        errorDetails: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${requestId}] Test API POST called at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Request URL: ${request.url}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()));
    
    const body = await request.json().catch(() => ({}));
    console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));
    
    const endTime = Date.now();
    console.log(`[${requestId}] Test API POST completed successfully in ${endTime - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Test API POST is working!',
      timestamp: new Date().toISOString(),
      requestId,
      receivedData: body
    });
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`[${requestId}] Test API POST error after ${endTime - startTime}ms:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Test API POST error',
        requestId,
        timestamp: new Date().toISOString(),
        errorDetails: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
