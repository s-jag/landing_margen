'use client';

import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: string;
  title?: string;
  className?: string;
}

export function CodeBlock({ children, title, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        'bg-card-02 border border-border-02 rounded-md overflow-hidden my-6',
        className
      )}
    >
      {title && (
        <div className="px-4 py-2 border-b border-border-01 text-xs text-text-tertiary font-mono">
          {title}
        </div>
      )}
      <pre className="p-4 text-sm overflow-x-auto">
        <code className="text-text-secondary font-mono whitespace-pre">{children}</code>
      </pre>
    </div>
  );
}
