'use client';

import { useRef, useEffect, useCallback } from 'react';

interface UseAutoScrollOptions {
  /** Distance from bottom (in px) to consider "at bottom" */
  threshold?: number;
  /** Whether to use smooth scrolling */
  smooth?: boolean;
}

export function useAutoScroll<T extends HTMLElement>(
  deps: unknown[],
  options: UseAutoScrollOptions = {}
) {
  const { threshold = 100, smooth = true } = options;

  const containerRef = useRef<T>(null);
  const shouldAutoScroll = useRef(true);

  // Check if user has scrolled up (away from bottom)
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // If user is near the bottom, enable auto-scroll
    shouldAutoScroll.current = distanceFromBottom < threshold;
  }, [threshold]);

  // Auto-scroll when dependencies change
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Scroll to bottom immediately (useful for initial load)
  const scrollToBottom = useCallback((instant: boolean = false) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: instant ? 'auto' : 'smooth',
      });
    }
  }, []);

  return {
    containerRef,
    handleScroll,
    scrollToBottom,
  };
}
