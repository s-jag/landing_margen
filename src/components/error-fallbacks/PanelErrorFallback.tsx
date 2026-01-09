'use client';

import type { FallbackProps } from '../ErrorBoundary';

/**
 * Panel/sidebar error fallback for contained failures.
 * Minimal UI that doesn't disrupt the rest of the application.
 */
export function PanelErrorFallback({ error, resetError }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 h-full min-h-[200px] bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Warning Icon */}
      <div className="w-10 h-10 mb-3 text-amber-500">
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
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
        This section couldn&apos;t load
      </p>

      {/* Error hint (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mb-3 max-w-[200px] truncate">
          {error.message}
        </p>
      )}

      {/* Retry Button */}
      <button
        onClick={resetError}
        className="px-4 py-1.5 text-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export default PanelErrorFallback;
