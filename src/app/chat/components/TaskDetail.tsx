'use client';

import { useChat } from '@/context/ChatContext';

export function TaskDetail() {
  const { selectedTask, selectTask } = useChat();

  if (!selectedTask) return null;

  const elapsedTime = () => {
    const start = new Date(selectedTask.startedAt);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="flex-1 flex flex-col bg-bg overflow-hidden">
      {/* Header */}
      <div className="border-b border-border-01 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => selectTask(null)}
              className="p-1.5 text-text-tertiary hover:text-text hover:bg-card-02 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-base font-medium text-text">{selectedTask.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {selectedTask.status === 'in_progress' ? (
                  <span className="flex items-center gap-1 text-xs text-accent">
                    <span className="spin inline-block">⟳</span> Processing
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-ansi-green">
                    <span>✓</span> Complete
                  </span>
                )}
                <span className="text-xs text-text-tertiary">· {elapsedTime()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Steps */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-xl">
          {selectedTask.attachedFile && (
            <div className="mb-6 p-3 bg-card border border-border-01 rounded-md">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-text">{selectedTask.attachedFile}</span>
              </div>
            </div>
          )}

          <div className="text-xs text-text-tertiary uppercase tracking-wider mb-3">
            Processing Steps
          </div>

          <div className="space-y-3">
            {selectedTask.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                  {step.status === 'done' ? (
                    <span className="text-ansi-green text-sm">✓</span>
                  ) : step.status === 'running' ? (
                    <span className="text-accent text-sm spin inline-block">⟳</span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-border-02" />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm ${
                      step.status === 'done'
                        ? 'text-text'
                        : step.status === 'running'
                        ? 'text-text'
                        : 'text-text-tertiary'
                    }`}
                  >
                    {step.label}
                  </div>
                  {step.status === 'running' && (
                    <div className="mt-2 p-3 bg-card-02 border border-border-01 rounded-md font-mono text-xs">
                      <div className="text-text-tertiary">
                        <span className="text-accent">$</span> searching knowledge graph...
                      </div>
                      <div className="text-text-secondary mt-1">
                        → Found 3 relevant nodes
                      </div>
                      <div className="text-text-secondary">
                        → Expanding graph edges...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
