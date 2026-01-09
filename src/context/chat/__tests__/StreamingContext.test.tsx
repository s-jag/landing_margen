import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StreamingProvider, useStreamingContext } from '../StreamingContext';
import type { ReasoningStep, SourceChip } from '@/types/chat';

// =============================================================================
// HELPER
// =============================================================================

function renderStreamingContext() {
  return renderHook(() => useStreamingContext(), {
    wrapper: ({ children }) => <StreamingProvider>{children}</StreamingProvider>,
  });
}

// =============================================================================
// HOOK ERROR TESTS
// =============================================================================

describe('useStreamingContext', () => {
  it('throws error when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useStreamingContext());
    }).toThrow('useStreamingContext must be used within a StreamingProvider');

    spy.mockRestore();
  });
});

// =============================================================================
// INITIAL STATE TESTS
// =============================================================================

describe('StreamingProvider initial state', () => {
  it('has correct initial state values', () => {
    const { result } = renderStreamingContext();

    expect(result.current.isTyping).toBe(false);
    expect(result.current.streamingContent).toBe('');
    expect(result.current.reasoningSteps).toEqual([]);
    expect(result.current.pendingSources).toEqual([]);
    expect(result.current.streamStatus).toBe('');
    expect(result.current.streamError).toBeNull();
    expect(result.current.isStreaming).toBe(false);
  });
});

// =============================================================================
// START STREAMING TESTS
// =============================================================================

describe('startStreaming', () => {
  it('sets initial streaming state', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.startStreaming();
    });

    expect(result.current.isTyping).toBe(true);
    expect(result.current.streamingContent).toBe('');
    expect(result.current.reasoningSteps).toEqual([]);
    expect(result.current.pendingSources).toEqual([]);
    expect(result.current.streamStatus).toBe('Starting...');
    expect(result.current.streamError).toBeNull();
  });

  it('clears previous streaming state', () => {
    const { result } = renderStreamingContext();

    // Set up some state
    act(() => {
      result.current.startStreaming();
      result.current.appendStreamContent('Old content');
      result.current.setStreamError('Old error');
    });

    // Start fresh
    act(() => {
      result.current.startStreaming();
    });

    expect(result.current.streamingContent).toBe('');
    expect(result.current.streamError).toBeNull();
  });
});

// =============================================================================
// STREAM STATUS TESTS
// =============================================================================

describe('setStreamStatus', () => {
  it('sets stream status message', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.setStreamStatus('Processing query...');
    });

    expect(result.current.streamStatus).toBe('Processing query...');
  });

  it('updates status message', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.setStreamStatus('First status');
    });

    act(() => {
      result.current.setStreamStatus('Second status');
    });

    expect(result.current.streamStatus).toBe('Second status');
  });
});

// =============================================================================
// STREAM CONTENT TESTS
// =============================================================================

describe('appendStreamContent', () => {
  it('appends content to streaming content', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.appendStreamContent('Hello ');
    });

    expect(result.current.streamingContent).toBe('Hello ');
  });

  it('accumulates content with multiple appends', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.appendStreamContent('Hello ');
    });

    act(() => {
      result.current.appendStreamContent('World!');
    });

    expect(result.current.streamingContent).toBe('Hello World!');
  });
});

// =============================================================================
// REASONING STEP TESTS
// =============================================================================

describe('addReasoningStep', () => {
  it('adds a reasoning step', () => {
    const { result } = renderStreamingContext();

    const step: ReasoningStep = {
      step: 1,
      node: 'query_analysis',
      description: 'Analyzing query intent',
    };

    act(() => {
      result.current.addReasoningStep(step);
    });

    expect(result.current.reasoningSteps).toHaveLength(1);
    expect(result.current.reasoningSteps[0]).toEqual(step);
  });

  it('accumulates multiple reasoning steps', () => {
    const { result } = renderStreamingContext();

    const step1: ReasoningStep = { step: 1, node: 'analysis', description: 'Step 1' };
    const step2: ReasoningStep = { step: 2, node: 'retrieval', description: 'Step 2' };

    act(() => {
      result.current.addReasoningStep(step1);
    });

    act(() => {
      result.current.addReasoningStep(step2);
    });

    expect(result.current.reasoningSteps).toHaveLength(2);
    expect(result.current.reasoningSteps[0]).toEqual(step1);
    expect(result.current.reasoningSteps[1]).toEqual(step2);
  });
});

