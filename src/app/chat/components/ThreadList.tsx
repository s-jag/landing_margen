'use client';

import { useChat } from '@/context/ChatContext';

export function ThreadList() {
  const { threads, activeThreadId, selectThread, createThread, selectedClientId } = useChat();

  // Filter threads for the selected client
  const clientThreads = threads.filter((t) => t.clientId === selectedClientId);

  return (
    <>
      {/* New Chat Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={createThread}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-card-02 border border-border-02 rounded-md text-sm text-text-secondary hover:text-text hover:bg-card-03 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Research Thread
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">
            Recent Chats
          </div>

          {clientThreads.length === 0 && (
            <div className="text-xs text-text-tertiary py-4 text-center">
              No conversations yet
            </div>
          )}

          {clientThreads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => selectThread(thread.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md cursor-pointer transition-colors mb-1 ${
                  isActive ? 'bg-accent/10' : 'hover:bg-card-02'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm truncate ${
                      isActive ? 'text-text font-medium' : 'text-text-secondary'
                    }`}
                  >
                    {thread.title}
                  </span>
                </div>
                {!isActive && (
                  <div className="text-xs text-text-tertiary mt-0.5">{thread.timestamp}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
