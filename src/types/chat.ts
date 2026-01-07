// =============================================================================
// CHAT TYPES
// =============================================================================

export interface Client {
  id: string;
  name: string;
  state: string;
  taxYear: number;
  filingStatus: string;
  ssn: string;
  grossIncome: number;
  schedCRevenue: number;
  dependents: number;
  documents: Document[];
}

export interface Document {
  id: string;
  name: string;
  type: 'W2' | '1099' | 'Receipt' | 'Prior Return' | 'Other';
  uploadedAt?: string;
}

export type DocumentType = Document['type'];

export interface ChatThread {
  id: string;
  title: string;
  timestamp: string;
  clientId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citation?: Citation;
  comparison?: Comparison;
}

export interface Citation {
  source: string;
  excerpt: string;
  fullText?: string;
}

// =============================================================================
// TASK TYPES (for async workflow)
// =============================================================================

export type TaskStatus = 'in_progress' | 'ready' | 'complete';

export interface TaskStep {
  label: string;
  status: 'pending' | 'running' | 'done';
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  currentStepIndex: number;
  steps: TaskStep[];
  startedAt: string;
  threadId?: string;
  attachedFile?: string;
}

export interface ComparisonOption {
  title: string;
  formula: string;
  result: string;
  recommended?: boolean;
}

export interface Comparison {
  options: ComparisonOption[];
}

// =============================================================================
// API TYPES (for service layer)
// =============================================================================

export interface ChatRequest {
  message: string;
  clientId: string;
  threadId: string;
  model: string;
  context?: {
    clientData: Client;
    previousMessages: Message[];
  };
}

export interface ChatResponse {
  id: string;
  content: string;
  timestamp: string;
  citation?: Citation;
  comparison?: Comparison;
}

// =============================================================================
// STREAMING TYPES
// =============================================================================

export interface ReasoningStep {
  step: number;
  node: string;
  description: string;
}

export interface SourceChip {
  chunkId: string;
  citation: string;
  relevanceScore: number;
}

export interface StreamMetadata {
  requestId: string;
  confidence: number;
  processingTimeMs: number;
  citationCount: number;
  sourceCount: number;
}

export type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'reasoning'; step: number; node: string; description: string }
  | { type: 'chunk'; chunks: SourceChip[] }
  | { type: 'answer'; content: string }
  | { type: 'complete'; metadata: StreamMetadata }
  | { type: 'error'; error: string; message: string };

// =============================================================================
// STATE TYPES
// =============================================================================

export interface ChatState {
  // Client state
  clients: Client[];
  selectedClientId: string;

  // Thread state
  threads: ChatThread[];
  activeThreadId: string | null;

  // Messages state (keyed by threadId)
  messagesByThread: Record<string, Message[]>;

  // Task state (for async workflows)
  tasks: Task[];
  selectedTaskId: string | null;

  // UI state
  inputValue: string;
  isLoading: boolean;
  isTyping: boolean;
  isInitialLoading: boolean;
  initialLoadError: string | null;
  attachedFile: { name: string; size: number; file: File; type: DocumentType } | null;
  isUploading: boolean;
  uploadError: string | null;

  // Streaming state
  streamingContent: string;
  reasoningSteps: ReasoningStep[];
  pendingSources: SourceChip[];
  streamStatus: string;
  streamError: string | null;

  // Dropdown states
  clientDropdownOpen: boolean;

  // Document modal states
  viewingDocument: Document | null;
  uploadModalOpen: boolean;

  // Citation modal
  viewingCitation: Citation | null;
}

export type ChatAction =
  | { type: 'SET_SELECTED_CLIENT'; payload: string }
  | { type: 'SET_CLIENT_DROPDOWN_OPEN'; payload: boolean }
  | { type: 'SET_ACTIVE_THREAD'; payload: string | null }
  | { type: 'CREATE_THREAD'; payload: ChatThread }
  | { type: 'ADD_MESSAGE'; payload: { threadId: string; message: Message } }
  | { type: 'SET_INPUT_VALUE'; payload: string }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'SET_IS_TYPING'; payload: boolean }
  | { type: 'LOAD_PERSISTED_STATE'; payload: Partial<ChatState> }
  | { type: 'UPDATE_THREAD_TIMESTAMP'; payload: { threadId: string; timestamp: string } }
  | { type: 'SET_VIEWING_DOCUMENT'; payload: Document | null }
  | { type: 'SET_UPLOAD_MODAL_OPEN'; payload: boolean }
  | { type: 'ADD_DOCUMENT'; payload: { clientId: string; document: Document } }
  // Task actions
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<Task> } }
  | { type: 'SET_SELECTED_TASK'; payload: string | null }
  | { type: 'ADVANCE_TASK_STEP'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: string }
  // File attachment and upload
  | { type: 'SET_ATTACHED_FILE'; payload: { name: string; size: number; file: File; type: DocumentType } | null }
  | { type: 'SET_IS_UPLOADING'; payload: boolean }
  | { type: 'SET_UPLOAD_ERROR'; payload: string | null }
  // Citation modal
  | { type: 'SET_VIEWING_CITATION'; payload: Citation | null }
  // Streaming actions
  | { type: 'START_STREAMING' }
  | { type: 'STREAM_STATUS'; payload: string }
  | { type: 'STREAM_CONTENT'; payload: string }
  | { type: 'ADD_REASONING_STEP'; payload: ReasoningStep }
  | { type: 'ADD_PENDING_SOURCES'; payload: SourceChip[] }
  | { type: 'FINALIZE_MESSAGE'; payload: { threadId: string; message: Message } }
  | { type: 'STREAM_ERROR'; payload: string }
  | { type: 'CLEAR_STREAMING' }
  // Data loading
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_THREADS'; payload: ChatThread[] }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOAD_ERROR'; payload: string | null }
  | { type: 'INITIAL_DATA_LOADED'; payload: { clients: Client[]; threads: ChatThread[] } };
