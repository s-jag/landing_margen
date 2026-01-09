/**
 * Retry utility with exponential backoff and jitter
 *
 * Features:
 * - Exponential backoff with configurable base delay
 * - Jitter to prevent thundering herd
 * - Retryable error detection (5xx, 429, timeouts, network errors)
 * - Rate limit header parsing (Retry-After)
 * - Configurable callbacks for logging/monitoring
 */

// =============================================================================
// TYPES
// =============================================================================

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
  /** Jitter factor 0-1 to randomize delays (default: 0.1) */
  jitterFactor: number;
}

export interface RetryOptions<T> {
  /** Custom function to determine if error is retryable */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback fired on each retry attempt */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  /** Custom function to extract Retry-After header from response */
  getRetryAfter?: (error: unknown) => number | null;
  /** Abort signal to cancel retries */
  signal?: AbortSignal;
}

export interface RetryError extends Error {
  lastError: unknown;
  attempts: number;
  isRetryExhausted: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

/** HTTP status codes that should trigger retry */
const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/** Error messages that indicate network/transient failures */
const RETRYABLE_ERROR_PATTERNS = [
  /network/i,
  /timeout/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /socket hang up/i,
  /fetch failed/i,
  /aborted/i,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig,
  retryAfterMs?: number | null
): number {
  // If Retry-After header is provided, use it (with cap)
  if (retryAfterMs && retryAfterMs > 0) {
    return Math.min(retryAfterMs, config.maxDelayMs);
  }

  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);

  // Apply jitter: delay * (1 +/- jitterFactor * random)
  const jitter = 1 + config.jitterFactor * (Math.random() * 2 - 1);
  const delayWithJitter = exponentialDelay * jitter;

  // Cap at maxDelay
  return Math.min(Math.round(delayWithJitter), config.maxDelayMs);
}

/**
 * Check if an error is retryable based on status code or error message
 */
export function isRetryableError(error: unknown): boolean {
  // Check for fetch Response-like errors with status
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Check status code
    if (typeof err.status === 'number') {
      return RETRYABLE_STATUS_CODES.has(err.status);
    }

    // Check response status (for errors that wrap Response)
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (typeof response.status === 'number') {
        return RETRYABLE_STATUS_CODES.has(response.status);
      }
    }

    // Check for specific error properties
    if (typeof err.code === 'string') {
      const code = err.code;
      if (['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes(code)) {
        return true;
      }
    }
  }

  // Check error message patterns
  const message = error instanceof Error ? error.message : String(error);
  return RETRYABLE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Extract Retry-After value from error/response (in milliseconds)
 */
export function extractRetryAfter(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;

  const err = error as Record<string, unknown>;

  // Check headers directly on error
  let headers: Headers | Record<string, string> | null = null;

  if (err.headers instanceof Headers) {
    headers = err.headers;
  } else if (err.response && typeof err.response === 'object') {
    const response = err.response as Record<string, unknown>;
    if (response.headers instanceof Headers) {
      headers = response.headers;
    }
  }

  if (!headers) return null;

  const retryAfter = headers instanceof Headers ? headers.get('retry-after') : headers['retry-after'];

  if (!retryAfter) return null;

  // Retry-After can be seconds or HTTP-date
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }

  // Try parsing as HTTP-date
  const date = Date.parse(retryAfter);
  if (!isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return null;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/**
 * Create a RetryError with metadata
 */
function createRetryError(message: string, lastError: unknown, attempts: number): RetryError {
  const error = new Error(message) as RetryError;
  error.name = 'RetryError';
  error.lastError = lastError;
  error.attempts = attempts;
  error.isRetryExhausted = true;
  return error;
}

// =============================================================================
// MAIN RETRY FUNCTION
// =============================================================================

/**
 * Execute a function with automatic retry on transient failures
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, baseDelayMs: 1000 },
 *   { onRetry: (err, attempt) => console.log(`Retry ${attempt}`) }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
  options?: RetryOptions<T>
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { shouldRetry, onRetry, getRetryAfter, signal } = options ?? {};

  let lastError: unknown;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    // Check for abort before each attempt
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on final attempt
      if (attempt >= cfg.maxRetries) {
        break;
      }

      // Check if error is retryable
      const retryable = shouldRetry
        ? shouldRetry(error, attempt + 1)
        : isRetryableError(error);

      if (!retryable) {
        throw error;
      }

      // Calculate delay (check Retry-After header first)
      const retryAfterMs = getRetryAfter
        ? getRetryAfter(error)
        : extractRetryAfter(error);
      const delayMs = calculateDelay(attempt, cfg, retryAfterMs);

      // Notify callback
      onRetry?.(error, attempt + 1, delayMs);

      // Wait before retry
      await sleep(delayMs, signal);
    }
  }

  throw createRetryError(
    `Retry exhausted after ${cfg.maxRetries + 1} attempts`,
    lastError,
    cfg.maxRetries + 1
  );
}

// =============================================================================
// CONVENIENCE WRAPPERS
// =============================================================================

/**
 * Wrap a fetch call with retry logic
 *
 * @example
 * ```ts
 * const response = await fetchWithRetry('https://api.example.com/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryConfig?: Partial<RetryConfig>,
  retryOptions?: Omit<RetryOptions<Response>, 'getRetryAfter'>
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, init);

      // Throw on retryable status codes so retry logic can handle them
      if (!response.ok && RETRYABLE_STATUS_CODES.has(response.status)) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
          status: number;
          response: Response;
        };
        error.status = response.status;
        error.response = response;
        throw error;
      }

      return response;
    },
    retryConfig,
    {
      ...retryOptions,
      getRetryAfter: (error) => {
        if (error && typeof error === 'object' && 'response' in error) {
          const response = (error as { response: Response }).response;
          const retryAfter = response.headers.get('retry-after');
          if (retryAfter) {
            const seconds = parseInt(retryAfter, 10);
            return isNaN(seconds) ? null : seconds * 1000;
          }
        }
        return null;
      },
    }
  );
}

/**
 * Create a retry wrapper with preset configuration
 *
 * @example
 * ```ts
 * const ragRetry = createRetryWrapper({ maxRetries: 5, baseDelayMs: 500 });
 * const result = await ragRetry(() => ragService.query(input));
 * ```
 */
export function createRetryWrapper(
  config?: Partial<RetryConfig>,
  defaultOptions?: RetryOptions<unknown>
) {
  return <T>(fn: () => Promise<T>, options?: RetryOptions<T>): Promise<T> => {
    return withRetry(fn, config, { ...defaultOptions, ...options });
  };
}
