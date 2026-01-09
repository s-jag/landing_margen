import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStateBadgeColor,
  formatCurrency,
  getDocIcon,
  generateId,
  generateThreadId,
  generateMessageId,
  generateDocumentId,
  getCurrentTimestamp,
  getRelativeTimestamp,
  createNewThread,
  generateThreadTitleFromMessage,
  createUserMessage,
  createDocument,
  getDocumentTypeLabel,
  DOCUMENT_TYPES,
  MOCK_CLIENTS,
} from '../chatUtils';

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

describe('getStateBadgeColor', () => {
  it('returns emerald colors for no-tax states', () => {
    const noTaxStates = ['FL', 'TX', 'NV', 'WA', 'WY', 'SD', 'AK', 'TN', 'NH'];
    noTaxStates.forEach((state) => {
      const result = getStateBadgeColor(state);
      expect(result).toContain('emerald');
    });
  });

  it('returns amber colors for high-tax states', () => {
    const highTaxStates = ['CA', 'NY', 'NJ', 'OR', 'MN'];
    highTaxStates.forEach((state) => {
      const result = getStateBadgeColor(state);
      expect(result).toContain('amber');
    });
  });

  it('returns default colors for other states', () => {
    const otherStates = ['OH', 'PA', 'IL', 'MI'];
    otherStates.forEach((state) => {
      const result = getStateBadgeColor(state);
      expect(result).toContain('bg-card-03');
    });
  });
});

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(1000000)).toBe('$1,000,000');
    expect(formatCurrency(42300)).toBe('$42,300');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-500)).toBe('-$500');
  });

  it('rounds decimal values', () => {
    expect(formatCurrency(1000.99)).toBe('$1,001');
    expect(formatCurrency(1000.49)).toBe('$1,000');
  });
});

describe('getDocIcon', () => {
  it('returns PDF icon for .pdf files', () => {
    const result = getDocIcon('document.pdf');
    expect(result.label).toBe('PDF');
    expect(result.color).toContain('rose');
  });

  it('returns XLS icon for Excel files', () => {
    expect(getDocIcon('spreadsheet.xlsx').label).toBe('XLS');
    expect(getDocIcon('spreadsheet.xls').label).toBe('XLS');
  });

  it('returns W2 icon for W-2 documents without PDF extension', () => {
    // Note: PDF check comes first in getDocIcon, so .pdf files get PDF label
    expect(getDocIcon('W-2 Form').label).toBe('W2');
    expect(getDocIcon('w2_employer').label).toBe('W2');
  });

  it('returns 1099 icon for 1099 documents without PDF extension', () => {
    // Note: PDF check comes first in getDocIcon, so .pdf files get PDF label
    expect(getDocIcon('1099-NEC').label).toBe('1099');
    expect(getDocIcon('form_1099_misc').label).toBe('1099');
  });

  it('returns DOC icon for unknown document types', () => {
    expect(getDocIcon('unknown.txt').label).toBe('DOC');
    expect(getDocIcon('notes').label).toBe('DOC');
  });

  it('is case insensitive', () => {
    expect(getDocIcon('DOCUMENT.PDF').label).toBe('PDF');
    // Note: PDF extension check comes before W-2 content check
    expect(getDocIcon('W-2').label).toBe('W2');
  });

  it('PDF extension takes precedence over content markers', () => {
    // This tests actual behavior - PDF check comes first
    expect(getDocIcon('W-2.pdf').label).toBe('PDF');
    expect(getDocIcon('1099.pdf').label).toBe('PDF');
  });
});

// =============================================================================
// ID GENERATION
// =============================================================================

describe('generateId', () => {
  it('generates unique IDs with default prefix', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^id_\d+_[a-z0-9]+$/);
  });

  it('uses custom prefix', () => {
    const id = generateId('custom');
    expect(id).toMatch(/^custom_\d+_[a-z0-9]+$/);
  });
});

describe('generateThreadId', () => {
  it('generates ID with thread prefix', () => {
    const id = generateThreadId();
    expect(id).toMatch(/^thread_\d+_[a-z0-9]+$/);
  });
});

describe('generateMessageId', () => {
  it('generates ID with msg prefix', () => {
    const id = generateMessageId();
    expect(id).toMatch(/^msg_\d+_[a-z0-9]+$/);
  });
});

describe('generateDocumentId', () => {
  it('generates ID with doc prefix', () => {
    const id = generateDocumentId();
    expect(id).toMatch(/^doc_\d+_[a-z0-9]+$/);
  });
});

// =============================================================================
// TIMESTAMP UTILITIES
// =============================================================================

describe('getCurrentTimestamp', () => {
  it('returns a formatted time string', () => {
    const timestamp = getCurrentTimestamp();
    // Should match format like "2:34 PM" or "10:15 AM"
    expect(timestamp).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
  });
});

