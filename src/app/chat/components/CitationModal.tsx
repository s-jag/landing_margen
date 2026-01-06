'use client';

import { useChat } from '@/context/ChatContext';
import { Modal } from './Modal';

export function CitationModal() {
  const { viewingCitation, closeCitation } = useChat();

  return (
    <Modal
      isOpen={!!viewingCitation}
      title="Source Document"
      onClose={closeCitation}
      className="max-w-lg"
    >
      {viewingCitation && (
        <div className="p-5 space-y-4">
          {/* Source Header */}
          <div className="flex items-center gap-2 pb-3 border-b border-border-01">
            <svg
              className="w-5 h-5 text-accent"
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
            <span className="text-base font-medium text-text">{viewingCitation.source}</span>
          </div>

          {/* Full Text Content */}
          <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">
            {viewingCitation.fullText || viewingCitation.excerpt}
          </div>

          {/* Excerpt Highlight */}
          {viewingCitation.fullText && (
            <div className="mt-4 pt-4 border-t border-border-01">
              <div className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
                Referenced Excerpt
              </div>
              <div className="text-sm text-text-secondary italic bg-card-02 p-3 rounded-md border-l-2 border-accent">
                &quot;{viewingCitation.excerpt}&quot;
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
