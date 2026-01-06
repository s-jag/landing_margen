'use client';

export function TypingIndicator() {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Margen
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '0.6s' }}
        />
        <span
          className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '0.6s' }}
        />
        <span
          className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '0.6s' }}
        />
      </div>
    </div>
  );
}
