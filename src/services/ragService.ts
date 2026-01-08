import type {
  QueryOptions,
  RAGQueryResponse,
  SourceDetail,
  StatuteWithRules,
  RelatedDocuments,
  HealthResponse,
  StreamEvent,
} from '@/types/api';
import { ragProviderRegistry } from '@/services/rag';
import type { UnifiedRAGResponse, UnifiedStreamEvent, ClientContext } from '@/types/rag';

// =============================================================================
// CONFIGURATION
// =============================================================================

const RAG_API_BASE_URL = process.env.RAG_API_BASE_URL || 'http://localhost:8000';
const RAG_API_KEY = process.env.RAG_API_KEY || '';

const DEFAULT_TIMEOUT = 60000; // 60 seconds

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (RAG_API_KEY) {
    headers['Authorization'] = `Bearer ${RAG_API_KEY}`;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage: string;

    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorJson.error || `HTTP ${response.status}`;
    } catch {
      errorMessage = errorBody || `HTTP ${response.status}`;
    }

    throw new Error(`RAG API Error: ${errorMessage}`);
  }

  return response.json();
}

// =============================================================================
// STATE-BASED RAG SERVICE (NEW - Uses Provider Registry)
// =============================================================================

/**
 * Query the appropriate RAG API based on client state.
 * Routes to Utah API for UT clients, Florida API for FL clients, etc.
 */
export async function queryByState(
  query: string,
  stateCode: string,
  options?: QueryOptions,
  clientContext?: ClientContext
): Promise<UnifiedRAGResponse> {
  const provider = ragProviderRegistry.getProvider(stateCode);
  return provider.query(query, options, clientContext);
}

/**
 * Stream query to the appropriate RAG API based on client state.
 * Note: Not all state APIs support streaming - will be simulated if not supported.
 */
export async function* streamQueryByState(
  query: string,
  stateCode: string,
  options?: QueryOptions,
  clientContext?: ClientContext
): AsyncGenerator<UnifiedStreamEvent> {
  const provider = ragProviderRegistry.getProvider(stateCode);
  yield* provider.streamQuery(query, options, clientContext);
}

/**
 * Check if a state has its own dedicated RAG API.
 */
export function hasStateProvider(stateCode: string): boolean {
  return ragProviderRegistry.hasProvider(stateCode);
}

/**
 * Get the capabilities for a state's RAG provider.
 */
export function getStateCapabilities(stateCode: string) {
  const provider = ragProviderRegistry.getProvider(stateCode);
  return provider.getCapabilities();
}

// =============================================================================
// RAG SERVICE
// =============================================================================

