'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { ChatState, ChatAction, Client, ChatThread, Message, Document, DocumentType, Task, Citation } from '@/types/chat';
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
  attachedFile: null,
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
      };

    // Citation modal
    case 'SET_VIEWING_CITATION':
      return {
        ...state,
        viewingCitation: action.payload,
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

  // File attachment
  setAttachedFile: (file: { name: string; size: number } | null) => void;

  // Citation modal
  openCitation: (citation: Citation) => void;
  closeCitation: () => void;
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

      // Clear input
      dispatch({ type: 'SET_INPUT_VALUE', payload: '' });

      // Show typing indicator
      dispatch({ type: 'SET_IS_TYPING', payload: true });

      try {
        // Call chat service
        const response = await chatService.sendMessage({
          message: content,
          clientId: state.selectedClientId,
          threadId,
          model: 'claude-4',
          context: {
            clientData: selectedClient,
            previousMessages: [...existingMessages, userMessage],
          },
        });

        // Create assistant message
        const assistantMessage: Message = {
          id: response.id,
          role: 'assistant',
          content: response.content,
          timestamp: response.timestamp,
          citation: response.citation,
          comparison: response.comparison,
        };

        // Add assistant message
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { threadId, message: assistantMessage },
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        // Could add error handling UI here
      } finally {
        dispatch({ type: 'SET_IS_TYPING', payload: false });
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

  const setAttachedFile = useCallback((file: { name: string; size: number } | null) => {
    dispatch({ type: 'SET_ATTACHED_FILE', payload: file });
  }, []);

  // =============================================================================
  // CITATION MODAL ACTIONS
  // =============================================================================

  const openCitation = useCallback((citation: Citation) => {
    dispatch({ type: 'SET_VIEWING_CITATION', payload: citation });
  }, []);

  const closeCitation = useCallback(() => {
    dispatch({ type: 'SET_VIEWING_CITATION', payload: null });
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
    openCitation,
    closeCitation,
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
