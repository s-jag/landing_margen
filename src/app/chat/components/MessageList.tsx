'use client';

import { useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { ComparisonCard } from './ComparisonCard';
import { TypingIndicator } from './TypingIndicator';
import StreamingMessage from './StreamingMessage';
import ReasoningSteps from './ReasoningSteps';
import SourceChips from './SourceChips';

export function MessageList() {
  const {
    activeMessages,
    isTyping,
    isStreaming,
    streamingContent,
    reasoningSteps,
    pendingSources,
    streamStatus,
    streamError,
    openCitation,
    fetchSourceAndOpen,
  } = useChat();

  const { containerRef, handleScroll, scrollToBottom } = useAutoScroll<HTMLDivElement>(
    [activeMessages.length, isTyping, streamingContent],
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

            {/* Source Chips for completed messages */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-4">
                <SourceChips
                  sources={message.sources}
                  onSourceClick={(chunkId) => {
                    const source = message.sources?.find(s => s.chunkId === chunkId);
                    if (source) {
                      fetchSourceAndOpen(chunkId, source.citation);
                    }
                  }}
                />
              </div>
            )}

            {/* Comparison Cards */}
            {message.comparison && <ComparisonCard options={message.comparison.options} />}

            {/* Citation Card - Clickable */}
            {message.citation && (
              <button
                type="button"
                onClick={() => openCitation(message.citation!)}
                className="mt-4 w-full text-left bg-card border border-border-01 rounded-md overflow-hidden hover:border-accent/50 hover:bg-card-02 transition-colors cursor-pointer group"
              >
                <div className="border-l-2 border-accent pl-5 pr-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
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
                    <svg
                      className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-text group-hover:text-accent transition-colors">
                    {message.citation.source}
                  </div>
                  <div className="text-sm text-text-secondary mt-2 italic leading-relaxed">
                    &quot;{message.citation.excerpt}&quot;
                  </div>
                  {message.citation.fullText && (
                    <div className="mt-2 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view full source
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
        ))}

        {/* Streaming Content */}
        {isTyping && (
          <div className="space-y-4">
            {/* Reasoning Steps */}
            {reasoningSteps.length > 0 && (
              <ReasoningSteps steps={reasoningSteps} isStreaming={!streamingContent} />
            )}

            {/* Source Chips - Clickable */}
            {pendingSources.length > 0 && (
              <SourceChips
                sources={pendingSources}
                onSourceClick={(chunkId) => {
                  const source = pendingSources.find(s => s.chunkId === chunkId);
                  if (source) {
                    fetchSourceAndOpen(chunkId, source.citation);
                  }
                }}
              />
            )}

            {/* Streaming Message or Typing Indicator */}
            {streamingContent ? (
              <StreamingMessage
                content={streamingContent}
                status={streamStatus}
                isComplete={false}
              />
            ) : (
              <TypingIndicator />
            )}

            {/* Stream Error */}
            {streamError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 text-sm text-red-400">
                <div className="font-medium mb-1">Error</div>
                <div>{streamError}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
