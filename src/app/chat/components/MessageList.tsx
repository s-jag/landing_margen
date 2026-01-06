'use client';

import { useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { ComparisonCard } from './ComparisonCard';
import { TypingIndicator } from './TypingIndicator';

export function MessageList() {
  const { activeMessages, isTyping } = useChat();

  const { containerRef, handleScroll, scrollToBottom } = useAutoScroll<HTMLDivElement>(
    [activeMessages.length, isTyping],
    { threshold: 150 }
  );

  // Scroll to bottom on initial load
  useEffect(() => {
    scrollToBottom(true);
  }, [scrollToBottom]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-8 py-6"
    >
      <div className="max-w-[680px] mx-auto space-y-8">
        {activeMessages.length === 0 && !isTyping && (
          <div className="text-center py-12">
            <div className="text-text-tertiary text-sm">
              Start a conversation by asking a question about your client&apos;s tax situation.
            </div>
          </div>
        )}

        {activeMessages.map((message) => (
          <div key={message.id} className="group">
            {/* Message Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                {message.role === 'user' ? 'You' : 'Margen'}
              </span>
              <span className="text-xs text-text-tertiary">{message.timestamp}</span>
            </div>

            {/* Message Content */}
            <div
              className={`text-sm leading-relaxed ${
                message.role === 'user' ? 'text-text-secondary' : 'text-text'
              }`}
            >
              {message.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-3' : ''}>
                  {line}
                </p>
              ))}
            </div>

            {/* Comparison Cards */}
            {message.comparison && <ComparisonCard options={message.comparison.options} />}

            {/* Citation Card */}
            {message.citation && (
              <div className="mt-4 bg-card border border-border-01 rounded-md overflow-hidden">
                <div className="border-l-2 border-accent pl-5 pr-4 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-text-tertiary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-xs text-text-secondary font-medium">Source</span>
                  </div>
                  <div className="text-sm font-medium text-text">{message.citation.source}</div>
                  <div className="text-sm text-text-secondary mt-2 italic leading-relaxed">
                    &quot;{message.citation.excerpt}&quot;
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}
      </div>
    </div>
  );
}
