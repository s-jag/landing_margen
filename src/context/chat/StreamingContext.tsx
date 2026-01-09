'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { ReasoningStep, SourceChip } from '@/types/chat';

// =============================================================================
// STATE
// =============================================================================

interface StreamingState {
  isTyping: boolean;
  streamingContent: string;
  reasoningSteps: ReasoningStep[];
  pendingSources: SourceChip[];
  streamStatus: string;
  streamError: string | null;
}

const initialState: StreamingState = {
  isTyping: false,
  streamingContent: '',
  reasoningSteps: [],
  pendingSources: [],
  streamStatus: '',
  streamError: null,
};

// =============================================================================
// ACTIONS
// =============================================================================

type StreamingAction =
  | { type: 'SET_IS_TYPING'; payload: boolean }
  | { type: 'START_STREAMING' }
  | { type: 'STREAM_STATUS'; payload: string }
  | { type: 'STREAM_CONTENT'; payload: string }
  | { type: 'ADD_REASONING_STEP'; payload: ReasoningStep }
  | { type: 'ADD_PENDING_SOURCES'; payload: SourceChip[] }
  | { type: 'STREAM_ERROR'; payload: string }
  | { type: 'CLEAR_STREAMING' }
  | { type: 'FINALIZE_STREAMING' };

// =============================================================================
// REDUCER
// =============================================================================

function streamingReducer(state: StreamingState, action: StreamingAction): StreamingState {
  switch (action.type) {
    case 'SET_IS_TYPING':
      return { ...state, isTyping: action.payload };

    case 'START_STREAMING':
      return {
        ...state,
        isTyping: true,
        streamingContent: '',
        reasoningSteps: [],
        pendingSources: [],
        streamStatus: 'Starting...',
        streamError: null,
      };

    case 'STREAM_STATUS':
      return { ...state, streamStatus: action.payload };

    case 'STREAM_CONTENT':
      return {
        ...state,
        streamingContent: state.streamingContent + action.payload,
      };

    case 'ADD_REASONING_STEP':
      return {
        ...state,
        reasoningSteps: [...state.reasoningSteps, action.payload],
      };

    case 'ADD_PENDING_SOURCES':
      return {
        ...state,
        pendingSources: [...state.pendingSources, ...action.payload],
      };

    case 'STREAM_ERROR':
      return {
        ...state,
        isTyping: false,
        streamError: action.payload,
        streamStatus: '',
      };

    case 'CLEAR_STREAMING':
      return {
        ...state,
        streamingContent: '',
        reasoningSteps: [],
        pendingSources: [],
        streamStatus: '',
        streamError: null,
      };

    case 'FINALIZE_STREAMING':
      return {
        ...state,
        isTyping: false,
        streamingContent: '',
        reasoningSteps: [],
        pendingSources: [],
        streamStatus: '',
      };

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface StreamingContextValue extends StreamingState {
  // Derived state
  isStreaming: boolean;

  // Actions
  startStreaming: () => void;
  setStreamStatus: (status: string) => void;
  appendStreamContent: (content: string) => void;
  addReasoningStep: (step: ReasoningStep) => void;
  addPendingSources: (sources: SourceChip[]) => void;
  setStreamError: (error: string) => void;
  clearStreaming: () => void;
  finalizeStreaming: () => void;
  setIsTyping: (isTyping: boolean) => void;
}

const StreamingContext = createContext<StreamingContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface StreamingProviderProps {
  children: ReactNode;
}

export function StreamingProvider({ children }: StreamingProviderProps) {
  const [state, dispatch] = useReducer(streamingReducer, initialState);

  // Derived state
  const isStreaming = state.isTyping && (state.streamingContent.length > 0 || state.reasoningSteps.length > 0);

  // Actions
  const startStreaming = useCallback(() => {
    dispatch({ type: 'START_STREAMING' });
  }, []);

  const setStreamStatus = useCallback((status: string) => {
    dispatch({ type: 'STREAM_STATUS', payload: status });
  }, []);

  const appendStreamContent = useCallback((content: string) => {
    dispatch({ type: 'STREAM_CONTENT', payload: content });
  }, []);

  const addReasoningStep = useCallback((step: ReasoningStep) => {
    dispatch({ type: 'ADD_REASONING_STEP', payload: step });
  }, []);

  const addPendingSources = useCallback((sources: SourceChip[]) => {
    dispatch({ type: 'ADD_PENDING_SOURCES', payload: sources });
  }, []);

  const setStreamError = useCallback((error: string) => {
    dispatch({ type: 'STREAM_ERROR', payload: error });
  }, []);

  const clearStreaming = useCallback(() => {
    dispatch({ type: 'CLEAR_STREAMING' });
  }, []);

  const finalizeStreaming = useCallback(() => {
    dispatch({ type: 'FINALIZE_STREAMING' });
  }, []);

  const setIsTyping = useCallback((isTyping: boolean) => {
    dispatch({ type: 'SET_IS_TYPING', payload: isTyping });
  }, []);

  const value: StreamingContextValue = {
    ...state,
    isStreaming,
    startStreaming,
    setStreamStatus,
    appendStreamContent,
    addReasoningStep,
    addPendingSources,
    setStreamError,
    clearStreaming,
    finalizeStreaming,
    setIsTyping,
  };

  return <StreamingContext.Provider value={value}>{children}</StreamingContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useStreamingContext() {
  const context = useContext(StreamingContext);
  if (!context) {
    throw new Error('useStreamingContext must be used within a StreamingProvider');
  }
  return context;
}
