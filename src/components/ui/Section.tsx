import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  background?: 'default' | 'card' | 'gradient';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    { className, background = 'default', spacing = 'md', children, ...props },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className={cn(
          'relative',
          // Background
          {
            default: 'bg-theme-bg',
            card: 'bg-theme-card',
            gradient: 'bg-gradient-to-b from-theme-bg to-theme-card',
          }[background],
          // Spacing
          {
            none: 'py-0',
            sm: 'py-12 md:py-16',
            md: 'py-20 md:py-28',
            lg: 'py-28 md:py-36',
          }[spacing],
          className
        )}
        {...props}
      >
        {children}
      </section>
    );
  }
);

Section.displayName = 'Section';
