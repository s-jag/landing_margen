'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'text';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg',
          'disabled:pointer-events-none disabled:opacity-50',
          // Size variants
          {
            sm: 'h-9 px-4 text-sm',
            md: 'h-11 px-6 text-base',
            lg: 'h-14 px-8 text-lg',
          }[size],
          // Style variants
          {
            primary:
              'bg-theme-fg text-theme-bg hover:bg-theme-fg/90 active:scale-[0.98]',
            secondary:
              'bg-theme-card border border-theme-border text-theme-text hover:bg-theme-card-hover active:scale-[0.98]',
            ghost:
              'border border-theme-border text-theme-text hover:bg-theme-card hover:border-theme-border active:scale-[0.98]',
            text: 'text-theme-text-secondary hover:text-theme-text underline-offset-4 hover:underline px-0',
          }[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