export const ragService = {
  /**
   * Execute a synchronous RAG query
   */
  async query(
    query: string,
    options?: QueryOptions
  ): Promise<RAGQueryResponse> {
    const response = await fetch(`${RAG_API_BASE_URL}/api/v1/query`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        query,
        options: {
          doc_types: options?.docTypes,
          tax_year: options?.taxYear,
          expand_graph: options?.expandGraph ?? true,
          include_reasoning: options?.includeReasoning ?? false,
          timeout_seconds: options?.timeoutSeconds ?? 60,
        },
      }),
      signal: AbortSignal.timeout(options?.timeoutSeconds ? options.timeoutSeconds * 1000 : DEFAULT_TIMEOUT),
    });

    return handleResponse<RAGQueryResponse>(response);
  },

  /**
   * Execute a streaming RAG query
   * Returns an async generator that yields StreamEvent objects
   * Accepts optional client context for jurisdiction-specific answers
   */
  async *streamQuery(
    query: string,
    options?: QueryOptions,
    clientContext?: { state?: string; filingStatus?: string }
  ): AsyncGenerator<StreamEvent> {
    // Build the query with client context if provided
    let enrichedQuery = query;
    if (clientContext?.state) {
      enrichedQuery = `[Client State: ${clientContext.state}${clientContext.filingStatus ? `, Filing Status: ${clientContext.filingStatus}` : ''}] ${query}`;
    }

    const response = await fetch(`${RAG_API_BASE_URL}/api/v1/query/stream`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        query: enrichedQuery,
        options: {
          doc_types: options?.docTypes,
          tax_year: options?.taxYear,
          expand_graph: options?.expandGraph ?? true,
          include_reasoning: options?.includeReasoning ?? false,
          timeout_seconds: options?.timeoutSeconds ?? 60,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield {
        type: 'error',
        error: 'REQUEST_FAILED',
        message: `RAG API Error: ${errorText}`,
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield {
        type: 'error',
        error: 'NO_RESPONSE_BODY',
        message: 'No response body from RAG API',
      };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEventType = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (split by double newline for event boundaries)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          // Track event type from "event:" lines
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          }
          // Process data lines
          else if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data) {
              try {
                const jsonData = JSON.parse(data);
                // Add the event type to the data if we have one
                const eventWithType = currentEventType
                  ? { ...jsonData, _eventType: currentEventType }
                  : jsonData;
                yield transformRAGEvent(eventWithType);
              } catch {
                // Skip malformed JSON
              }
            }
            // Reset event type after processing
            currentEventType = '';
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  /**
   * Get detailed information about a source chunk
   */
  async getSource(chunkId: string): Promise<SourceDetail> {
    const response = await fetch(
      `${RAG_API_BASE_URL}/api/v1/sources/${encodeURIComponent(chunkId)}`,
      {
        method: 'GET',
        headers: getHeaders(),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
      }
    );

    const data = await handleResponse<{
      chunk_id: string;
      doc_id: string;
      doc_type: string;
      level: string;
      text: string;
      text_with_ancestry: string;
      ancestry: string;
      citation: string;
      effective_date?: string;
      token_count: number;
      parent_chunk_id?: string;
      child_chunk_ids: string[];
      related_doc_ids: string[];
    }>(response);

    return {
      chunkId: data.chunk_id,
      docId: data.doc_id,
      docType: data.doc_type as 'statute' | 'rule' | 'case' | 'taa',
      level: data.level,
      text: data.text,
      textWithAncestry: data.text_with_ancestry,
      ancestry: data.ancestry,
      citation: data.citation,
      effectiveDate: data.effective_date,
      tokenCount: data.token_count,
      parentChunkId: data.parent_chunk_id,
      childChunkIds: data.child_chunk_ids,
      relatedDocIds: data.related_doc_ids,
    };
  },

  /**
   * Get a statute with its implementing rules and interpreting documents
   */
  async getStatute(section: string): Promise<StatuteWithRules> {
    const response = await fetch(
      `${RAG_API_BASE_URL}/api/v1/statute/${encodeURIComponent(section)}`,
      {
        method: 'GET',
        headers: getHeaders(),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
      }
    );

    const data = await handleResponse<{
      statute: {
        doc_id: string;
        title: string;
        text: string;
        effective_date: string;
      };
      implementing_rules: Array<{ doc_id: string; title: string; citation: string }>;
      interpreting_cases: Array<{ doc_id: string; title: string; citation: string }>;
      interpreting_taas: Array<{ doc_id: string; title: string; citation: string }>;
    }>(response);

    return {
      statute: {
        docId: data.statute.doc_id,
        title: data.statute.title,
        text: data.statute.text,
        effectiveDate: data.statute.effective_date,
      },
      implementingRules: data.implementing_rules.map((r) => ({
        docId: r.doc_id,
        title: r.title,
        citation: r.citation,
      })),
      interpretingCases: data.interpreting_cases.map((c) => ({
        docId: c.doc_id,
        title: c.title,
        citation: c.citation,
      })),
      interpretingTaas: data.interpreting_taas.map((t) => ({
        docId: t.doc_id,
        title: t.title,
        citation: t.citation,
      })),
    };
  },

  /**
   * Get documents related via citations
   */
  async getRelatedDocs(docId: string): Promise<RelatedDocuments> {
    const response = await fetch(
      `${RAG_API_BASE_URL}/api/v1/graph/${encodeURIComponent(docId)}/related`,
      {
        method: 'GET',
        headers: getHeaders(),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
      }
    );

    const data = await handleResponse<{
      doc_id: string;
      citing_documents: Array<{ doc_id: string; doc_type: string; citation: string }>;
      cited_documents: Array<{ doc_id: string; doc_type: string; citation: string }>;
      interpretation_chain?: {
        implementing_rules: Array<{ doc_id: string; citation: string }>;
        interpreting_cases: Array<{ doc_id: string; citation: string }>;
        interpreting_taas: Array<{ doc_id: string; citation: string }>;
      };
    }>(response);

    return {
      docId: data.doc_id,
      citingDocuments: data.citing_documents.map((d) => ({
        docId: d.doc_id,
        docType: d.doc_type,
        citation: d.citation,
      })),
      citedDocuments: data.cited_documents.map((d) => ({
        docId: d.doc_id,
        docType: d.doc_type,
        citation: d.citation,
      })),
      interpretationChain: data.interpretation_chain
        ? {
            implementingRules: data.interpretation_chain.implementing_rules.map((r) => ({
              docId: r.doc_id,
              citation: r.citation,
            })),
            interpretingCases: data.interpretation_chain.interpreting_cases.map((c) => ({
              docId: c.doc_id,
              citation: c.citation,
            })),
            interpretingTaas: data.interpretation_chain.interpreting_taas.map((t) => ({
              docId: t.doc_id,
              citation: t.citation,
            })),
          }
        : undefined,
    };
  },

  /**
   * Check the health of the RAG API and its services
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${RAG_API_BASE_URL}/api/v1/health`, {
        method: 'GET',
        headers: getHeaders(),
        signal: AbortSignal.timeout(10000), // 10 second timeout for health check
      });

      const data = await handleResponse<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Array<{
          name: string;
          healthy: boolean;
          latency_ms?: number;
          error?: string;
        }>;
        timestamp: string;
      }>(response);

      return {
        status: data.status,
        services: data.services.map((s) => ({
          name: s.name,
          healthy: s.healthy,
          latencyMs: s.latency_ms,
          error: s.error,
        })),
        timestamp: data.timestamp,
      };
    } catch (error) {
      // Return unhealthy status if we can't reach the RAG API
      return {
        status: 'unhealthy',
        services: [
          {
            name: 'rag-api',
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        timestamp: new Date().toISOString(),
      };
    }
  },
};

// =============================================================================
// HELPER: Transform RAG API events to our format
// =============================================================================

function transformRAGEvent(event: Record<string, unknown>): StreamEvent {
  const eventType = event._eventType as string | undefined;

  // Use explicit event type from SSE if available
  switch (eventType) {
    case 'status':
      return {
        type: 'status',
        message: (event.description as string) || (event.node as string) || JSON.stringify(event),
      };

    case 'reasoning':
      return {
        type: 'reasoning',
        step: (event.step_number as number) || 0,
        node: (event.node as string) || 'processing',
        description: (event.description as string) || '',
      };

    case 'chunk':
      // Single chunk from FastAPI
      return {
        type: 'chunk',
        chunks: [{
          chunkId: event.chunk_id as string,
          citation: event.citation as string,
          relevanceScore: (event.relevance_score as number) || 0.5,
        }],
      };

    case 'answer':
      return {
        type: 'answer',
        content: (event.answer as string) || (event.content as string) || (event.text as string) || '',
      };

    case 'complete':
      return {
        type: 'complete',
        metadata: {
          requestId: (event.request_id as string) || '',
          confidence: (event.confidence as number) || 0,
          processingTimeMs: (event.processing_time_ms as number) || 0,
          citationCount: (event.citation_count as number) || 0,
          sourceCount: (event.source_count as number) || 0,
        },
      };

    case 'error':
      return {
        type: 'error',
        error: (event.error as string) || 'UNKNOWN_ERROR',
        message: (event.message as string) || 'Unknown error',
      };
  }

  // Fallback: Try to infer event type from content (for backwards compatibility)
  if ('answer' in event && typeof event.answer === 'string') {
    return { type: 'answer', content: event.answer };
  }

  if ('request_id' in event && 'confidence' in event) {
    return {
      type: 'complete',
      metadata: {
        requestId: event.request_id as string,
        confidence: event.confidence as number,
        processingTimeMs: (event.processing_time_ms as number) || 0,
        citationCount: (event.citation_count as number) || 0,
        sourceCount: (event.source_count as number) || 0,
      },
    };
  }

  if ('error' in event) {
    return {
      type: 'error',
      error: event.error as string,
      message: (event.message as string) || 'Unknown error',
    };
  }

  // Unknown event type - treat as status
  return { type: 'status', message: JSON.stringify(event) };
}
