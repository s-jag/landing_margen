'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { ChatState, ChatAction, Client, ChatThread, Message, Document, DocumentType, Task, Citation, ReasoningStep, SourceChip } from '@/types/chat';
import { chatService } from '@/services/chatService';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  MOCK_CLIENTS,
  INITIAL_THREADS,
  INITIAL_MESSAGES,
  createUserMessage,
  createNewThread,
  generateThreadTitleFromMessage,
  getRelativeTimestamp,
  createDocument,
} from '@/lib/chatUtils';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: ChatState = {
  clients: MOCK_CLIENTS,
  selectedClientId: MOCK_CLIENTS[0].id,
  threads: INITIAL_THREADS,
  activeThreadId: INITIAL_THREADS[0]?.id || null,
  messagesByThread: INITIAL_MESSAGES,
  tasks: [],
  selectedTaskId: null,
  inputValue: '',
  isLoading: false,
  isTyping: false,
  isInitialLoading: true,
  initialLoadError: null,
  attachedFile: null,
  isUploading: false,
  uploadError: null,
  streamingContent: '',
  reasoningSteps: [],
  pendingSources: [],
  streamStatus: '',
  streamError: null,
  clientDropdownOpen: false,
  viewingDocument: null,
  uploadModalOpen: false,
  viewingCitation: null,
};

