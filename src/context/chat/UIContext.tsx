'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { Document, DocumentType, Citation } from '@/types/chat';

// =============================================================================
// STATE
// =============================================================================

interface UIState {
  clientDropdownOpen: boolean;
  viewingDocument: Document | null;
  uploadModalOpen: boolean;
  viewingCitation: Citation | null;
  attachedFile: { name: string; size: number; file: File; type: DocumentType } | null;
  isUploading: boolean;
  uploadError: string | null;
}

const initialState: UIState = {
  clientDropdownOpen: false,
  viewingDocument: null,
  uploadModalOpen: false,
  viewingCitation: null,
  attachedFile: null,
  isUploading: false,
  uploadError: null,
};

// =============================================================================
// ACTIONS
// =============================================================================

type UIAction =
  | { type: 'SET_CLIENT_DROPDOWN_OPEN'; payload: boolean }
  | { type: 'SET_VIEWING_DOCUMENT'; payload: Document | null }
  | { type: 'SET_UPLOAD_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_VIEWING_CITATION'; payload: Citation | null }
  | { type: 'SET_ATTACHED_FILE'; payload: { name: string; size: number; file: File; type: DocumentType } | null }
  | { type: 'SET_IS_UPLOADING'; payload: boolean }
  | { type: 'SET_UPLOAD_ERROR'; payload: string | null };

// =============================================================================
// REDUCER
// =============================================================================

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_CLIENT_DROPDOWN_OPEN':
      return { ...state, clientDropdownOpen: action.payload };

    case 'SET_VIEWING_DOCUMENT':
      return { ...state, viewingDocument: action.payload };

    case 'SET_UPLOAD_MODAL_OPEN':
      return { ...state, uploadModalOpen: action.payload };

    case 'SET_VIEWING_CITATION':
      return { ...state, viewingCitation: action.payload };

    case 'SET_ATTACHED_FILE':
      return { ...state, attachedFile: action.payload, uploadError: null };

    case 'SET_IS_UPLOADING':
      return { ...state, isUploading: action.payload };

    case 'SET_UPLOAD_ERROR':
      return { ...state, uploadError: action.payload, isUploading: false };

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface UIContextValue extends UIState {
  // Client dropdown
  setClientDropdownOpen: (open: boolean) => void;

  // Document viewer
  openDocumentViewer: (document: Document) => void;
  closeDocumentViewer: () => void;

  // Upload modal
  openUploadModal: () => void;
  closeUploadModal: () => void;

  // Citation modal
  openCitation: (citation: Citation) => void;
  closeCitation: () => void;
  fetchSourceAndOpen: (chunkId: string, citation: string) => Promise<void>;

  // File attachment
  setAttachedFile: (file: { name: string; size: number; file: File; type: DocumentType } | null) => void;
  setIsUploading: (uploading: boolean) => void;
  setUploadError: (error: string | null) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Client dropdown
  const setClientDropdownOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_CLIENT_DROPDOWN_OPEN', payload: open });
  }, []);

  // Document viewer
  const openDocumentViewer = useCallback((document: Document) => {
    dispatch({ type: 'SET_VIEWING_DOCUMENT', payload: document });
  }, []);

  const closeDocumentViewer = useCallback(() => {
    dispatch({ type: 'SET_VIEWING_DOCUMENT', payload: null });
  }, []);

  // Upload modal
  const openUploadModal = useCallback(() => {
    dispatch({ type: 'SET_UPLOAD_MODAL_OPEN', payload: true });
  }, []);

  const closeUploadModal = useCallback(() => {
    dispatch({ type: 'SET_UPLOAD_MODAL_OPEN', payload: false });
  }, []);

  // Citation modal
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
      // Try production endpoint first
      let response = await fetch(`/api/sources/${encodeURIComponent(chunkId)}`);
      if (!response.ok && response.status !== 404) {
        response = await fetch(`/api/test-sources/${encodeURIComponent(chunkId)}`);
      }

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

  // File attachment
  const setAttachedFile = useCallback((file: { name: string; size: number; file: File; type: DocumentType } | null) => {
    dispatch({ type: 'SET_ATTACHED_FILE', payload: file });
  }, []);

  const setIsUploading = useCallback((uploading: boolean) => {
    dispatch({ type: 'SET_IS_UPLOADING', payload: uploading });
  }, []);

  const setUploadError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_UPLOAD_ERROR', payload: error });
  }, []);

  const value: UIContextValue = {
    ...state,
    setClientDropdownOpen,
    openDocumentViewer,
    closeDocumentViewer,
    openUploadModal,
    closeUploadModal,
    openCitation,
    closeCitation,
    fetchSourceAndOpen,
    setAttachedFile,
    setIsUploading,
    setUploadError,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useUIContext() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}
