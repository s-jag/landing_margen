/**
 * Error Logging Service
 *
 * Centralized error logging for the application.
 * Currently logs to console, but structured for easy integration
 * with external services like Sentry, LogRocket, or Datadog.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ErrorContext {
  /** Component stack from React error boundary */
  componentStack?: string | null;
  /** Name of the error boundary that caught the error */
  boundaryName?: string;
  /** User ID if available */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Error severity level */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  /** Tags for categorization */
  tags?: string[];
}

interface StructuredError {
  name: string;
  message: string;
  stack?: string;
  timestamp: string;
  context: ErrorContext;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

// Future: Replace with actual Sentry DSN or other service config
const ENABLE_REMOTE_LOGGING = false;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Structure an error for logging
 */
function structureError(error: Error, context?: ErrorContext): StructuredError {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: context || {},
  };
}

/**
 * Determine error severity based on error type and context
 */
function inferSeverity(error: Error, context?: ErrorContext): ErrorContext['severity'] {
  // Use provided severity if available
  if (context?.severity) {
    return context.severity;
  }

  // Critical: Errors in core functionality
  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return 'high';
  }

  // High: Network errors, API failures
  if (error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('api')) {
    return 'high';
  }

  // Medium: UI/rendering errors
  if (context?.componentStack) {
    return 'medium';
  }

  // Default
  return 'medium';
}

// =============================================================================
// MAIN LOGGING FUNCTIONS
// =============================================================================

/**
 * Log an error with optional context.
 *
 * Currently logs to console, but structured for easy migration to
 * external error tracking services.
 *
 * @example
 * ```ts
 * logError(error, {
 *   boundaryName: 'ChatPanel',
 *   userId: currentUser.id,
 *   tags: ['chat', 'streaming'],
 * });
 * ```
 */
export function logError(error: Error, context?: ErrorContext): void {
  const structured = structureError(error, context);
  const severity = inferSeverity(error, context);

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`[Error: ${severity?.toUpperCase()}] ${error.name}`);
    console.error('Message:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    if (context?.componentStack) {
      console.error('Component Stack:', context.componentStack);
    }
    if (context?.boundaryName) {
      console.log('Caught by:', context.boundaryName);
    }
    if (context?.metadata) {
      console.log('Metadata:', context.metadata);
    }
    console.groupEnd();
  } else {
    // Production: Log structured error
    console.error('[Error]', JSON.stringify(structured));
  }

  // Future: Send to external service
  if (ENABLE_REMOTE_LOGGING) {
    sendToRemoteService(structured, severity);
  }
}

/**
 * Log a warning (less severe than error)
 */
export function logWarning(message: string, context?: Omit<ErrorContext, 'severity'>): void {
  const warning = {
    message,
    timestamp: new Date().toISOString(),
    context: { ...context, severity: 'low' as const },
  };

  if (process.env.NODE_ENV === 'development') {
    console.warn('[Warning]', message, context);
  } else {
    console.warn('[Warning]', JSON.stringify(warning));
  }
}

/**
 * Create an error logger scoped to a specific boundary or component
 */
export function createScopedLogger(boundaryName: string) {
  return {
    error: (error: Error, context?: Omit<ErrorContext, 'boundaryName'>) =>
      logError(error, { ...context, boundaryName }),
    warning: (message: string, context?: Omit<ErrorContext, 'boundaryName' | 'severity'>) =>
      logWarning(message, { ...context, boundaryName }),
  };
}

// =============================================================================
// FUTURE: REMOTE LOGGING SERVICE INTEGRATION
// =============================================================================

/**
 * Placeholder for sending errors to a remote service.
 *
 * To integrate Sentry:
 * ```ts
 * import * as Sentry from '@sentry/nextjs';
 *
 * function sendToRemoteService(error: StructuredError, severity?: string) {
 *   Sentry.captureException(error, {
 *     level: severity as Sentry.SeverityLevel,
 *     extra: error.context,
 *   });
 * }
 * ```
 */
function sendToRemoteService(
  _error: StructuredError,
  _severity?: ErrorContext['severity']
): void {
  // Future: Implement actual remote logging
  // This is a no-op placeholder
}

// =============================================================================
// CIRCUIT BREAKER STATUS LOGGING
// =============================================================================

/**
 * Log circuit breaker state changes for monitoring
 */
export function logCircuitBreakerStateChange(
  from: string,
  to: string,
  name: string
): void {
  const message = `Circuit breaker "${name}" transitioned from ${from} to ${to}`;

  if (to === 'OPEN') {
    console.warn('[Circuit Breaker]', message);
    logWarning(message, { tags: ['circuit-breaker', name] });
  } else {
    console.info('[Circuit Breaker]', message);
  }
}

// =============================================================================
// RETRY LOGGING
// =============================================================================

/**
 * Log retry attempts for monitoring
 */
export function logRetryAttempt(
  service: string,
  attempt: number,
  delayMs: number,
  error: unknown
): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[Retry] ${service} attempt ${attempt} in ${delayMs}ms: ${message}`);
}
