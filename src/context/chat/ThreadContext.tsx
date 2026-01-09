'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { ChatThread, Message, Citation, SourceChip } from '@/types/chat';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { chatService } from '@/services/chatService';
import {
  INITIAL_THREADS,
  INITIAL_MESSAGES,
  createUserMessage,
  createNewThread,
  generateThreadTitleFromMessage,
  getRelativeTimestamp,
} from '@/lib/chatUtils';
import { useClientContext } from './ClientContext';
import { useStreamingContext } from './StreamingContext';
import { useUIContext } from './UIContext';

// =============================================================================
// STATE
// =============================================================================

interface ThreadState {
  threads: ChatThread[];
  activeThreadId: string | null;
  messagesByThread: Record<string, Message[]>;
  inputValue: string;
  isLoading: boolean;
}

const initialState: ThreadState = {
  threads: INITIAL_THREADS,
  activeThreadId: INITIAL_THREADS[0]?.id || null,
  messagesByThread: INITIAL_MESSAGES,
  inputValue: '',
  isLoading: false,
};

// =============================================================================
// ACTIONS
// =============================================================================

type ThreadAction =
  | { type: 'SET_ACTIVE_THREAD'; payload: string | null }
  | { type: 'CREATE_THREAD'; payload: ChatThread }
  | { type: 'ADD_MESSAGE'; payload: { threadId: string; message: Message } }
  | { type: 'UPDATE_THREAD_TIMESTAMP'; payload: { threadId: string; timestamp: string } }
  | { type: 'SET_THREADS'; payload: ChatThread[] }
  | { type: 'SET_INPUT_VALUE'; payload: string }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'LOAD_PERSISTED_STATE'; payload: Partial<ThreadState> }
  | { type: 'UPDATE_THREAD_ID'; payload: { oldId: string; newId: string } };

// =============================================================================
// REDUCER
// =============================================================================

function threadReducer(state: ThreadState, action: ThreadAction): ThreadState {
  switch (action.type) {
    case 'SET_ACTIVE_THREAD':
      return { ...state, activeThreadId: action.payload };

    case 'CREATE_THREAD':
      return {
        ...state,
        threads: [action.payload, ...state.threads],
        activeThreadId: action.payload.id,
        messagesByThread: {
          ...state.messagesByThread,
          [action.payload.id]: [],
        },
      };

    case 'ADD_MESSAGE': {
      const { threadId, message } = action.payload;
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: [...(state.messagesByThread[threadId] || []), message],
        },
      };
    }

    case 'UPDATE_THREAD_TIMESTAMP': {
      const { threadId, timestamp } = action.payload;
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === threadId ? { ...thread, timestamp } : thread
        ),
      };
    }

    case 'SET_THREADS':
      return { ...state, threads: action.payload };

    case 'SET_INPUT_VALUE':
      return { ...state, inputValue: action.payload };

    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOAD_PERSISTED_STATE':
      return { ...state, ...action.payload };

    case 'UPDATE_THREAD_ID': {
      const { oldId, newId } = action.payload;
      const messages = state.messagesByThread[oldId] || [];
      const newMessagesByThread = { ...state.messagesByThread };
      delete newMessagesByThread[oldId];
      newMessagesByThread[newId] = messages;

      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === oldId ? { ...t, id: newId } : t
        ),
        activeThreadId: state.activeThreadId === oldId ? newId : state.activeThreadId,
        messagesByThread: newMessagesByThread,
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface ThreadContextValue extends ThreadState {
  // Derived state
  activeThread: ChatThread | null;
  activeMessages: Message[];

  // Actions
  selectThread: (threadId: string) => void;
  createThread: () => void;
  sendMessage: (content: string) => Promise<void>;
  setInputValue: (value: string) => void;
  cleanupEmptyThreads: () => Promise<void>;
}

const ThreadContext = createContext<ThreadContextValue | null>(null);

// =============================================================================
// STORAGE KEY
// =============================================================================

const STORAGE_KEY = 'margen-thread-state';

interface PersistedState {
  threads: ChatThread[];
  messagesByThread: Record<string, Message[]>;
  activeThreadId: string | null;
}

