import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  message: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  sessionId: string;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
  }>;
  // N8N specific fields
  n8nWorkflowId?: string;
  n8nWebhookUrl?: string;
  n8nAdditionalParams?: Record<string, any>;
}

interface ChatResponse {
  response: string;
  sessionId?: string;
  error?: string;
}

// In-memory session storage (in production, use a database)
const sessions = new Map<string, any>();

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${requestId}] Chat API POST called at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Request URL: ${request.url}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()));
    
    const body: ChatRequest = await request.json();
    console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));
    
    const { message, model, temperature, systemPrompt, sessionId, attachments, n8nWorkflowId, n8nWebhookUrl, n8nAdditionalParams } = body;

    // Validate required fields
    if (!message || !model || !sessionId) {
      console.log(`[${requestId}] Validation failed - missing required fields`);
      console.log(`[${requestId}] message: ${!!message}, model: ${!!model}, sessionId: ${!!sessionId}`);
      return NextResponse.json(
        { error: 'Missing required fields: message, model, or sessionId' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Validation passed, processing request...`);

    // Store or update session
    if (!sessions.has(sessionId)) {
      console.log(`[${requestId}] Creating new session: ${sessionId}`);
      sessions.set(sessionId, {
        id: sessionId,
        createdAt: new Date(),
        messages: [],
        model: model,
        temperature: temperature,
        systemPrompt: systemPrompt
      });
    } else {
      console.log(`[${requestId}] Using existing session: ${sessionId}`);
    }

    const session = sessions.get(sessionId);
    session.lastActivity = new Date();
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachments: attachments || []
    });

    console.log(`[${requestId}] Session updated, messages count: ${session.messages.length}`);

    // Prepare the request to the AI service
    const aiRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        ...session.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      model: model,
      temperature: temperature,
      max_tokens: 1000
    };

    console.log(`[${requestId}] AI request prepared:`, JSON.stringify(aiRequest, null, 2));

    // Check if N8N should be used
    let aiResponse: string;
    if (model === 'n8n-workflow' && n8nWorkflowId && n8nWebhookUrl) {
      console.log(`[${requestId}] Using N8N service with workflow: ${n8nWorkflowId}`);
      aiResponse = await callN8NService(message, n8nWorkflowId, n8nWebhookUrl, sessionId, n8nAdditionalParams);
    } else {
      console.log(`[${requestId}] Using regular AI service: ${model}`);
      aiResponse = await callAIService(aiRequest, model);
    }

    console.log(`[${requestId}] AI response received, length: ${aiResponse.length}`);

    // Store the AI response in session
    session.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Update session
    sessions.set(sessionId, session);

    const response: ChatResponse = {
      response: aiResponse,
      sessionId: sessionId
    };

    const endTime = Date.now();
    console.log(`[${requestId}] Request completed successfully in ${endTime - startTime}ms`);
    
    return NextResponse.json(response);

  } catch (error) {
    const endTime = Date.now();
    console.error(`[${requestId}] Chat API error after ${endTime - startTime}ms:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${requestId}] Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error', requestId, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

// Function to call AI service based on the selected model
async function callN8NService(message: string, workflowId: string, webhookUrl: string, sessionId?: string, additionalParams?: Record<string, any>): Promise<string> {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] N8N service called with workflow: ${workflowId}`);
  
  try {
    const n8nRequest = {
      message: {
        role: 'user',
        content: message
      },
      workflowId,
      webhookUrl,
      sessionId,
      additionalParams
    };

    console.log(`[${requestId}] N8N request payload:`, JSON.stringify(n8nRequest, null, 2));

    const backendUrl =  'http://143.198.58.6:8080';
    const fullUrl = `${backendUrl}/v1/api/n8n/chat/custom`;
    console.log(`[${requestId}] Calling N8N backend at: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nRequest),
    });

    console.log(`[${requestId}] N8N response status: ${response.status}`);
    console.log(`[${requestId}] N8N response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] N8N service error: ${response.status} - ${errorText}`);
      throw new Error(`N8N service error: ${response.status} - ${errorText}`);
    }

    const n8nResponse = await response.json();
    console.log(`[${requestId}] N8N response data:`, JSON.stringify(n8nResponse, null, 2));
    
    if (!n8nResponse.success) {
      console.error(`[${requestId}] N8N workflow failed:`, n8nResponse.errorMessage);
      throw new Error(n8nResponse.errorMessage || 'N8N workflow failed');
    }

    console.log(`[${requestId}] N8N service completed successfully`);
    return n8nResponse.data?.toString() || 'No response from N8N workflow';
  } catch (error) {
    console.error(`[${requestId}] N8N service error:`, error);
    console.error(`[${requestId}] N8N error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`Failed to call N8N service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function callAIService(request: any, model: string): Promise<string> {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] AI service called with model: ${model}`);
  
  try {
    // This is where you would integrate with actual AI services
    // For now, we'll simulate different responses based on the model
    
    const modelResponses: { [key: string]: string } = {
      'gpt-4': `I understand you said: "${request.messages[request.messages.length - 1].content}". As GPT-4, I can provide detailed and nuanced responses. This is a simulated response, but in a real implementation, this would connect to the OpenAI API with proper authentication and rate limiting.`,
      'gpt-3.5-turbo': `You mentioned: "${request.messages[request.messages.length - 1].content}". As GPT-3.5 Turbo, I can help with a wide range of tasks efficiently. This is a simulated response for demonstration purposes.`,
      'claude-3': `Regarding "${request.messages[request.messages.length - 1].content}": As Claude 3, I aim to be helpful, harmless, and honest. This is a simulated response showing how the interface would work with different models.`,
      'llama-2': `You asked about: "${request.messages[request.messages.length - 1].content}". As Llama 2, I can assist with various tasks. This is a simulated response demonstrating the multi-model interface.`,
      'gemini-pro': `About "${request.messages[request.messages.length - 1].content}": As Gemini Pro, I can help with creative and analytical tasks. This is a simulated response showing the interface capabilities.`
    };

    console.log(`[${requestId}] Using simulated response for model: ${model}`);

    // Simulate API delay
    const delay = 1000 + Math.random() * 1000;
    console.log(`[${requestId}] Simulating API delay: ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));

    const response = modelResponses[model] || modelResponses['gpt-4'];
    console.log(`[${requestId}] AI service completed successfully`);
    
    return response;

    // Example of how to integrate with actual AI services:
    /*
    if (model.startsWith('gpt-')) {
      // OpenAI API integration
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      return data.choices[0].message.content;
    } else if (model.startsWith('claude-')) {
      // Anthropic API integration
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: request.max_tokens,
          messages: request.messages,
          temperature: request.temperature,
        }),
      });
      
      const data = await response.json();
      return data.content[0].text;
    }
    */

  } catch (error) {
    console.error(`[${requestId}] AI service error:`, error);
    console.error(`[${requestId}] AI service error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    throw new Error('Failed to get response from AI service');
  }
}

// Optional: Add a GET endpoint to retrieve session history
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${requestId}] Chat API GET called at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Request URL: ${request.url}`);
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    console.log(`[${requestId}] Session ID from query: ${sessionId}`);

    if (!sessionId) {
      console.log(`[${requestId}] Validation failed - missing sessionId`);
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = sessions.get(sessionId);
    if (!session) {
      console.log(`[${requestId}] Session not found: ${sessionId}`);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log(`[${requestId}] Session found, returning data`);
    const endTime = Date.now();
    console.log(`[${requestId}] GET request completed successfully in ${endTime - startTime}ms`);

    return NextResponse.json({
      sessionId: session.id,
      messages: session.messages,
      model: session.model,
      temperature: session.temperature,
      systemPrompt: session.systemPrompt,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    });

  } catch (error) {
    const endTime = Date.now();
    console.error(`[${requestId}] Chat API GET error after ${endTime - startTime}ms:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { error: 'Internal server error', requestId, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
} 