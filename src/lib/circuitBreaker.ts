/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by tracking error rates and temporarily
 * blocking requests to failing services.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are immediately rejected
 * - HALF_OPEN: Testing if service has recovered
 */

// =============================================================================
// TYPES
// =============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold: number;
  /** Time in ms before attempting recovery (default: 30000) */
  resetTimeoutMs: number;
  /** Number of successful calls in HALF_OPEN to close circuit (default: 2) */
  successThreshold: number;
  /** Time window in ms for failure counting (default: 60000) */
  failureWindowMs: number;
  /** Custom function to determine if error should count as failure */
  isFailure?: (error: unknown) => boolean;
  /** Callback when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitOpenError extends Error {
  readonly circuitName: string;
  readonly resetTime: number;

  constructor(name: string, resetTime: number) {
    super(`Circuit breaker "${name}" is OPEN. Reset at ${new Date(resetTime).toISOString()}`);
    this.name = 'CircuitOpenError';
    this.circuitName = name;
    this.resetTime = resetTime;
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  successThreshold: 2,
  failureWindowMs: 60000,
};

// =============================================================================
// CIRCUIT BREAKER CLASS
// =============================================================================

export class CircuitBreaker {
  private readonly name: string;
  private readonly config: CircuitBreakerConfig;

  private state: CircuitState = 'CLOSED';
  private failures: { timestamp: number }[] = [];
  private halfOpenSuccesses: number = 0;
  private lastStateChange: number = Date.now();
  private openedAt: number | null = null;

  // Stats tracking
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new CircuitOpenError(this.name, this.openedAt! + this.config.resetTimeoutMs);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Get current circuit state and stats
   */
  getStats(): CircuitBreakerStats {
    this.pruneOldFailures();
    return {
      state: this.state,
      failures: this.failures.length,
      successes: this.halfOpenSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is allowing requests
   */
  isAvailable(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'HALF_OPEN') return true;
    if (this.state === 'OPEN' && this.shouldAttemptReset()) return true;
    return false;
  }

  /**
   * Manually reset circuit to CLOSED state
   */
  reset(): void {
    this.failures = [];
    this.halfOpenSuccesses = 0;
    this.openedAt = null;
    this.transitionTo('CLOSED');
  }

  /**
   * Manually trip circuit to OPEN state
   */
  trip(): void {
    this.openedAt = Date.now();
    this.transitionTo('OPEN');
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.config.successThreshold) {
        this.reset();
      }
    } else if (this.state === 'CLOSED') {
      // Success in closed state doesn't affect failure count
      // Failures naturally age out via pruneOldFailures
    }
  }

  private onFailure(error: unknown): void {
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    // Check if this error should count as a failure
    if (this.config.isFailure && !this.config.isFailure(error)) {
      return;
    }

    if (this.state === 'HALF_OPEN') {
      // Single failure in HALF_OPEN immediately opens circuit
      this.openedAt = Date.now();
      this.halfOpenSuccesses = 0;
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      this.failures.push({ timestamp: Date.now() });
      this.pruneOldFailures();

      if (this.failures.length >= this.config.failureThreshold) {
        this.openedAt = Date.now();
        this.transitionTo('OPEN');
      }
    }
  }

  private shouldAttemptReset(): boolean {
    if (this.openedAt === null) return false;
    return Date.now() >= this.openedAt + this.config.resetTimeoutMs;
  }

  private pruneOldFailures(): void {
    const cutoff = Date.now() - this.config.failureWindowMs;
    this.failures = this.failures.filter((f) => f.timestamp > cutoff);
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    // Reset half-open successes when entering half-open
    if (newState === 'HALF_OPEN') {
      this.halfOpenSuccesses = 0;
    }

    this.config.onStateChange?.(oldState, newState, this.name);
  }
}

// =============================================================================
// CIRCUIT BREAKER REGISTRY
// =============================================================================

/**
 * Registry for managing multiple circuit breakers
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: Partial<CircuitBreakerConfig> = {};

  /**
   * Set default configuration for new breakers
   */
  setDefaultConfig(config: Partial<CircuitBreakerConfig>): void {
    this.defaultConfig = config;
  }

  /**
   * Get or create a circuit breaker by name
   */
  get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker(name, { ...this.defaultConfig, ...config });
      this.breakers.set(name, breaker);
    }
    return breaker;
  }

  /**
   * Check if a breaker exists
   */
  has(name: string): boolean {
    return this.breakers.has(name);
  }

  /**
   * Remove a breaker
   */
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  /**
   * Reset all breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }

  /**
   * Get stats for all breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Get all breaker names
   */
  getNames(): string[] {
    return Array.from(this.breakers.keys());
  }
}

// Global registry instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Execute a function with circuit breaker protection
 *
 * @example
 * ```ts
 * const result = await withCircuitBreaker('external-api', () => fetch(url));
 * ```
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = circuitBreakerRegistry.get(name, config);
  return breaker.execute(fn);
}

/**
 * Create a function wrapper with circuit breaker protection
 *
 * @example
 * ```ts
 * const protectedFetch = createCircuitBreakerWrapper('api', { failureThreshold: 3 });
 * const result = await protectedFetch(() => fetch(url));
 * ```
 */
export function createCircuitBreakerWrapper(
  name: string,
  config?: Partial<CircuitBreakerConfig>
) {
  const breaker = circuitBreakerRegistry.get(name, config);
  return <T>(fn: () => Promise<T>): Promise<T> => breaker.execute(fn);
}
