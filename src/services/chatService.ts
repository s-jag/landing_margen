import type { ChatRequest, ChatResponse, Citation, StreamEvent } from '@/types/chat';
import { generateMessageId, getCurrentTimestamp } from '@/lib/chatUtils';
import { streamQueryByState, getStateCapabilities } from '@/services/ragService';
import type { UnifiedStreamEvent, UnifiedRAGResponse } from '@/types/rag';

// =============================================================================
// CHAT SERVICE INTERFACE
// =============================================================================

export interface ChatService {
  sendMessage(request: ChatRequest): Promise<ChatResponse>;
  streamMessage(request: ChatRequest): AsyncGenerator<StreamEvent>;
}

// =============================================================================
// HELPER: Transform Unified Events to Legacy StreamEvent
// =============================================================================

function transformUnifiedEvent(event: UnifiedStreamEvent): StreamEvent | null {
  switch (event.type) {
    case 'status':
      return { type: 'status', message: event.message };
    case 'reasoning':
      return {
        type: 'reasoning',
        step: event.step,
        node: event.node,
        description: event.description,
      };
    case 'chunk':
      return {
        type: 'chunk',
        chunks: event.chunks.map((c) => ({
          chunkId: c.chunkId || '',
          citation: c.citation,
          relevanceScore: c.relevanceScore,
          // Utah-specific fields
          authorityLevel: c.authorityLevel,
          sourceLabel: c.sourceLabel,
          link: c.link,
          // Capability flag - default to true for backward compatibility
          canDrillInto: c.canDrillInto ?? true,
        })),
      };
    case 'answer':
      return { type: 'answer', content: event.content };
    case 'complete':
      return {
        type: 'complete',
        metadata: {
          requestId: event.response.requestId,
          confidence: event.response.confidence,
          processingTimeMs: event.response.processingTimeMs,
          citationCount: event.response.citations.length,
          sourceCount: event.response.citations.length,
          // Utah-specific fields
          formsMentioned: event.response.formsMentioned,
          taxType: event.response.taxType,
          taxTypeLabel: event.response.taxTypeLabel,
          warnings: event.response.warnings,
          confidenceLabel: event.response.confidenceLabel,
        },
      };
    case 'error':
      return { type: 'error', error: event.error, message: event.message };
    default:
      return null;
  }
}

// Extended response with Utah-specific fields
export interface ExtendedChatResponse extends ChatResponse {
  formsMentioned?: string[];
  taxType?: string;
  taxTypeLabel?: string;
  warnings?: string[];
  confidenceLabel?: string;
  stateCapabilities?: {
    supportsStreaming: boolean;
    supportsSourceDrilldown: boolean;
    hasTaxForms: boolean;
    hasTaxTypeClassification: boolean;
    hasAuthorityLevels: boolean;
  };
}

// =============================================================================
// REAL CHAT SERVICE (API Integration)
// =============================================================================

class RealChatService implements ChatService {
  /**
   * Send a synchronous message via the /api/query endpoint
   * Falls back to test endpoint in development if auth fails
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Try production endpoint first
    let response = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: request.message,
      }),
    });

    if (!response.ok) {
      // Fall back to test endpoint in development (handles auth and validation errors)
      response = await fetch('/api/test-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: request.message,
        }),
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
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
   * Stream a message using state-based routing.
   * Routes to the appropriate RAG API (Utah, Florida, etc.) based on client state.
   * Automatically handles streaming vs non-streaming APIs (simulates streaming for Utah).
   */
  async *streamMessage(request: ChatRequest): AsyncGenerator<StreamEvent> {
    // Extract client context for RAG routing
    const clientState = request.context?.clientData?.state || 'FL';
    const clientContext = request.context?.clientData ? {
      state: request.context.clientData.state,
      filingStatus: request.context.clientData.filingStatus,
    } : undefined;

    try {
      // Use state-based routing - automatically routes to correct API
      // and handles streaming/non-streaming differences
      for await (const event of streamQueryByState(
        request.message,
        clientState,
        undefined,
        clientContext
      )) {
        const transformedEvent = transformUnifiedEvent(event);
        if (transformedEvent) {
          yield transformedEvent;
        }
      }
    } catch (error) {
      // If state-based routing fails, fall back to legacy API approach
      console.warn('State-based routing failed, falling back to legacy API:', error);
      yield* this.legacyStreamMessage(request);
    }
  }

  /**
   * Legacy stream method that uses the /api/query/stream endpoint directly.
   * Used as fallback if state-based routing fails.
   */
  private async *legacyStreamMessage(request: ChatRequest): AsyncGenerator<StreamEvent> {
    const clientContext = request.context?.clientData ? {
      state: request.context.clientData.state,
      filingStatus: request.context.clientData.filingStatus,
    } : undefined;

    // Try production endpoint first
    let response = await fetch('/api/query/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: request.message,
        clientContext,
      }),
    });

    if (!response.ok) {
      // Fall back to test endpoint in development
      response = await fetch('/api/test-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: request.message,
          clientContext,
        }),
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
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

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

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

    yield { type: 'chunk', chunks: [{ chunkId: 'mock-1', citation: 'Mock Citation', relevanceScore: 0.95, canDrillInto: true }] };
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
