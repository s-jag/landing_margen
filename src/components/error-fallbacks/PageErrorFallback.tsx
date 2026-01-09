'use client';

import type { FallbackProps } from '../ErrorBoundary';

/**
 * Full-page error fallback for critical failures.
 * Shows when the entire page/section fails to render.
 */
export function PageErrorFallback({ error, resetError }: FallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 mb-6 text-red-500">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We encountered an unexpected error. This has been logged and we&apos;ll look into it.
        </p>

        {/* Error Details (collapsible in production) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
              {error.stack || error.message}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Try again
          </button>
          <button
            onClick={handleReload}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

export default PageErrorFallback;
