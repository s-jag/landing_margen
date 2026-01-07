'use client';

import type { SourceChip } from '@/types/chat';

interface SourceChipsProps {
  sources: SourceChip[];
  onSourceClick?: (chunkId: string) => void;
}

export default function SourceChips({ sources, onSourceClick }: SourceChipsProps) {
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {sources.map((source, index) => (
        <button
          key={source.chunkId || index}
          onClick={() => onSourceClick?.(source.chunkId)}
          className="group flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/20 hover:border-accent/40 transition-all text-xs"
        >
          {/* Document icon */}
          <svg className="w-3 h-3 text-accent/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>

          {/* Citation text */}
          <span className="text-accent/90 max-w-[200px] truncate">
            {source.citation}
          </span>

          {/* Relevance score */}
          <span className="text-text/40 font-mono">
            {Math.round(source.relevanceScore * 100)}%
          </span>

          {/* Expand icon on hover */}
          <svg
            className="w-3 h-3 text-accent/50 opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      ))}
    </div>
  );
}
