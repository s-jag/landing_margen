// =============================================================================
// FLORIDA RAG PROVIDER
// =============================================================================
// Provider for the Florida Tax RAG API with streaming support.

import { BaseRAGProvider } from './BaseRAGProvider';
import type { StateRAGConfig } from '@/config/stateConfig';
import type {
  QueryOptions,
  ClientContext,
  UnifiedRAGResponse,
  UnifiedStreamEvent,
  UnifiedCitation,
  FloridaQueryResponseRaw,
} from '@/types/rag';

export class FloridaRAGProvider extends BaseRAGProvider {
  constructor(config: StateRAGConfig) {
    super(config);
  }

  // =============================================================================
  // QUERY (Synchronous)
  // =============================================================================

  async query(
    query: string,
    options?: QueryOptions,
    clientContext?: ClientContext
  ): Promise<UnifiedRAGResponse> {
    const startTime = Date.now();
    const enrichedQuery = this.enrichQuery(query, clientContext);

    try {
      const response = await fetch(this.buildUrl(this.config.endpoints.query), {
        method: 'POST',
        headers: this.getHeaders(),
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
        signal: AbortSignal.timeout(this.getTimeout(options)),
      });

      const data = await this.handleResponse<FloridaQueryResponseRaw>(response);
      return this.transformResponse(data, Date.now() - startTime);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  // =============================================================================
  // STREAM QUERY (SSE)
  // =============================================================================

  async *streamQuery(
    query: string,
    options?: QueryOptions,
    clientContext?: ClientContext
  ): AsyncGenerator<UnifiedStreamEvent> {
    const enrichedQuery = this.enrichQuery(query, clientContext);

    // If no stream endpoint, fall back to simulated streaming
    if (!this.config.endpoints.queryStream) {
      const response = await this.query(query, options, clientContext);
      yield* this.simulateStreaming(response);
      return;
    }

    let response: Response;
    try {
      response = await fetch(this.buildUrl(this.config.endpoints.queryStream), {
        method: 'POST',
        headers: this.getStreamHeaders(),
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
    } catch (error) {
      yield* this.createErrorStream(error);
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      yield {
        type: 'error',
        error: 'REQUEST_FAILED',
        message: `Florida RAG API Error: ${errorText}`,
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield {
        type: 'error',
        error: 'NO_RESPONSE_BODY',
        message: 'No response body from Florida RAG API',
      };
      return;
    }

    yield* this.processSSEStream(reader);
  }

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  async checkHealth(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; message?: string }> {
    try {
      const response = await fetch(this.buildUrl(this.config.endpoints.health), {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { status: 'unhealthy', message: `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { status: data.status || 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // =============================================================================
  // SOURCE DRILL-DOWN (Florida-specific)
  // =============================================================================

  async getSource(chunkId: string): Promise<{
    chunkId: string;
    docId: string;
    docType: string;
    text: string;
    textWithAncestry: string;
    citation: string;
    effectiveDate?: string;
  } | null> {
    if (!this.config.endpoints.sources) {
      return null;
    }

    try {
      const response = await fetch(
        this.buildUrl(`${this.config.endpoints.sources}/${encodeURIComponent(chunkId)}`),
        {
          method: 'GET',
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        chunkId: data.chunk_id,
        docId: data.doc_id,
        docType: data.doc_type,
        text: data.text,
        textWithAncestry: data.text_with_ancestry,
        citation: data.citation,
        effectiveDate: data.effective_date,
      };
    } catch {
      return null;
    }
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private transformResponse(
    raw: FloridaQueryResponseRaw,
    processingTimeMs: number
  ): UnifiedRAGResponse {
    const citations: UnifiedCitation[] = raw.sources.map((source) => ({
      text: source.text,
      citation: source.citation,
      source: source.doc_type,
      relevanceScore: source.relevance_score,
      docType: source.doc_type,
      docId: source.doc_id,
      chunkId: source.chunk_id,
    }));

    return {
      requestId: raw.request_id,
      response: raw.answer,
      citations,
      confidence: raw.confidence,
      warnings: raw.warnings || [],
      processingTimeMs: raw.processing_time_ms || processingTimeMs,
      reasoningSteps: raw.reasoning_steps?.map((step) => ({
        stepNumber: step.step_number,
        node: step.node,
        description: step.description,
      })),
      stageTimings: raw.stage_timings,
      stateCode: this.config.stateCode,
      capabilities: this.config.capabilities,
    };
  }

  private async *processSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>
  ): AsyncGenerator<UnifiedStreamEvent> {
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEventType = '';
    const collectedCitations: UnifiedCitation[] = [];
    let fullAnswer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data) {
              try {
                const jsonData = JSON.parse(data);
                const event = this.transformStreamEvent(
                  jsonData,
                  currentEventType,
                  collectedCitations,
                  fullAnswer
                );

                if (event) {
                  if (event.type === 'answer') {
                    fullAnswer += event.content;
                  }
                  if (event.type === 'chunk') {
                    collectedCitations.push(...event.chunks);
                  }
                  yield event;
                }
              } catch {
                // Skip malformed JSON
              }
            }
            currentEventType = '';
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private transformStreamEvent(
    event: Record<string, unknown>,
    eventType: string,
    _collectedCitations: UnifiedCitation[],
    _fullAnswer: string
  ): UnifiedStreamEvent | null {
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
        return {
          type: 'chunk',
          chunks: [{
            text: (event.text as string) || '',
            citation: event.citation as string,
            source: (event.doc_type as string) || 'unknown',
            relevanceScore: (event.relevance_score as number) || 0.5,
            chunkId: event.chunk_id as string,
            docId: event.doc_id as string,
            docType: event.doc_type as string,
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
          response: {
            requestId: (event.request_id as string) || '',
            response: _fullAnswer,
            citations: _collectedCitations,
            confidence: (event.confidence as number) || 0,
            warnings: [],
            processingTimeMs: (event.processing_time_ms as number) || 0,
            stateCode: this.config.stateCode,
            capabilities: this.config.capabilities,
          },
        };

      case 'error':
        return {
          type: 'error',
          error: (event.error as string) || 'UNKNOWN_ERROR',
          message: (event.message as string) || 'Unknown error',
        };

      default:
        // Fallback: try to infer event type
        if ('answer' in event && typeof event.answer === 'string') {
          return { type: 'answer', content: event.answer };
        }
        if ('error' in event) {
          return {
            type: 'error',
            error: event.error as string,
            message: (event.message as string) || 'Unknown error',
          };
        }
        return null;
    }
  }
}