// =============================================================================
// PROVIDER
// =============================================================================

interface ThreadProviderProps {
  children: ReactNode;
}

export function ThreadProvider({ children }: ThreadProviderProps) {
  const [state, dispatch] = useReducer(threadReducer, initialState);

  // Request deduplication: track pending message fetches
  const pendingMessageRequests = useRef(new Map<string, Promise<Message[]>>());

  // Access other contexts
  const { selectedClient, selectedClientId } = useClientContext();
  const {
    startStreaming,
    setStreamStatus,
    appendStreamContent,
    addReasoningStep,
    addPendingSources,
    setStreamError,
    finalizeStreaming,
  } = useStreamingContext();
  const { setAttachedFile } = useUIContext();

  // Persistence
  const [persistedState, setPersistedState] = useLocalStorage<PersistedState | null>(
    STORAGE_KEY,
    null
  );

  // Load persisted state on mount
  useEffect(() => {
    if (persistedState) {
      dispatch({
        type: 'LOAD_PERSISTED_STATE',
        payload: {
          threads: persistedState.threads,
          messagesByThread: persistedState.messagesByThread,
          activeThreadId: persistedState.activeThreadId,
        },
      });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    setPersistedState({
      threads: state.threads,
      messagesByThread: state.messagesByThread,
      activeThreadId: state.activeThreadId,
    });
  }, [state.threads, state.messagesByThread, state.activeThreadId, setPersistedState]);

  // Load threads from API on mount
  useEffect(() => {
    const loadThreads = async () => {
      try {
        let response = await fetch('/api/threads');
        if (!response.ok) {
          response = await fetch('/api/test-threads');
        }

        if (response.ok) {
          const threadsData = await response.json();
          const transformedThreads: ChatThread[] = (threadsData.data || []).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            clientId: t.client_id as string,
            title: t.title as string,
            timestamp: getRelativeTimestamp(new Date(t.updated_at as string)),
          }));

          if (transformedThreads.length > 0) {
            dispatch({ type: 'SET_THREADS', payload: transformedThreads });
            if (!state.activeThreadId) {
              dispatch({ type: 'SET_ACTIVE_THREAD', payload: transformedThreads[0].id });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load threads:', error);
      }
    };

    loadThreads();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived state
  const activeThread =
    state.threads.find((t) => t.id === state.activeThreadId) || null;

  const activeMessages = state.activeThreadId
    ? state.messagesByThread[state.activeThreadId] || []
    : [];

  // Actions
  const selectThread = useCallback(async (threadId: string) => {
    dispatch({ type: 'SET_ACTIVE_THREAD', payload: threadId });

    // Load messages from API if not already loaded
    if (!state.messagesByThread[threadId]) {
      // Check if there's already a pending request for this thread (deduplication)
      if (pendingMessageRequests.current.has(threadId)) {
        // Wait for the existing request instead of making a new one
        await pendingMessageRequests.current.get(threadId);
        return;
      }

      // Create the fetch promise
      const fetchMessages = async (): Promise<Message[]> => {
        try {
          let response = await fetch(`/api/threads/${threadId}/messages`);
          if (!response.ok) {
            response = await fetch(`/api/test-messages?threadId=${threadId}`);
          }
          if (response.ok) {
            const data = await response.json();
            const messages: Message[] = (data.data || []).map((m: Record<string, unknown>) => ({
              id: m.id as string,
              role: m.role as 'user' | 'assistant',
              content: m.content as string,
              timestamp: new Date(m.created_at as string).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              citation: m.citation as Citation | undefined,
              sources: m.sources as SourceChip[] | undefined,
            }));
            dispatch({
              type: 'LOAD_PERSISTED_STATE',
              payload: {
                messagesByThread: {
                  ...state.messagesByThread,
                  [threadId]: messages,
                },
              },
            });
            return messages;
          }
          return [];
        } catch (error) {
          console.error('Failed to load messages:', error);
          return [];
        }
      };

      // Store the promise for deduplication
      const promise = fetchMessages();
      pendingMessageRequests.current.set(threadId, promise);

      try {
        await promise;
      } finally {
        // Clean up after request completes
        pendingMessageRequests.current.delete(threadId);
      }
    }
  }, [state.messagesByThread]);

  const createThread = useCallback(async () => {
    const localThread = createNewThread(selectedClientId);

    // Create optimistically in UI
    dispatch({ type: 'CREATE_THREAD', payload: localThread });

    // Persist to API
    try {
      let response = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          title: localThread.title,
        }),
      });

      if (!response.ok) {
        response = await fetch('/api/test-threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: selectedClientId,
            title: localThread.title,
          }),
        });
      }

      if (response.ok) {
        const dbThread = await response.json();
        dispatch({
          type: 'UPDATE_THREAD_ID',
          payload: { oldId: localThread.id, newId: dbThread.id },
        });
      }
    } catch (error) {
      console.error('Failed to persist thread:', error);
    }
  }, [selectedClientId]);

  const setInputValue = useCallback((value: string) => {
    dispatch({ type: 'SET_INPUT_VALUE', payload: value });
  }, []);

  // Cleanup empty threads (threads with 0 messages)
  const cleanupEmptyThreads = useCallback(async () => {
    const emptyThreadIds = state.threads
      .filter((thread) => {
        const messages = state.messagesByThread[thread.id] || [];
        return messages.length === 0;
      })
      .map((t) => t.id);

    if (emptyThreadIds.length === 0) return;

    // Delete empty threads from API
    for (const threadId of emptyThreadIds) {
      try {
        await fetch(`/api/threads/${threadId}`, { method: 'DELETE' });
      } catch (error) {
        console.error('Failed to delete empty thread:', threadId, error);
      }
    }

    // Update local state
    dispatch({
      type: 'SET_THREADS',
      payload: state.threads.filter((t) => !emptyThreadIds.includes(t.id)),
    });
  }, [state.threads, state.messagesByThread]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading) return;

      let threadId = state.activeThreadId;
      let isNewThread = false;

      // If no active thread, create one via API
      if (!threadId) {
        isNewThread = true;
        const title = generateThreadTitleFromMessage(content);

        try {
          let response = await fetch('/api/threads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: selectedClientId,
              title,
            }),
          });

          if (!response.ok) {
            response = await fetch('/api/test-threads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId: selectedClientId,
                title,
              }),
            });
          }

          if (response.ok) {
            const dbThread = await response.json();
            threadId = dbThread.id;
            dispatch({
              type: 'CREATE_THREAD',
              payload: {
                id: dbThread.id,
                clientId: selectedClientId,
                title,
                timestamp: getRelativeTimestamp(new Date()),
              },
            });
          } else {
            const localThread = createNewThread(selectedClientId);
            dispatch({ type: 'CREATE_THREAD', payload: localThread });
            threadId = localThread.id;
          }
        } catch {
          const localThread = createNewThread(selectedClientId);
          dispatch({ type: 'CREATE_THREAD', payload: localThread });
          threadId = localThread.id;
        }
      }

      if (!threadId) {
        console.error('Failed to create thread');
        return;
      }

      // Create user message
      const userMessage = createUserMessage(content);

      // Add user message immediately
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { threadId, message: userMessage },
      });

      // Persist user message to API
      try {
        let msgResponse = await fetch(`/api/threads/${threadId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content }),
        });

        if (!msgResponse.ok) {
          await fetch('/api/test-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threadId, role: 'user', content }),
          });
        }
      } catch (error) {
        console.error('Failed to persist user message:', error);
      }

      // Update thread title if first message
      const existingMessages = state.messagesByThread[threadId] || [];
      if (!isNewThread && existingMessages.length === 0) {
        const title = generateThreadTitleFromMessage(content);
        dispatch({
          type: 'LOAD_PERSISTED_STATE',
          payload: {
            threads: state.threads.map((t) =>
              t.id === threadId ? { ...t, title } : t
            ),
          },
        });
      }

      // Update thread timestamp
      dispatch({
        type: 'UPDATE_THREAD_TIMESTAMP',
        payload: { threadId, timestamp: getRelativeTimestamp(new Date()) },
      });

      // Clear input and attached file
      dispatch({ type: 'SET_INPUT_VALUE', payload: '' });
      setAttachedFile(null);

      // Start streaming
      startStreaming();

      try {
        let fullContent = '';
        let citation: Citation | undefined;
        const collectedSources: SourceChip[] = [];

        // Use streaming API with client context
        for await (const event of chatService.streamMessage({
          message: content,
          clientId: selectedClientId,
          threadId,
          model: 'claude-4',
          context: {
            clientData: selectedClient,
            previousMessages: [...existingMessages, userMessage],
          },
        })) {
          switch (event.type) {
            case 'status':
              setStreamStatus(event.message);
              break;

            case 'reasoning':
              addReasoningStep({ step: event.step, node: event.node, description: event.description });
              break;

            case 'chunk': {
              const sourceChips = event.chunks.map((chunk) => ({
                chunkId: chunk.chunkId,
                citation: chunk.citation,
                relevanceScore: chunk.relevanceScore,
                authorityLevel: (chunk as { authorityLevel?: number }).authorityLevel,
                sourceLabel: (chunk as { sourceLabel?: string }).sourceLabel,
                link: (chunk as { link?: string }).link,
                canDrillInto: selectedClient?.state !== 'UT',
              }));
              collectedSources.push(...sourceChips);
              addPendingSources(sourceChips);
              if (event.chunks.length > 0 && !citation) {
                const firstChunk = event.chunks[0] as {
                  citation: string;
                  chunkId: string;
                  authorityLevel?: number;
                  sourceLabel?: string;
                };
                citation = {
                  source: firstChunk.citation,
                  excerpt: 'View source for full details',
                  chunkId: firstChunk.chunkId,
                  authorityLevel: firstChunk.authorityLevel,
                  sourceLabel: firstChunk.sourceLabel,
                };
              }
              break;
            }

            case 'answer':
              fullContent += event.content;
              appendStreamContent(event.content);
              break;

            case 'complete': {
              const metadata = event.metadata as {
                formsMentioned?: string[];
                taxType?: string;
                taxTypeLabel?: string;
                warnings?: string[];
                confidenceLabel?: string;
              } | undefined;

              const assistantMessage: Message = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: fullContent,
                timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                citation,
                sources: collectedSources.length > 0 ? collectedSources : undefined,
                formsMentioned: metadata?.formsMentioned,
                taxType: metadata?.taxType,
                taxTypeLabel: metadata?.taxTypeLabel,
                warnings: metadata?.warnings,
                confidenceLabel: metadata?.confidenceLabel,
                canDrillIntoSources: selectedClient?.state !== 'UT',
              };

              dispatch({
                type: 'ADD_MESSAGE',
                payload: { threadId: threadId!, message: assistantMessage },
              });
              finalizeStreaming();

              // Persist assistant message
              try {
                let asstResponse = await fetch(`/api/threads/${threadId}/messages`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: 'assistant', content: fullContent }),
                });

                if (!asstResponse.ok) {
                  await fetch('/api/test-messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ threadId, role: 'assistant', content: fullContent, citation }),
                  });
                }
              } catch (error) {
                console.error('Failed to persist assistant message:', error);
              }
              break;
            }

            case 'error':
              setStreamError(event.message);
              break;
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        setStreamError(error instanceof Error ? error.message : 'Unknown error');
      }
    },
    [
      state.activeThreadId,
      state.isLoading,
      state.messagesByThread,
      state.threads,
      selectedClientId,
      selectedClient,
      startStreaming,
      setStreamStatus,
      appendStreamContent,
      addReasoningStep,
      addPendingSources,
      setStreamError,
      finalizeStreaming,
      setAttachedFile,
    ]
  );

  const value: ThreadContextValue = {
    ...state,
    activeThread,
    activeMessages,
    selectThread,
    createThread,
    sendMessage,
    setInputValue,
    cleanupEmptyThreads,
  };

  return <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useThreadContext() {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error('useThreadContext must be used within a ThreadProvider');
  }
  return context;
}
