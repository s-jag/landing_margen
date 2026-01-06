'use client';

import { cn } from '@/lib/utils';

interface DiagramProps {
  children: string;
  caption?: string;
  className?: string;
}

export function Diagram({ children, caption, className }: DiagramProps) {
  return (
    <figure className={cn('my-8', className)}>
      <div className="bg-card border border-border-01 rounded-md p-6 overflow-x-auto">
        <pre className="text-xs md:text-sm text-text-secondary font-mono whitespace-pre leading-relaxed">
          {children}
        </pre>
      </div>
      {caption && (
        <figcaption className="mt-3 text-sm text-text-tertiary text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
