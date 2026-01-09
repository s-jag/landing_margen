import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ClientProvider, useClientContext } from '../ClientContext';
import { MOCK_CLIENTS } from '@/lib/chatUtils';

// =============================================================================
// SETUP
// =============================================================================

// Mock fetch for all tests
const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockReset();
  // Default: return empty array (use mock clients)
  mockFetch.mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ data: [] }),
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

// =============================================================================
// HELPER
// =============================================================================

function renderClientContext() {
  return renderHook(() => useClientContext(), {
    wrapper: ({ children }) => <ClientProvider>{children}</ClientProvider>,
  });
}

// =============================================================================
// HOOK ERROR TESTS
// =============================================================================

describe('useClientContext', () => {
  it('throws error when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useClientContext());
    }).toThrow('useClientContext must be used within a ClientProvider');

    spy.mockRestore();
  });
});

// =============================================================================
// INITIAL STATE TESTS
// =============================================================================

describe('ClientProvider initial state', () => {
  it('initializes with mock clients', async () => {
    const { result } = renderClientContext();

    // Initial state should have mock clients
    expect(result.current.clients.length).toBeGreaterThan(0);
    expect(result.current.selectedClientId).toBe(MOCK_CLIENTS[0].id);
    expect(result.current.isInitialLoading).toBe(true);
  });

  it('provides selectedClient derived state', async () => {
    const { result } = renderClientContext();

    expect(result.current.selectedClient).toBeDefined();
    expect(result.current.selectedClient.id).toBe(MOCK_CLIENTS[0].id);
  });
});

// =============================================================================
// SELECT CLIENT TESTS
// =============================================================================

describe('selectClient', () => {
  it('changes selected client', async () => {
    const { result } = renderClientContext();

    const secondClient = MOCK_CLIENTS[1];

    act(() => {
      result.current.selectClient(secondClient.id);
    });

    expect(result.current.selectedClientId).toBe(secondClient.id);
    expect(result.current.selectedClient.id).toBe(secondClient.id);
  });

  it('updates selectedClient when selection changes', async () => {
    const { result } = renderClientContext();

    act(() => {
      result.current.selectClient(MOCK_CLIENTS[2].id);
    });

    expect(result.current.selectedClient.name).toBe(MOCK_CLIENTS[2].name);
  });
});

// =============================================================================
// ADD DOCUMENT TESTS
// =============================================================================

describe('addDocument', () => {
  it('adds document to current client', async () => {
    const { result } = renderClientContext();

    const initialDocCount = result.current.selectedClient.documents.length;

    act(() => {
      result.current.addDocument('New Document.pdf', 'W2');
    });

    expect(result.current.selectedClient.documents.length).toBe(initialDocCount + 1);
  });

  it('adds document with correct properties', async () => {
    const { result } = renderClientContext();

    act(() => {
      result.current.addDocument('Test.pdf', '1099');
    });

    const newDoc = result.current.selectedClient.documents.find((d) => d.name === 'Test.pdf');
    expect(newDoc).toBeDefined();
    expect(newDoc?.type).toBe('1099');
    expect(newDoc?.id).toMatch(/^doc_\d+_[a-z0-9]+$/);
  });

  it('adds document to specific client when selected', async () => {
    const { result } = renderClientContext();

    // Select second client
    act(() => {
      result.current.selectClient(MOCK_CLIENTS[1].id);
    });

    const initialDocCount = result.current.selectedClient.documents.length;

    act(() => {
      result.current.addDocument('Client2Doc.pdf', 'Receipt');
    });

    // Document should be added to second client
    const secondClient = result.current.clients.find((c) => c.id === MOCK_CLIENTS[1].id);
    expect(secondClient?.documents.length).toBe(initialDocCount + 1);
  });
});

// =============================================================================
// API LOADING TESTS
// =============================================================================

describe('API data loading', () => {
  it('loads clients from API on mount', async () => {
    const apiClients = [
      {
        id: 'api-client-1',
        name: 'API Client',
        state: 'NY',
        tax_year: 2024,
        filing_status: 'Single',
        ssn_last_four: '1234',
        gross_income: 100000,
        sched_c_revenue: 0,
        dependents: 0,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: apiClients }),
    });

    const { result } = renderClientContext();

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(result.current.clients[0].id).toBe('api-client-1');
    expect(result.current.selectedClientId).toBe('api-client-1');
  });

  it('falls back to mock clients when API fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
    });

    const { result } = renderClientContext();

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    // Should still have mock clients
    expect(result.current.clients.length).toBeGreaterThan(0);
  });

  it('sets error state on API failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderClientContext();

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(result.current.initialLoadError).toBe('Network error');

    spy.mockRestore();
  });

  it('tries fallback endpoint when primary fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false }) // /api/clients fails
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      }); // /api/test-clients succeeds

    renderClientContext();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/clients');
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/test-clients');
  });
});

// =============================================================================
// REFRESH CLIENTS TESTS
// =============================================================================

describe('refreshClients', () => {
  it('fetches fresh client data', async () => {
    const { result } = renderClientContext();

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    // Set up mock for refresh
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              id: 'refreshed-1',
              name: 'Refreshed Client',
              state: 'TX',
              tax_year: 2024,
              filing_status: 'MFJ',
            },
          ],
        }),
    });

    await act(async () => {
      await result.current.refreshClients();
    });

    expect(result.current.clients[0].id).toBe('refreshed-1');
  });
});

// =============================================================================
// UPLOAD FILE TESTS
// =============================================================================

describe('uploadFile', () => {
  it('uploads file via API', async () => {
    const { result } = renderClientContext();

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          document: {
            id: 'uploaded-doc-1',
            name: 'Uploaded.pdf',
            type: 'W2',
          },
        }),
    });

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    let documentId: string | null = null;
    await act(async () => {
      documentId = await result.current.uploadFile(file, 'W2');
    });

    expect(documentId).toBe('uploaded-doc-1');
    expect(mockFetch).toHaveBeenCalledWith('/api/documents/upload', expect.any(Object));
  });

  it('returns null on upload failure', async () => {
    const { result } = renderClientContext();

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Upload failed' }),
    });

    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    let documentId: string | null = 'initial';
    await act(async () => {
      documentId = await result.current.uploadFile(file, 'W2');
    });

    expect(documentId).toBeNull();

    spy.mockRestore();
  });

  it('adds document to client list after successful upload', async () => {
    const { result } = renderClientContext();

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    const uploadedDocument = {
      id: 'uploaded-doc-1',
      name: 'Uploaded.pdf',
      type: 'W2',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ document: uploadedDocument }),
    });

    const initialDocCount = result.current.selectedClient.documents.length;
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadFile(file, 'W2');
    });

    expect(result.current.selectedClient.documents.length).toBe(initialDocCount + 1);
    expect(result.current.selectedClient.documents.find((d) => d.id === 'uploaded-doc-1')).toBeDefined();
  });
});
