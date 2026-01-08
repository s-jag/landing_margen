'use client';

interface WarningBannerProps {
  warnings: string[];
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-4">
      <div className="flex items-start gap-2">
        {/* Warning icon */}
        <svg
          className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          {warnings.length === 1 ? (
            <p className="text-sm text-yellow-400/90">{warnings[0]}</p>
          ) : (
            <ul className="text-sm text-yellow-400/90 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
