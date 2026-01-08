// =============================================================================
// UTAH RAG PROVIDER
// =============================================================================
// Provider for the Utah Tax RAG API.
// Note: Utah API does NOT support streaming - uses simulated streaming.

import { BaseRAGProvider } from './BaseRAGProvider';
import type { StateRAGConfig } from '@/config/stateConfig';
import type {
  QueryOptions,
  ClientContext,
  UnifiedRAGResponse,
  UnifiedStreamEvent,
  UnifiedCitation,
  UtahQueryResponseRaw,
  UtahFormInfo,
  UtahHealthResponse,
  TaxFormInfo,
} from '@/types/rag';

export class UtahRAGProvider extends BaseRAGProvider {
  constructor(config: StateRAGConfig) {
    super(config);
  }

  // =============================================================================
  // QUERY (Synchronous only - Utah API doesn't support streaming)
  // =============================================================================

  async query(
    query: string,
    options?: QueryOptions,
    _clientContext?: ClientContext
  ): Promise<UnifiedRAGResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(this.buildUrl(this.config.endpoints.query), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query,
          include_trace: options?.includeTrace ?? false,
        }),
        signal: AbortSignal.timeout(this.getTimeout(options)),
      });

      const data = await this.handleResponse<UtahQueryResponseRaw>(response);
      return this.transformResponse(data, Date.now() - startTime);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  // =============================================================================
  // STREAM QUERY (Simulated - Utah API doesn't support native streaming)
  // =============================================================================

  async *streamQuery(
    query: string,
    options?: QueryOptions,
    clientContext?: ClientContext
  ): AsyncGenerator<UnifiedStreamEvent> {
    // Utah API doesn't support streaming, so we simulate it
    yield { type: 'status', message: 'Querying Utah tax law database...' };

    try {
      const response = await this.query(query, options, clientContext);

      // Simulate streaming experience
      yield* this.simulateStreaming(response);
    } catch (error) {
      yield* this.createErrorStream(error);
    }
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

      const data = await response.json() as UtahHealthResponse;

      // Utah health check includes Qdrant and Neo4j status
      const isQdrantHealthy = data.qdrant?.connected ?? false;
      const isNeo4jHealthy = data.neo4j?.connected ?? false;

      if (isQdrantHealthy && isNeo4jHealthy) {
        return { status: 'healthy' };
      } else if (isQdrantHealthy || isNeo4jHealthy) {
        return {
          status: 'degraded',
          message: `${!isQdrantHealthy ? 'Qdrant' : 'Neo4j'} is not connected`,
        };
      } else {
        return { status: 'unhealthy', message: 'Both Qdrant and Neo4j are not connected' };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // =============================================================================
  // UTAH-SPECIFIC: TAX FORMS
  // =============================================================================

  /**
   * List all available Utah tax forms.
   */
  async listForms(): Promise<TaxFormInfo[]> {
    if (!this.config.endpoints.forms) {
      return [];
    }

    try {
      const response = await fetch(this.buildUrl(this.config.endpoints.forms), {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json() as { forms: UtahFormInfo[] };
      return (data.forms || []).map((form) => this.transformFormInfo(form));
    } catch {
      return [];
    }
  }

  /**
   * Get details about a specific Utah tax form.
   */
  async getFormInfo(formNumber: string): Promise<TaxFormInfo | null> {
    if (!this.config.endpoints.formDetail) {
      return null;
    }

    try {
      const response = await fetch(
        this.buildUrl(`${this.config.endpoints.formDetail}/${encodeURIComponent(formNumber)}`),
        {
          method: 'GET',
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as UtahFormInfo;
      return this.transformFormInfo(data);
    } catch {
      return null;
    }
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private transformResponse(
    raw: UtahQueryResponseRaw,
    processingTimeMs: number
  ): UnifiedRAGResponse {
    const citations: UnifiedCitation[] = raw.citations.map((citation) => ({
      text: citation.text,
      citation: citation.citation,
      source: citation.source,
      sourceLabel: citation.source_label,
      relevanceScore: citation.relevance_score,
      authorityLevel: citation.authority_level,
      link: citation.link,
    }));

    return {
      requestId: `utah-${Date.now()}`,
      response: raw.response,
      citations,
      confidence: raw.confidence,
      confidenceLabel: raw.confidence_label,
      warnings: raw.warnings || [],
      processingTimeMs,
      // Utah-specific fields
      formsMentioned: raw.forms_mentioned || [],
      taxType: raw.tax_type || undefined,
      taxTypeLabel: raw.tax_type_label || undefined,
      // Metadata
      stateCode: this.config.stateCode,
      capabilities: this.config.capabilities,
    };
  }

  private transformFormInfo(raw: UtahFormInfo): TaxFormInfo {
    return {
      formNumber: raw.form_number,
      title: raw.title,
      url: raw.url,
      description: raw.description,
      stateCode: this.config.stateCode,
    };
  }

  /**
   * Override simulated streaming to include Utah-specific status messages.
   */
  protected async *simulateStreaming(
    response: UnifiedRAGResponse
  ): AsyncGenerator<UnifiedStreamEvent> {
    // Utah-specific status messages
    yield { type: 'status', message: 'Searching Utah Code and Administrative Rules...' };
    await this.delay(200);

    yield { type: 'status', message: 'Analyzing relevant tax provisions...' };
    await this.delay(200);

    // If we have a tax type, mention it
    if (response.taxTypeLabel) {
      yield { type: 'status', message: `Identified tax type: ${response.taxTypeLabel}` };
      await this.delay(150);
    }

    // Yield citations as chunks with authority level info
    if (response.citations.length > 0) {
      yield { type: 'chunk', chunks: response.citations };
      await this.delay(100);
    }

    // Stream the answer word by word
    const words = response.response.split(' ');
    const chunkSize = 5;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      const suffix = i + chunkSize < words.length ? ' ' : '';
      yield { type: 'answer', content: chunk + suffix };
      await this.delay(25);
    }

    // Yield complete event
    yield { type: 'complete', response };
  }
}
