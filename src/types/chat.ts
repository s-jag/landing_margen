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

  // UI state
  inputValue: string;
  isLoading: boolean;
  isTyping: boolean;

  // Dropdown states
  clientDropdownOpen: boolean;

  // Document modal states
  viewingDocument: Document | null;
  uploadModalOpen: boolean;
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
  | { type: 'ADD_DOCUMENT'; payload: { clientId: string; document: Document } };