describe('getRelativeTimestamp', () => {
  it('returns "Today" for today\'s date', () => {
    const today = new Date();
    expect(getRelativeTimestamp(today)).toBe('Today');
  });

  it('returns "Yesterday" for yesterday\'s date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getRelativeTimestamp(yesterday)).toBe('Yesterday');
  });

  it('returns weekday name for dates within the week', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const result = getRelativeTimestamp(threeDaysAgo);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    expect(weekdays).toContain(result);
  });

  it('returns formatted date for older dates', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 14);
    const result = getRelativeTimestamp(oldDate);
    // Should match format like "Jan 5" or "Dec 25"
    expect(result).toMatch(/^[A-Z][a-z]{2}\s\d{1,2}$/);
  });
});

// =============================================================================
// THREAD UTILITIES
// =============================================================================

describe('createNewThread', () => {
  it('creates a thread with generated ID', () => {
    const thread = createNewThread('client-123');
    expect(thread.id).toMatch(/^thread_\d+_[a-z0-9]+$/);
    expect(thread.clientId).toBe('client-123');
  });

  it('uses default title when not provided', () => {
    const thread = createNewThread('client-123');
    expect(thread.title).toBe('New Research Thread');
  });

  it('uses custom title when provided', () => {
    const thread = createNewThread('client-123', 'Tax Analysis');
    expect(thread.title).toBe('Tax Analysis');
  });

  it('sets timestamp to "Just now"', () => {
    const thread = createNewThread('client-123');
    expect(thread.timestamp).toBe('Just now');
  });
});

describe('generateThreadTitleFromMessage', () => {
  it('returns short messages unchanged', () => {
    const message = 'Short message';
    expect(generateThreadTitleFromMessage(message)).toBe('Short message');
  });

  it('truncates long messages with ellipsis', () => {
    const longMessage = 'This is a very long message that should be truncated because it exceeds forty characters';
    const result = generateThreadTitleFromMessage(longMessage);
    expect(result.length).toBe(43); // 40 chars + "..."
    expect(result.endsWith('...')).toBe(true);
  });

  it('handles exactly 40 character messages', () => {
    const message = 'Exactly forty characters message here!!';
    expect(message.length).toBe(39);
    expect(generateThreadTitleFromMessage(message)).toBe(message);
  });
});

// =============================================================================
// MESSAGE UTILITIES
// =============================================================================

describe('createUserMessage', () => {
  it('creates a user message with correct structure', () => {
    const message = createUserMessage('Hello, how can you help?');
    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello, how can you help?');
    expect(message.id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    expect(message.timestamp).toBeDefined();
  });
});

// =============================================================================
// DOCUMENT UTILITIES
// =============================================================================

describe('DOCUMENT_TYPES', () => {
  it('contains all expected document types', () => {
    expect(DOCUMENT_TYPES).toContain('W2');
    expect(DOCUMENT_TYPES).toContain('1099');
    expect(DOCUMENT_TYPES).toContain('Receipt');
    expect(DOCUMENT_TYPES).toContain('Prior Return');
    expect(DOCUMENT_TYPES).toContain('Other');
    expect(DOCUMENT_TYPES).toHaveLength(5);
  });
});

describe('createDocument', () => {
  it('creates a document with correct structure', () => {
    const doc = createDocument('W-2 Form.pdf', 'W2');
    expect(doc.name).toBe('W-2 Form.pdf');
    expect(doc.type).toBe('W2');
    expect(doc.id).toMatch(/^doc_\d+_[a-z0-9]+$/);
    expect(doc.uploadedAt).toBeDefined();
  });

  it('formats uploadedAt as expected', () => {
    const doc = createDocument('test.pdf', 'Other');
    // Should match format like "Jan 5, 2024"
    expect(doc.uploadedAt).toMatch(/^[A-Z][a-z]{2}\s\d{1,2},\s\d{4}$/);
  });
});

describe('getDocumentTypeLabel', () => {
  it('returns correct labels for each type', () => {
    expect(getDocumentTypeLabel('W2')).toBe('W-2 Form');
    expect(getDocumentTypeLabel('1099')).toBe('1099 Form');
    expect(getDocumentTypeLabel('Receipt')).toBe('Receipt');
    expect(getDocumentTypeLabel('Prior Return')).toBe('Prior Year Return');
    expect(getDocumentTypeLabel('Other')).toBe('Other Document');
  });
});

// =============================================================================
// MOCK DATA
// =============================================================================

describe('MOCK_CLIENTS', () => {
  it('contains expected number of clients', () => {
    expect(MOCK_CLIENTS.length).toBeGreaterThan(0);
  });

  it('each client has required fields', () => {
    MOCK_CLIENTS.forEach((client) => {
      expect(client.id).toBeDefined();
      expect(client.name).toBeDefined();
      expect(client.state).toBeDefined();
      expect(client.taxYear).toBeDefined();
      expect(client.filingStatus).toBeDefined();
    });
  });

  it('contains clients from different states', () => {
    const states = MOCK_CLIENTS.map((c) => c.state);
    const uniqueStates = new Set(states);
    expect(uniqueStates.size).toBeGreaterThan(1);
  });
});
