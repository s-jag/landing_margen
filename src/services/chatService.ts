import type { ChatRequest, ChatResponse, Citation, StreamEvent } from '@/types/chat';
import { generateMessageId, getCurrentTimestamp } from '@/lib/chatUtils';

// =============================================================================
// CHAT SERVICE INTERFACE
// =============================================================================

export interface ChatService {
  sendMessage(request: ChatRequest): Promise<ChatResponse>;
  streamMessage(request: ChatRequest): AsyncGenerator<StreamEvent>;
}

// =============================================================================
// REAL CHAT SERVICE (API Integration)
// =============================================================================

class RealChatService implements ChatService {
  /**
   * Send a synchronous message via the /api/query endpoint
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Use test endpoint that bypasses auth
    const response = await fetch('/api/test-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: request.message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }

    const data = await response.json();

    // Transform API response to ChatResponse format
    const citation: Citation | undefined = data.citations?.[0] ? {
      source: data.citations[0].citation,
      excerpt: data.citations[0].excerpt,
      fullText: data.sources?.[0]?.text,
    } : undefined;

    return {
      id: data.id || generateMessageId(),
      content: data.answer,
      timestamp: getCurrentTimestamp(),
      citation,
    };
  }

  /**
   * Stream a message via the /api/test-query endpoint (SSE) - bypasses auth
   * Includes client state and filing status for jurisdiction-specific answers
   */
  async *streamMessage(request: ChatRequest): AsyncGenerator<StreamEvent> {
    // Extract client context for RAG
    const clientContext = request.context?.clientData ? {
      state: request.context.clientData.state,
      filingStatus: request.context.clientData.filingStatus,
    } : undefined;

    // Use test endpoint that bypasses auth
    const response = await fetch('/api/test-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: request.message,
        clientContext,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      yield { type: 'error', error: 'REQUEST_FAILED', message: error.message || 'Failed to start stream' };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', error: 'NO_RESPONSE_BODY', message: 'No response body' };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            // Check for stream end
            if (data === '[DONE]') {
              return;
            }

            if (data) {
              try {
                const event = JSON.parse(data) as StreamEvent;
                yield event;
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// =============================================================================
// MOCK CHAT SERVICE (for development/fallback)
// =============================================================================

const MOCK_DELAY_MS = 1500;

class MockChatService implements ChatService {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

    return {
      id: generateMessageId(),
      content: `I can help you research tax questions for "${request.message}". The RAG API is not connected - using mock response.`,
      timestamp: getCurrentTimestamp(),
    };
  }

  async *streamMessage(request: ChatRequest): AsyncGenerator<StreamEvent> {
    // Simulate streaming with mock events
    yield { type: 'status', message: 'Starting query...' };
    await new Promise((resolve) => setTimeout(resolve, 500));

    yield { type: 'reasoning', step: 1, node: 'query_analysis', description: 'Analyzing query intent' };
    await new Promise((resolve) => setTimeout(resolve, 500));

    yield { type: 'reasoning', step: 2, node: 'knowledge_retrieval', description: 'Searching knowledge graph' };
    await new Promise((resolve) => setTimeout(resolve, 500));

    yield { type: 'chunk', chunks: [{ chunkId: 'mock-1', citation: 'Mock Citation', relevanceScore: 0.95 }] };
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockAnswer = `I can help you research tax questions for "${request.message}". The RAG API is not connected - using mock streaming response.`;

    // Stream answer in chunks
    const words = mockAnswer.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + ' ';
      yield { type: 'answer', content: chunk };
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    yield {
      type: 'complete',
      metadata: {
        requestId: 'mock-' + Date.now(),
        confidence: 0.85,
        processingTimeMs: 2000,
        citationCount: 1,
        sourceCount: 1,
      },
    };
  }
}

// =============================================================================
// SERVICE FACTORY
// =============================================================================

function createChatService(): ChatService {
  // Use real service by default, fall back to mock if needed
  // The real service will fail gracefully if the API is unavailable
  return new RealChatService();
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

export const chatService: ChatService = createChatService();

// Export mock service for testing
export const mockChatService: ChatService = new MockChatService();
