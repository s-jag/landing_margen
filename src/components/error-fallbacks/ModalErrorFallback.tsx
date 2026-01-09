'use client';

import type { FallbackProps } from '../ErrorBoundary';

interface ModalErrorFallbackProps extends FallbackProps {
  /** Optional callback to close the modal */
  onClose?: () => void;
}

/**
 * Modal-specific error fallback.
 * Provides close functionality in addition to retry.
 */
export function ModalErrorFallback({
  error,
  resetError,
  onClose,
}: ModalErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      {/* Error Icon */}
      <div className="w-12 h-12 mb-4 text-red-500">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to load content
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 max-w-sm">
        Something went wrong while loading this content. Please try again.
      </p>

      {/* Error Details (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
          <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
            {error.message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
        )}
        <button
          onClick={resetError}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/**
 * Higher-order component to wrap modal content with error boundary.
 * Automatically provides close handler from modal context.
 */
export function createModalErrorFallback(onClose?: () => void) {
  return function ModalFallback(props: FallbackProps) {
    return <ModalErrorFallback {...props} onClose={onClose} />;
  };
}

export default ModalErrorFallback;
