'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/lib/errorLogging';

// =============================================================================
// TYPES
// =============================================================================

export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Fallback UI to show when an error occurs */
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  /** Keys that when changed will reset the error boundary */
  resetKeys?: unknown[];
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback when boundary resets */
  onReset?: () => void;
  /** Name for this boundary (for logging/debugging) */
  name?: string;
}

export interface FallbackProps {
  /** The error that was caught */
  error: Error;
  /** Component stack from React */
  componentStack: string | null;
  /** Function to reset the error boundary */
  resetError: () => void;
  /** Name of the boundary (if provided) */
  boundaryName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

// =============================================================================
// DEFAULT FALLBACK
// =============================================================================

function DefaultFallback({ error, resetError }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
      <div className="text-red-600 dark:text-red-400 mb-4">
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}

// =============================================================================
// ERROR BOUNDARY CLASS
// =============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      componentStack: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with component stack
    this.setState({
      componentStack: errorInfo.componentStack || null,
    });

    // Log the error
    logError(error, {
      componentStack: errorInfo.componentStack,
      boundaryName: this.props.name,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset if resetKeys have changed
    if (hasError && prevProps.resetKeys && resetKeys) {
      const hasKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasKeyChanged) {
        this.resetError();
      }
    }
  }

  resetError = (): void => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      componentStack: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, componentStack } = this.state;
    const { children, fallback, name } = this.props;

    if (hasError && error) {
      const fallbackProps: FallbackProps = {
        error,
        componentStack,
        resetError: this.resetError,
        boundaryName: name,
      };

      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(fallbackProps);
        }
        return fallback;
      }

      // Default fallback
      return <DefaultFallback {...fallbackProps} />;
    }

    return children;
  }
}

// =============================================================================
// HOOK FOR RESETTING ERROR BOUNDARIES
// =============================================================================

/**
 * Hook to trigger error boundary reset from child components.
 * Uses a key-based approach where changing the key resets the boundary.
 */
export function useErrorBoundaryReset() {
  const [resetKey, setResetKey] = React.useState(0);

  const reset = React.useCallback(() => {
    setResetKey((prev) => prev + 1);
  }, []);

  return { resetKey, reset };
}

// =============================================================================
// WRAPPER COMPONENT WITH HOOK INTEGRATION
// =============================================================================

interface ErrorBoundaryWrapperProps extends Omit<ErrorBoundaryProps, 'resetKeys'> {
  /** External reset key to trigger boundary reset */
  resetKey?: unknown;
}

/**
 * Functional wrapper that makes it easier to use ErrorBoundary with hooks.
 */
export function ErrorBoundaryWrapper({
  resetKey,
  children,
  ...props
}: ErrorBoundaryWrapperProps) {
  const resetKeys = resetKey !== undefined ? [resetKey] : undefined;

  return (
    <ErrorBoundary {...props} resetKeys={resetKeys}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
