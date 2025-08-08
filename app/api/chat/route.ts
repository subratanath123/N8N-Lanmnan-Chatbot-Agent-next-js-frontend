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
  try {
    const body: ChatRequest = await request.json();
    const { message, model, temperature, systemPrompt, sessionId, attachments, n8nWorkflowId, n8nWebhookUrl, n8nAdditionalParams } = body;

    // Validate required fields
    if (!message || !model || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, model, or sessionId' },
        { status: 400 }
      );
    }

    // Store or update session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        id: sessionId,
        createdAt: new Date(),
        messages: [],
        model: model,
        temperature: temperature,
        systemPrompt: systemPrompt
      });
    }

    const session = sessions.get(sessionId);
    session.lastActivity = new Date();
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachments: attachments || []
    });

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

    // Check if N8N should be used
    let aiResponse: string;
    if (model === 'n8n-workflow' && n8nWorkflowId && n8nWebhookUrl) {
      // Use N8N service
      aiResponse = await callN8NService(message, n8nWorkflowId, n8nWebhookUrl, sessionId, n8nAdditionalParams);
    } else {
      // Use regular AI service (OpenAI, Anthropic, etc.)
      aiResponse = await callAIService(aiRequest, model);
    }

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

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to call AI service based on the selected model
async function callN8NService(message: string, workflowId: string, webhookUrl: string, sessionId?: string, additionalParams?: Record<string, any>): Promise<string> {
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

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/v1/api/n8n/chat/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nRequest),
    });

    if (!response.ok) {
      throw new Error(`N8N service error: ${response.status}`);
    }

    const n8nResponse = await response.json();
    
    if (!n8nResponse.success) {
      throw new Error(n8nResponse.errorMessage || 'N8N workflow failed');
    }

    return n8nResponse.data?.toString() || 'No response from N8N workflow';
  } catch (error) {
    console.error('N8N service error:', error);
    throw new Error(`Failed to call N8N service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function callAIService(request: any, model: string): Promise<string> {
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

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    return modelResponses[model] || modelResponses['gpt-4'];

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
    console.error('AI service error:', error);
    throw new Error('Failed to get response from AI service');
  }
}

// Optional: Add a GET endpoint to retrieve session history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

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
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 