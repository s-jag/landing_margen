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
      className="max-w-2xl"
    >
      {viewingCitation && (
        <div className="p-5 space-y-4">
          {/* Source Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-01">
            <div className="flex items-center gap-2">
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
              {viewingCitation.docType && (
                <span className="px-2 py-0.5 text-xs rounded bg-accent/10 text-accent border border-accent/20">
                  {viewingCitation.docType}
                </span>
              )}
            </div>

            {/* External Link */}
            {viewingCitation.link && (
              <a
                href={viewingCitation.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 border border-accent/30 rounded-md transition-colors"
              >
                <span>View Official Source</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          {/* Loading State */}
          {viewingCitation.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-text-secondary">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading source text...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Full Text Content */}
              <div className="max-h-96 overflow-y-auto">
                <div className="text-sm text-text leading-relaxed whitespace-pre-wrap bg-card-02 p-4 rounded-md border border-border-01">
                  {viewingCitation.fullText || viewingCitation.excerpt}
                </div>
              </div>

              {/* Excerpt Highlight - only show if we have both fullText and a different excerpt */}
              {viewingCitation.fullText && viewingCitation.excerpt && viewingCitation.excerpt !== viewingCitation.fullText && !viewingCitation.excerpt.includes('Loading') && (
                <div className="mt-4 pt-4 border-t border-border-01">
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
                    Context
                  </div>
                  <div className="text-sm text-text-secondary bg-card-02 p-3 rounded-md border-l-2 border-accent">
                    {viewingCitation.excerpt}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer with chunk ID for debugging */}
          {viewingCitation.chunkId && (
            <div className="pt-3 border-t border-border-01">
              <div className="text-xs text-text-tertiary font-mono truncate">
                ID: {viewingCitation.chunkId}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