// =============================================================================
// PENDING SOURCES TESTS
// =============================================================================

describe('addPendingSources', () => {
  it('adds pending sources', () => {
    const { result } = renderStreamingContext();

    const sources: SourceChip[] = [
      { chunkId: 'chunk-1', citation: 'Source 1', relevanceScore: 0.9 },
      { chunkId: 'chunk-2', citation: 'Source 2', relevanceScore: 0.8 },
    ];

    act(() => {
      result.current.addPendingSources(sources);
    });

    expect(result.current.pendingSources).toHaveLength(2);
    expect(result.current.pendingSources).toEqual(sources);
  });

  it('accumulates sources from multiple calls', () => {
    const { result } = renderStreamingContext();

    const sources1: SourceChip[] = [{ chunkId: 'chunk-1', citation: 'Source 1', relevanceScore: 0.9 }];
    const sources2: SourceChip[] = [{ chunkId: 'chunk-2', citation: 'Source 2', relevanceScore: 0.8 }];

    act(() => {
      result.current.addPendingSources(sources1);
    });

    act(() => {
      result.current.addPendingSources(sources2);
    });

    expect(result.current.pendingSources).toHaveLength(2);
  });
});

// =============================================================================
// STREAM ERROR TESTS
// =============================================================================

describe('setStreamError', () => {
  it('sets stream error and stops typing', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.startStreaming();
    });

    expect(result.current.isTyping).toBe(true);

    act(() => {
      result.current.setStreamError('Connection failed');
    });

    expect(result.current.streamError).toBe('Connection failed');
    expect(result.current.isTyping).toBe(false);
    expect(result.current.streamStatus).toBe('');
  });
});

// =============================================================================
// CLEAR STREAMING TESTS
// =============================================================================

describe('clearStreaming', () => {
  it('clears all streaming state except isTyping', () => {
    const { result } = renderStreamingContext();

    // Set up state
    act(() => {
      result.current.startStreaming();
      result.current.appendStreamContent('Some content');
      result.current.addReasoningStep({ step: 1, node: 'test', description: 'Test' });
      result.current.addPendingSources([{ chunkId: 'c1', citation: 'Test', relevanceScore: 0.9 }]);
      result.current.setStreamStatus('Processing');
    });

    // Clear
    act(() => {
      result.current.clearStreaming();
    });

    expect(result.current.streamingContent).toBe('');
    expect(result.current.reasoningSteps).toEqual([]);
    expect(result.current.pendingSources).toEqual([]);
    expect(result.current.streamStatus).toBe('');
    expect(result.current.streamError).toBeNull();
  });
});

// =============================================================================
// FINALIZE STREAMING TESTS
// =============================================================================

describe('finalizeStreaming', () => {
  it('stops typing and clears streaming state', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.startStreaming();
      result.current.appendStreamContent('Response content');
    });

    act(() => {
      result.current.finalizeStreaming();
    });

    expect(result.current.isTyping).toBe(false);
    expect(result.current.streamingContent).toBe('');
    expect(result.current.reasoningSteps).toEqual([]);
    expect(result.current.pendingSources).toEqual([]);
    expect(result.current.streamStatus).toBe('');
  });
});

// =============================================================================
// SET IS TYPING TESTS
// =============================================================================

describe('setIsTyping', () => {
  it('sets typing state directly', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.setIsTyping(true);
    });

    expect(result.current.isTyping).toBe(true);

    act(() => {
      result.current.setIsTyping(false);
    });

    expect(result.current.isTyping).toBe(false);
  });
});

// =============================================================================
// IS STREAMING DERIVED STATE TESTS
// =============================================================================

describe('isStreaming derived state', () => {
  it('returns false when not typing', () => {
    const { result } = renderStreamingContext();
    expect(result.current.isStreaming).toBe(false);
  });

  it('returns false when typing but no content or steps', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.setIsTyping(true);
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it('returns true when typing with content', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.setIsTyping(true);
      result.current.appendStreamContent('Some content');
    });

    expect(result.current.isStreaming).toBe(true);
  });

  it('returns true when typing with reasoning steps', () => {
    const { result } = renderStreamingContext();

    act(() => {
      result.current.setIsTyping(true);
      result.current.addReasoningStep({ step: 1, node: 'test', description: 'Test' });
    });

    expect(result.current.isStreaming).toBe(true);
  });
});
