'use client';

import type { ComparisonOption } from '@/types/chat';

interface ComparisonCardProps {
  options: ComparisonOption[];
}

export function ComparisonCard({ options }: ComparisonCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3 my-4">
      {options.map((option, i) => (
        <div
          key={i}
          className={`p-4 rounded-md border ${
            option.recommended
              ? 'bg-accent/5 border-accent/30'
              : 'bg-card-03 border-border-03'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              {option.title}
            </span>
            {option.recommended && (
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/15 text-emerald-400 rounded">
                Recommended
              </span>
            )}
          </div>
          <div className="text-sm text-text-secondary mb-1">{option.formula}</div>
          <div className="text-lg font-medium text-text">{option.result}</div>
        </div>
      ))}
    </div>
  );
}
