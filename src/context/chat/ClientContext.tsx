'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Client, Document, DocumentType } from '@/types/chat';
import { MOCK_CLIENTS, createDocument } from '@/lib/chatUtils';

// =============================================================================
// STATE
// =============================================================================

interface ClientState {
  clients: Client[];
  selectedClientId: string;
  isInitialLoading: boolean;
  initialLoadError: string | null;
}

const initialState: ClientState = {
  clients: MOCK_CLIENTS,
  selectedClientId: MOCK_CLIENTS[0].id,
  isInitialLoading: true,
  initialLoadError: null,
};

// =============================================================================
// ACTIONS
// =============================================================================

type ClientAction =
  | { type: 'SET_SELECTED_CLIENT'; payload: string }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOAD_ERROR'; payload: string | null }
  | { type: 'ADD_DOCUMENT'; payload: { clientId: string; document: Document } }
  | { type: 'INITIAL_DATA_LOADED'; payload: { clients: Client[] } };

// =============================================================================
// REDUCER
// =============================================================================

function clientReducer(state: ClientState, action: ClientAction): ClientState {
  switch (action.type) {
    case 'SET_SELECTED_CLIENT':
      return {
        ...state,
        selectedClientId: action.payload,
      };

    case 'SET_CLIENTS':
      return {
        ...state,
        clients: action.payload,
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

    case 'ADD_DOCUMENT': {
      const { clientId, document } = action.payload;
      return {
        ...state,
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, documents: [...client.documents, document] }
            : client
        ),
      };
    }

    case 'INITIAL_DATA_LOADED':
      return {
        ...state,
        clients: action.payload.clients.length > 0 ? action.payload.clients : state.clients,
        selectedClientId: action.payload.clients.length > 0
          ? action.payload.clients[0].id
          : state.selectedClientId,
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

interface ClientContextValue extends ClientState {
  // Derived state
  selectedClient: Client;

  // Actions
  selectClient: (clientId: string) => void;
  refreshClients: () => Promise<void>;
  addDocument: (name: string, type: DocumentType) => void;
  uploadFile: (file: File, type: DocumentType) => Promise<string | null>;
}

const ClientContext = createContext<ClientContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  const [state, dispatch] = useReducer(clientReducer, initialState);

  // Helper function to transform client data from API
  const transformClientData = useCallback((clientsData: { data?: Record<string, unknown>[] }): Client[] => {
    return (clientsData.data || []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      state: c.state as string,
      taxYear: c.tax_year as number,
      filingStatus: c.filing_status as string,
      ssn: `***-**-${c.ssn_last_four || '****'}`,
      grossIncome: c.gross_income as number || 0,
      schedCRevenue: c.sched_c_revenue as number || 0,
      dependents: c.dependents as number || 0,
      documents: [],
    }));
  }, []);

  // Load initial data from API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_INITIAL_LOADING', payload: true });

        // Try production endpoint first, fall back to test endpoint
        let response = await fetch('/api/clients');
        if (!response.ok) {
          response = await fetch('/api/test-clients');
        }

        const clientsData = response.ok ? await response.json() : { data: [] };
        const transformedClients = transformClientData(clientsData);

        dispatch({
          type: 'INITIAL_DATA_LOADED',
          payload: { clients: transformedClients },
        });
      } catch (error) {
        console.error('Failed to load clients:', error);
        dispatch({
          type: 'SET_INITIAL_LOAD_ERROR',
          payload: error instanceof Error ? error.message : 'Failed to load data',
        });
      }
    };

    loadInitialData();
  }, [transformClientData]);

  // Derived state
  const selectedClient =
    state.clients.find((c) => c.id === state.selectedClientId) || state.clients[0];

  // Actions
  const selectClient = useCallback((clientId: string) => {
    dispatch({ type: 'SET_SELECTED_CLIENT', payload: clientId });
  }, []);

  const refreshClients = useCallback(async () => {
    try {
      let response = await fetch('/api/clients');
      if (!response.ok) {
        response = await fetch('/api/test-clients');
      }
      if (response.ok) {
        const data = await response.json();
        const transformedClients = transformClientData(data);
        if (transformedClients.length > 0) {
          dispatch({ type: 'SET_CLIENTS', payload: transformedClients });
          dispatch({ type: 'SET_SELECTED_CLIENT', payload: transformedClients[0].id });
        }
      }
    } catch (error) {
      console.error('Failed to refresh clients:', error);
    }
  }, [transformClientData]);

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

  const uploadFile = useCallback(async (file: File, type: DocumentType): Promise<string | null> => {
    if (!selectedClient) {
      return null;
    }

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

      // Add document to client's documents list
      if (data.document) {
        dispatch({
          type: 'ADD_DOCUMENT',
          payload: { clientId: selectedClient.id, document: data.document },
        });
      }

      return data.document?.id || null;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  }, [selectedClient]);

  const value: ClientContextValue = {
    ...state,
    selectedClient,
    selectClient,
    refreshClients,
    addDocument,
    uploadFile,
  };

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useClientContext() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
}
