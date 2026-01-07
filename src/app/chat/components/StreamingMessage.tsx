'use client';

import { useEffect, useState } from 'react';

interface StreamingMessageProps {
  content: string;
  status?: string;
  isComplete?: boolean;
}

export default function StreamingMessage({ content, status, isComplete }: StreamingMessageProps) {
  const [showCursor, setShowCursor] = useState(true);

  // Blink cursor effect
  useEffect(() => {
    if (isComplete) {
      setShowCursor(false);
      return;
    }

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-text/60">Margen</span>
          {status && !isComplete && (
            <span className="text-xs text-accent/80 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {status}
            </span>
          )}
        </div>

        {/* Message body */}
        <div className="text-sm text-text/90 leading-relaxed">
          {content ? (
            <div className="whitespace-pre-wrap">
              {content}
              {!isComplete && showCursor && (
                <span className="inline-block w-2 h-4 bg-accent/80 ml-0.5 -mb-0.5 animate-pulse" />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-text/50">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{status || 'Thinking...'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
