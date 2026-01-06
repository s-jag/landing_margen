'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface CalloutProps {
  children: ReactNode;
  type?: 'info' | 'warning' | 'success';
  className?: string;
}

export function Callout({ children, type = 'info', className }: CalloutProps) {
  const styles = {
    info: 'bg-accent/5 border-accent',
    warning: 'bg-amber-500/5 border-amber-500',
    success: 'bg-emerald-500/5 border-emerald-500',
  };

  return (
    <div
      className={cn(
        'border-l-2 p-4 my-6 rounded-r-md',
        styles[type],
        className
      )}
    >
      <div className="text-text text-sm leading-relaxed">{children}</div>
    </div>
  );
}
