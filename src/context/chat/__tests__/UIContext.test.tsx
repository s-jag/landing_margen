import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { UIProvider, useUIContext } from '../UIContext';
import type { Document, Citation, DocumentType } from '@/types/chat';

// =============================================================================
// HELPER
// =============================================================================

function renderUIContext() {
  return renderHook(() => useUIContext(), {
    wrapper: ({ children }) => <UIProvider>{children}</UIProvider>,
  });
}

// =============================================================================
// HOOK ERROR TESTS
// =============================================================================

describe('useUIContext', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useUIContext());
    }).toThrow('useUIContext must be used within a UIProvider');

    spy.mockRestore();
  });
});

// =============================================================================
// INITIAL STATE TESTS
// =============================================================================

describe('UIProvider initial state', () => {
  it('has correct initial state values', () => {
    const { result } = renderUIContext();

    expect(result.current.clientDropdownOpen).toBe(false);
    expect(result.current.viewingDocument).toBeNull();
    expect(result.current.uploadModalOpen).toBe(false);
    expect(result.current.viewingCitation).toBeNull();
    expect(result.current.attachedFile).toBeNull();
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadError).toBeNull();
  });
});

// =============================================================================
// CLIENT DROPDOWN TESTS
// =============================================================================

describe('client dropdown actions', () => {
  it('opens client dropdown', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.setClientDropdownOpen(true);
    });

    expect(result.current.clientDropdownOpen).toBe(true);
  });

  it('closes client dropdown', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.setClientDropdownOpen(true);
    });

    act(() => {
      result.current.setClientDropdownOpen(false);
    });

    expect(result.current.clientDropdownOpen).toBe(false);
  });
});

// =============================================================================
// DOCUMENT VIEWER TESTS
// =============================================================================

describe('document viewer actions', () => {
  const mockDocument: Document = {
    id: 'doc-1',
    name: 'Test Document.pdf',
    type: 'W2',
  };

  it('opens document viewer with document', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.openDocumentViewer(mockDocument);
    });

    expect(result.current.viewingDocument).toEqual(mockDocument);
  });

  it('closes document viewer', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.openDocumentViewer(mockDocument);
    });

    act(() => {
      result.current.closeDocumentViewer();
    });

    expect(result.current.viewingDocument).toBeNull();
  });
});

// =============================================================================
// UPLOAD MODAL TESTS
// =============================================================================

describe('upload modal actions', () => {
  it('opens upload modal', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.openUploadModal();
    });

    expect(result.current.uploadModalOpen).toBe(true);
  });

  it('closes upload modal', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.openUploadModal();
    });

    act(() => {
      result.current.closeUploadModal();
    });

    expect(result.current.uploadModalOpen).toBe(false);
  });
});

// =============================================================================
// CITATION MODAL TESTS
// =============================================================================

describe('citation modal actions', () => {
  const mockCitation: Citation = {
    source: 'IRC Section 280A',
    excerpt: 'Home office deduction requirements...',
  };

  it('opens citation modal with citation', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.openCitation(mockCitation);
    });

    expect(result.current.viewingCitation).toEqual(mockCitation);
  });

  it('closes citation modal', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.openCitation(mockCitation);
    });

    act(() => {
      result.current.closeCitation();
    });

    expect(result.current.viewingCitation).toBeNull();
  });
});

// =============================================================================
// FILE ATTACHMENT TESTS
// =============================================================================

describe('file attachment actions', () => {
  it('sets attached file', () => {
    const { result } = renderUIContext();

    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const attachedFile = {
      name: 'test.pdf',
      size: 1000,
      file: mockFile,
      type: 'W2' as DocumentType,
    };

    act(() => {
      result.current.setAttachedFile(attachedFile);
    });

    expect(result.current.attachedFile).toEqual(attachedFile);
  });

  it('clears attached file', () => {
    const { result } = renderUIContext();

    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const attachedFile = {
      name: 'test.pdf',
      size: 1000,
      file: mockFile,
      type: 'W2' as DocumentType,
    };

    act(() => {
      result.current.setAttachedFile(attachedFile);
    });

    act(() => {
      result.current.setAttachedFile(null);
    });

    expect(result.current.attachedFile).toBeNull();
  });

  it('setting attached file clears upload error', () => {
    const { result } = renderUIContext();

    // First set an error
    act(() => {
      result.current.setUploadError('Some error');
    });

    expect(result.current.uploadError).toBe('Some error');

    // Then set a file - error should clear
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    act(() => {
      result.current.setAttachedFile({
        name: 'test.pdf',
        size: 1000,
        file: mockFile,
        type: 'W2',
      });
    });

    expect(result.current.uploadError).toBeNull();
  });
});

// =============================================================================
// UPLOAD STATE TESTS
// =============================================================================

describe('upload state actions', () => {
  it('sets uploading state', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.setIsUploading(true);
    });

    expect(result.current.isUploading).toBe(true);
  });

  it('clears uploading state', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.setIsUploading(true);
    });

    act(() => {
      result.current.setIsUploading(false);
    });

    expect(result.current.isUploading).toBe(false);
  });

  it('sets upload error and clears uploading state', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.setIsUploading(true);
    });

    act(() => {
      result.current.setUploadError('Upload failed');
    });

    expect(result.current.uploadError).toBe('Upload failed');
    expect(result.current.isUploading).toBe(false);
  });

  it('clears upload error', () => {
    const { result } = renderUIContext();

    act(() => {
      result.current.setUploadError('Upload failed');
    });

    act(() => {
      result.current.setUploadError(null);
    });

    expect(result.current.uploadError).toBeNull();
  });
});

// =============================================================================
// FETCH SOURCE TESTS
// =============================================================================

describe('fetchSourceAndOpen', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('sets loading state immediately', async () => {
    const { result } = renderUIContext();

    // Mock fetch to never resolve
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    // Start the fetch (don't await)
    act(() => {
      result.current.fetchSourceAndOpen('chunk-1', 'Test Citation');
    });

    // Should show loading state
    expect(result.current.viewingCitation?.isLoading).toBe(true);
    expect(result.current.viewingCitation?.source).toBe('Test Citation');
  });

  it('handles fetch errors gracefully', async () => {
    const { result } = renderUIContext();

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await result.current.fetchSourceAndOpen('chunk-1', 'Test Citation');
    });

    expect(result.current.viewingCitation?.isLoading).toBe(false);
    expect(result.current.viewingCitation?.excerpt).toContain('Failed to load');
  });

  it('updates citation with fetched data on success', async () => {
    const { result } = renderUIContext();

    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          citation: 'Fetched Citation',
          textWithAncestry: 'Full source text',
          text: 'Source text',
          link: 'https://example.com',
          docType: 'statute',
          chunkId: 'chunk-1',
        }),
    });

    await act(async () => {
      await result.current.fetchSourceAndOpen('chunk-1', 'Test Citation');
    });

    expect(result.current.viewingCitation?.isLoading).toBe(false);
    expect(result.current.viewingCitation?.source).toBe('Fetched Citation');
    expect(result.current.viewingCitation?.excerpt).toBe('Full source text');
    expect(result.current.viewingCitation?.link).toBe('https://example.com');
  });
});