// =============================================================================
// REDUCER
// =============================================================================

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_SELECTED_CLIENT':
      return {
        ...state,
        selectedClientId: action.payload,
        clientDropdownOpen: false,
      };

    case 'SET_CLIENT_DROPDOWN_OPEN':
      return {
        ...state,
        clientDropdownOpen: action.payload,
      };

    case 'SET_ACTIVE_THREAD':
      return {
        ...state,
        activeThreadId: action.payload,
      };

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

    case 'SET_INPUT_VALUE':
      return {
        ...state,
        inputValue: action.payload,
      };

    case 'SET_IS_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_IS_TYPING':
      return {
        ...state,
        isTyping: action.payload,
      };

    case 'LOAD_PERSISTED_STATE':
      return {
        ...state,
        ...action.payload,
      };

    case 'SET_VIEWING_DOCUMENT':
      return {
        ...state,
        viewingDocument: action.payload,
      };

    case 'SET_UPLOAD_MODAL_OPEN':
      return {
        ...state,
        uploadModalOpen: action.payload,
      };

    case 'ADD_DOCUMENT': {
      const { clientId, document } = action.payload;
      return {
        ...state,
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, documents: [...client.documents, document] }
            : client
        ),
        uploadModalOpen: false,
      };
    }

    // Task actions
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };

    case 'UPDATE_TASK': {
      const { taskId, updates } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        ),
      };
    }

    case 'SET_SELECTED_TASK':
      return {
        ...state,
        selectedTaskId: action.payload,
      };

    case 'ADVANCE_TASK_STEP': {
      const taskId = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const newSteps = task.steps.map((step, i) => {
            if (i < task.currentStepIndex) return { ...step, status: 'done' as const };
            if (i === task.currentStepIndex) return { ...step, status: 'done' as const };
            if (i === task.currentStepIndex + 1) return { ...step, status: 'running' as const };
            return step;
          });
          return {
            ...task,
            currentStepIndex: task.currentStepIndex + 1,
            steps: newSteps,
          };
        }),
      };
    }

    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? {
                ...task,
                status: 'ready' as const,
                steps: task.steps.map((s) => ({ ...s, status: 'done' as const })),
              }
            : task
        ),
      };

    // File attachment
    case 'SET_ATTACHED_FILE':
      return {
        ...state,
        attachedFile: action.payload,
        uploadError: null, // Clear error when file changes
      };

    case 'SET_IS_UPLOADING':
      return {
        ...state,
        isUploading: action.payload,
      };

    case 'SET_UPLOAD_ERROR':
      return {
        ...state,
        uploadError: action.payload,
        isUploading: false,
      };

    // Citation modal
    case 'SET_VIEWING_CITATION':
      return {
        ...state,
        viewingCitation: action.payload,
      };

    // Streaming actions
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
      return {
        ...state,
        streamStatus: action.payload,
      };

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

    case 'FINALIZE_MESSAGE': {
      const { threadId, message } = action.payload;
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: [...(state.messagesByThread[threadId] || []), message],
        },
        isTyping: false,
        streamingContent: '',
        reasoningSteps: [],
        pendingSources: [],
        streamStatus: '',
      };
    }

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

    // Data loading
    case 'SET_CLIENTS':
      return {
        ...state,
        clients: action.payload,
      };

    case 'SET_THREADS':
      return {
        ...state,
        threads: action.payload,
      };

    case 'SET_INITIAL_LOADING':
      return {
        ...state,
        isInitialLoading: action.payload,
      };

    case 'SET_INITIAL_LOAD_ERROR':
      return {
        ...state,
        initialLoadError: action.payload,
        isInitialLoading: false,
      };

    case 'INITIAL_DATA_LOADED':
      return {
        ...state,
        clients: action.payload.clients.length > 0 ? action.payload.clients : state.clients,
        threads: action.payload.threads.length > 0 ? action.payload.threads : state.threads,
        selectedClientId: action.payload.clients.length > 0
          ? action.payload.clients[0].id
          : state.selectedClientId,
        activeThreadId: action.payload.threads.length > 0
          ? action.payload.threads[0].id
          : state.activeThreadId,
        isInitialLoading: false,
        initialLoadError: null,
      };

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface ChatContextValue extends ChatState {
  // Derived state
  selectedClient: Client;
  activeMessages: Message[];
  activeThread: ChatThread | null;
  selectedTask: Task | null;
  inProgressTasks: Task[];
  readyTasks: Task[];

  // Streaming state (exposed for UI)
  isStreaming: boolean;

  // Actions
  selectClient: (clientId: string) => void;
  setClientDropdownOpen: (open: boolean) => void;
  selectThread: (threadId: string) => void;
  createThread: () => void;
  sendMessage: (content: string) => Promise<void>;
  setInputValue: (value: string) => void;

  // Document actions
  openDocumentViewer: (document: Document) => void;
  closeDocumentViewer: () => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  addDocument: (name: string, type: DocumentType) => void;

  // Task actions
  selectTask: (taskId: string | null) => void;
  addTask: (task: Task) => void;
  advanceTaskStep: (taskId: string) => void;
  completeTask: (taskId: string) => void;

  // File attachment and upload
  setAttachedFile: (file: { name: string; size: number; file: File; type: DocumentType } | null) => void;
  uploadFile: (file: File, type: DocumentType) => Promise<string | null>;
  isUploading: boolean;
  uploadError: string | null;

  // Citation modal
  openCitation: (citation: Citation) => void;
  closeCitation: () => void;
  fetchSourceAndOpen: (chunkId: string, citation: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface ChatProviderProps {
  children: ReactNode;
}

// Storage key for persisted state
const STORAGE_KEY = 'margen-chat-state';

interface PersistedState {
  threads: ChatThread[];
  messagesByThread: Record<string, Message[]>;
  selectedClientId: string;
  activeThreadId: string | null;
  clients: Client[];
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Persist state to localStorage
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
          selectedClientId: persistedState.selectedClientId,
          activeThreadId: persistedState.activeThreadId,
          clients: persistedState.clients || MOCK_CLIENTS,
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
      selectedClientId: state.selectedClientId,
      activeThreadId: state.activeThreadId,
      clients: state.clients,
    });
  }, [state.threads, state.messagesByThread, state.selectedClientId, state.activeThreadId, state.clients, setPersistedState]);

  // Load initial data from API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_INITIAL_LOADING', payload: true });

        // Fetch clients and threads in parallel
        const [clientsRes, threadsRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/threads'),
        ]);

        // If not authenticated, both will fail - that's handled by middleware
        if (!clientsRes.ok && clientsRes.status === 401) {
          // User not authenticated, skip API loading (will use mock data)
          dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
          return;
        }

        const [clientsData, threadsData] = await Promise.all([
          clientsRes.ok ? clientsRes.json() : { data: [] },
          threadsRes.ok ? threadsRes.json() : { data: [] },
        ]);

        // Transform database format to frontend format
        const transformedClients: Client[] = (clientsData.data || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          state: c.state as string,
          taxYear: c.tax_year as number,
          filingStatus: c.filing_status as string,
          ssn: `***-**-${c.ssn_last_four || '****'}`,
          grossIncome: c.gross_income as number || 0,
          schedCRevenue: c.sched_c_revenue as number || 0,
          dependents: c.dependents as number || 0,
          documents: [], // Documents loaded separately
        }));

        const transformedThreads: ChatThread[] = (threadsData.data || []).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          clientId: t.client_id as string,
          title: t.title as string,
          timestamp: getRelativeTimestamp(new Date(t.updated_at as string)),
        }));

        dispatch({
          type: 'INITIAL_DATA_LOADED',
          payload: { clients: transformedClients, threads: transformedThreads },
        });
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // On error, keep using mock data
        dispatch({
          type: 'SET_INITIAL_LOAD_ERROR',
          payload: error instanceof Error ? error.message : 'Failed to load data',
        });
      }
    };

    loadInitialData();
  }, []);

  // =============================================================================
  // DERIVED STATE
  // =============================================================================

  const selectedClient =
    state.clients.find((c) => c.id === state.selectedClientId) || state.clients[0];

  const activeThread =
    state.threads.find((t) => t.id === state.activeThreadId) || null;

  const activeMessages = state.activeThreadId
    ? state.messagesByThread[state.activeThreadId] || []
    : [];

  const selectedTask = state.selectedTaskId
    ? state.tasks.find((t) => t.id === state.selectedTaskId) || null
    : null;

  const inProgressTasks = state.tasks.filter((t) => t.status === 'in_progress');
  const readyTasks = state.tasks.filter((t) => t.status === 'ready');

  // Streaming state - check if we're actively streaming content
  const isStreaming = state.isTyping && (state.streamingContent.length > 0 || state.reasoningSteps.length > 0);

  // =============================================================================
  // ACTIONS
  // =============================================================================

  const selectClient = useCallback((clientId: string) => {
    dispatch({ type: 'SET_SELECTED_CLIENT', payload: clientId });
  }, []);

  const setClientDropdownOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_CLIENT_DROPDOWN_OPEN', payload: open });
  }, []);

  const selectThread = useCallback((threadId: string) => {
    dispatch({ type: 'SET_ACTIVE_THREAD', payload: threadId });
  }, []);

  const createThread = useCallback(() => {
    const newThread = createNewThread(state.selectedClientId);
    dispatch({ type: 'CREATE_THREAD', payload: newThread });
  }, [state.selectedClientId]);

  const setInputValue = useCallback((value: string) => {
    dispatch({ type: 'SET_INPUT_VALUE', payload: value });
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading || state.isTyping) return;

      let threadId = state.activeThreadId;

      // If no active thread, create one
      if (!threadId) {
        const newThread = createNewThread(state.selectedClientId);
        dispatch({ type: 'CREATE_THREAD', payload: newThread });
        threadId = newThread.id;
      }

      // Create user message
      const userMessage = createUserMessage(content);

      // Add user message immediately
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { threadId, message: userMessage },
      });

      // Update thread title if this is the first message
      const existingMessages = state.messagesByThread[threadId] || [];
      if (existingMessages.length === 0) {
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
      dispatch({ type: 'SET_ATTACHED_FILE', payload: null });

      // Start streaming
      dispatch({ type: 'START_STREAMING' });

      try {
        let fullContent = '';
        let citation: Citation | undefined;
        const collectedSources: SourceChip[] = [];

        // Use streaming API
        for await (const event of chatService.streamMessage({
          message: content,
          clientId: state.selectedClientId,
          threadId,
          model: 'claude-4',
          context: {
            clientData: selectedClient,
            previousMessages: [...existingMessages, userMessage],
          },
        })) {
          switch (event.type) {
            case 'status':
              dispatch({ type: 'STREAM_STATUS', payload: event.message });
              break;

            case 'reasoning':
              dispatch({
                type: 'ADD_REASONING_STEP',
                payload: { step: event.step, node: event.node, description: event.description },
              });
              break;

            case 'chunk':
              // Collect sources for final message
              collectedSources.push(...event.chunks);
              dispatch({ type: 'ADD_PENDING_SOURCES', payload: event.chunks });
              // Use first chunk as citation if we have sources
              if (event.chunks.length > 0 && !citation) {
                citation = {
                  source: event.chunks[0].citation,
                  excerpt: 'View source for full details',
                  chunkId: event.chunks[0].chunkId,
                };
              }
              break;

            case 'answer':
              fullContent += event.content;
              dispatch({ type: 'STREAM_CONTENT', payload: event.content });
              break;

            case 'complete':
              // Finalize the message with sources
              const assistantMessage: Message = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: fullContent,
                timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                citation,
                sources: collectedSources.length > 0 ? collectedSources : undefined,
              };
              dispatch({
                type: 'FINALIZE_MESSAGE',
                payload: { threadId: threadId!, message: assistantMessage },
              });
              break;

            case 'error':
              dispatch({ type: 'STREAM_ERROR', payload: event.message });
              break;
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        dispatch({ type: 'STREAM_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      }
    },
    [
      state.activeThreadId,
      state.isLoading,
      state.isTyping,
      state.selectedClientId,
      state.messagesByThread,
      state.threads,
      selectedClient,
    ]
  );

  // =============================================================================
  // DOCUMENT ACTIONS
  // =============================================================================

  const openDocumentViewer = useCallback((document: Document) => {
    dispatch({ type: 'SET_VIEWING_DOCUMENT', payload: document });
  }, []);

  const closeDocumentViewer = useCallback(() => {
    dispatch({ type: 'SET_VIEWING_DOCUMENT', payload: null });
  }, []);

  const openUploadModal = useCallback(() => {
    dispatch({ type: 'SET_UPLOAD_MODAL_OPEN', payload: true });
  }, []);

  const closeUploadModal = useCallback(() => {
    dispatch({ type: 'SET_UPLOAD_MODAL_OPEN', payload: false });
  }, []);

  const addDocument = useCallback(
    (name: string, type: DocumentType) => {
      const document = createDocument(name, type);
      dispatch({
        type: 'ADD_DOCUMENT',
        payload: { clientId: state.selectedClientId, document },
      });
    },
    [state.selectedClientId]
  );

  // =============================================================================
  // TASK ACTIONS
  // =============================================================================

  const selectTask = useCallback((taskId: string | null) => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: taskId });
  }, []);

  const addTask = useCallback((task: Task) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  }, []);

  const advanceTaskStep = useCallback((taskId: string) => {
    dispatch({ type: 'ADVANCE_TASK_STEP', payload: taskId });
  }, []);

  const completeTask = useCallback((taskId: string) => {
    dispatch({ type: 'COMPLETE_TASK', payload: taskId });
  }, []);

  // =============================================================================
  // FILE ATTACHMENT ACTIONS
  // =============================================================================

  const setAttachedFile = useCallback((file: { name: string; size: number; file: File; type: DocumentType } | null) => {
    dispatch({ type: 'SET_ATTACHED_FILE', payload: file });
  }, []);

  const uploadFile = useCallback(async (file: File, type: DocumentType): Promise<string | null> => {
    if (!selectedClient) {
      dispatch({ type: 'SET_UPLOAD_ERROR', payload: 'No client selected' });
      return null;
    }

    dispatch({ type: 'SET_IS_UPLOADING', payload: true });
    dispatch({ type: 'SET_UPLOAD_ERROR', payload: null });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', selectedClient.id);
      formData.append('name', file.name);
      formData.append('type', type);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      dispatch({ type: 'SET_IS_UPLOADING', payload: false });

      // Add document to client's documents list
      if (data.document) {
        dispatch({
          type: 'ADD_DOCUMENT',
          payload: { clientId: selectedClient.id, document: data.document },
        });
      }

      return data.document?.id || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      dispatch({ type: 'SET_UPLOAD_ERROR', payload: message });
      return null;
    }
  }, [selectedClient]);

  // =============================================================================
  // CITATION MODAL ACTIONS
  // =============================================================================

  const openCitation = useCallback((citation: Citation) => {
    dispatch({ type: 'SET_VIEWING_CITATION', payload: citation });
  }, []);

  const closeCitation = useCallback(() => {
    dispatch({ type: 'SET_VIEWING_CITATION', payload: null });
  }, []);

  const fetchSourceAndOpen = useCallback(async (chunkId: string, citation: string) => {
    // Show loading state immediately
    dispatch({
      type: 'SET_VIEWING_CITATION',
      payload: {
        source: citation,
        excerpt: 'Loading source text...',
        isLoading: true,
        chunkId,
      },
    });

    try {
      const response = await fetch(`/api/test-sources/${encodeURIComponent(chunkId)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch source');
      }

      const data = await response.json();

      dispatch({
        type: 'SET_VIEWING_CITATION',
        payload: {
          source: data.citation || citation,
          excerpt: data.textWithAncestry || data.text || 'No text available',
          fullText: data.text,
          link: data.link,
          docType: data.docType,
          chunkId: data.chunkId,
          isLoading: false,
        },
      });
    } catch (error) {
      console.error('Failed to fetch source:', error);
      dispatch({
        type: 'SET_VIEWING_CITATION',
        payload: {
          source: citation,
          excerpt: 'Failed to load source text. Please try again.',
          isLoading: false,
          chunkId,
        },
      });
    }
  }, []);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const value: ChatContextValue = {
    ...state,
    selectedClient,
    activeMessages,
    activeThread,
    selectedTask,
    inProgressTasks,
    readyTasks,
    isStreaming,
    selectClient,
    setClientDropdownOpen,
    selectThread,
    createThread,
    sendMessage,
    setInputValue,
    openDocumentViewer,
    closeDocumentViewer,
    openUploadModal,
    closeUploadModal,
    addDocument,
    selectTask,
    addTask,
    advanceTaskStep,
    completeTask,
    setAttachedFile,
    uploadFile,
    isUploading: state.isUploading,
    uploadError: state.uploadError,
    openCitation,
    closeCitation,
    fetchSourceAndOpen,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
