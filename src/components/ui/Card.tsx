import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant = 'default', padding = 'md', children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-2xl bg-theme-card border border-theme-border overflow-hidden',
          // Padding
          {
            none: 'p-0',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
          }[padding],
          // Variant styles
          variant === 'hover' &&
            'transition-all duration-300 hover:bg-theme-card-hover hover:border-theme-border cursor-pointer hover:shadow-lg',
          variant === 'gradient' && 'gradient-border',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
