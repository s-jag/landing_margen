// =============================================================================
// BASE RAG PROVIDER
// =============================================================================
// Abstract base class for all state RAG providers.
// Provides common functionality like error handling, timeouts, headers, and retry logic.

import type { StateRAGConfig, StateCapabilities, StateCode } from '@/config/stateConfig';
import type {
  RAGProviderInterface,
  QueryOptions,
  ClientContext,
  UnifiedRAGResponse,
  UnifiedStreamEvent,
} from '@/types/rag';
import { withRetry, type RetryConfig } from '@/lib/retry';
import { withCircuitBreaker, CircuitOpenError } from '@/lib/circuitBreaker';

const DEFAULT_TIMEOUT = 60000; // 60 seconds

// Default retry configuration for RAG providers
const DEFAULT_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

export abstract class BaseRAGProvider implements RAGProviderInterface {
  protected config: StateRAGConfig;

  constructor(config: StateRAGConfig) {
    this.config = config;
  }

  // =============================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // =============================================================================

  abstract query(
    query: string,
    options?: QueryOptions,
    clientContext?: ClientContext
  ): Promise<UnifiedRAGResponse>;

  abstract streamQuery(
    query: string,
    options?: QueryOptions,
    clientContext?: ClientContext
  ): AsyncGenerator<UnifiedStreamEvent>;

  abstract checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;

  // =============================================================================
  // PUBLIC METHODS
  // =============================================================================

  getStateCode(): StateCode {
    return this.config.stateCode;
  }

  getCapabilities(): StateCapabilities {
    return this.config.capabilities;
  }

  getConfig(): StateRAGConfig {
    return this.config;
  }

  // =============================================================================
  // PROTECTED HELPERS
  // =============================================================================

  protected getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  protected getStreamHeaders(): HeadersInit {
    return {
      ...this.getHeaders(),
      'Accept': 'text/event-stream',
    };
  }

  protected buildUrl(endpoint: string): string {
    return `${this.config.apiBaseUrl}${endpoint}`;
  }

  protected getTimeout(options?: QueryOptions): number {
    return options?.timeoutSeconds
      ? options.timeoutSeconds * 1000
      : DEFAULT_TIMEOUT;
  }

  protected async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.message || errorJson.error || errorJson.detail || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorBody || `HTTP ${response.status}`;
      }

      throw new Error(`RAG API Error (${this.config.stateName}): ${errorMessage}`);
    }

    return response.json();
  }

  protected createErrorResponse(error: unknown): UnifiedRAGResponse {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      requestId: `error-${Date.now()}`,
      response: `Error querying ${this.config.stateName} RAG API: ${message}`,
      citations: [],
      confidence: 0,
      warnings: [message],
      processingTimeMs: 0,
      stateCode: this.config.stateCode,
      capabilities: this.config.capabilities,
    };
  }

  protected *createErrorStream(error: unknown): Generator<UnifiedStreamEvent> {
    const message = error instanceof Error ? error.message : 'Unknown error';
    yield {
      type: 'error',
      error: 'PROVIDER_ERROR',
      message: `${this.config.stateName} RAG API Error: ${message}`,
    };
  }

  /**
   * Simulates streaming for providers that don't support it.
   * Yields the response in word chunks for a streaming-like experience.
   */
  protected async *simulateStreaming(
    response: UnifiedRAGResponse
  ): AsyncGenerator<UnifiedStreamEvent> {
    // Yield status
    yield { type: 'status', message: 'Processing query...' };

    // Small delay for UX
    await this.delay(100);

    // Yield citations as chunks
    if (response.citations.length > 0) {
      yield { type: 'chunk', chunks: response.citations };
    }

    await this.delay(100);

    // Stream the answer word by word for progressive reveal
    const words = response.response.split(' ');
    const chunkSize = 5; // Words per chunk

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      const suffix = i + chunkSize < words.length ? ' ' : '';
      yield { type: 'answer', content: chunk + suffix };
      await this.delay(30); // Small delay between chunks
    }

    // Yield complete event
    yield { type: 'complete', response };
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the circuit breaker name for this provider.
   */
  protected getCircuitBreakerName(): string {
    return `rag-${this.config.stateCode.toLowerCase()}`;
  }

  /**
   * Execute a fetch request with retry logic and circuit breaker protection.
   * Use this for all external API calls to ensure resilience.
   */
  protected async fetchWithRetry<T>(
    url: string,
    init: RequestInit,
    options?: {
      retryConfig?: Partial<RetryConfig>;
      useCircuitBreaker?: boolean;
      onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
    }
  ): Promise<T> {
    const {
      retryConfig = DEFAULT_RETRY_CONFIG,
      useCircuitBreaker = true,
      onRetry,
    } = options ?? {};

    const fetchFn = async (): Promise<T> => {
      const response = await fetch(url, init);
      return this.handleResponse<T>(response);
    };

    // Wrap with retry logic
    const retryFn = () =>
      withRetry(fetchFn, retryConfig, {
        onRetry: onRetry ?? ((error, attempt, delayMs) => {
          console.warn(
            `[${this.config.stateCode}] Retry attempt ${attempt} after ${delayMs}ms:`,
            error instanceof Error ? error.message : error
          );
        }),
      });

    // Optionally wrap with circuit breaker
    if (useCircuitBreaker) {
      try {
        return await withCircuitBreaker(this.getCircuitBreakerName(), retryFn);
      } catch (error) {
        if (error instanceof CircuitOpenError) {
          console.warn(`[${this.config.stateCode}] Circuit breaker is open, failing fast`);
        }
        throw error;
      }
    }

    return retryFn();
  }

  /**
   * Enriches query with client context for jurisdiction-specific answers.
   */
  protected enrichQuery(query: string, clientContext?: ClientContext): string {
    if (!clientContext?.state) {
      return query;
    }

    const parts = [`Client State: ${clientContext.state}`];
    if (clientContext.filingStatus) {
      parts.push(`Filing Status: ${clientContext.filingStatus}`);
    }

    return `[${parts.join(', ')}] ${query}`;
  }
}
