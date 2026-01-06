'use client';

import { useRef, useCallback } from 'react';
import { useChat } from '@/context/ChatContext';
import { cn } from '@/lib/utils';

export function ChatInput() {
  const {
    inputValue,
    setInputValue,
    sendMessage,
    isLoading,
    isTyping,
    selectedClient,
  } = useChat();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isLoading || isTyping) return;
    sendMessage(inputValue);
  }, [inputValue, isLoading, isTyping, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const isDisabled = !inputValue.trim() || isLoading || isTyping;

  return (
    <div className="border-t border-border-02 px-2 py-1.5 bg-card">
      <div className="max-w-[680px] mx-auto">
        <div className="bg-card-02 border border-border-02 rounded-md overflow-hidden focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
          <div className="flex items-center gap-3 px-3 py-2">
            {/* Left controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                className="p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-card-03 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary hover:text-text-secondary hover:bg-card-03 rounded transition-colors"
              >
                <span>Claude 4</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Input - grows to fill */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${selectedClient.name}'s tax situation...`}
              disabled={isLoading || isTyping}
              className="flex-1 bg-transparent text-sm text-text placeholder:text-text-tertiary outline-none min-w-0 disabled:opacity-50"
            />

            {/* Send button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isDisabled}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-full flex-shrink-0 transition-colors',
                isDisabled
                  ? 'bg-card-03 text-text-tertiary cursor-not-allowed'
                  : 'bg-accent text-bg hover:bg-accent/90'
              )}
            >
              {isLoading || isTyping ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
