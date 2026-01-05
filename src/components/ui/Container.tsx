import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'narrow' | 'wide';
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto w-full px-6',
          {
            default: 'max-w-container',
            narrow: 'max-w-prose',
            wide: 'max-w-[1440px]',
          }[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
