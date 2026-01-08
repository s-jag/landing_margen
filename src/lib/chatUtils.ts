import type { Client, ChatThread, Message, Document, DocumentType } from '@/types/chat';

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

export function getStateBadgeColor(state: string): string {
  const noTaxStates = ['FL', 'TX', 'NV', 'WA', 'WY', 'SD', 'AK', 'TN', 'NH'];
  const highTaxStates = ['CA', 'NY', 'NJ', 'OR', 'MN'];

  if (noTaxStates.includes(state)) {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
  if (highTaxStates.includes(state)) {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
  return 'bg-card-03 text-text-secondary border-border-02';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDocIcon(name: string): { color: string; bg: string; label: string } {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.pdf')) {
    return { color: 'text-rose-300/80', bg: 'bg-rose-500/[0.08]', label: 'PDF' };
  }
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    return { color: 'text-emerald-300/80', bg: 'bg-emerald-500/[0.08]', label: 'XLS' };
  }
  if (lowerName.includes('w-2') || lowerName.includes('w2')) {
    return { color: 'text-sky-300/80', bg: 'bg-sky-500/[0.08]', label: 'W2' };
  }
  if (lowerName.includes('1099')) {
    return { color: 'text-violet-300/80', bg: 'bg-violet-500/[0.08]', label: '1099' };
  }
  return { color: 'text-text-tertiary', bg: 'bg-card-03', label: 'DOC' };
}

// =============================================================================
// ID GENERATION
// =============================================================================

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateThreadId(): string {
  return generateId('thread');
}

export function generateMessageId(): string {
  return generateId('msg');
}

export function generateDocumentId(): string {
  return generateId('doc');
}

// =============================================================================
// TIMESTAMP UTILITIES
// =============================================================================

export function getCurrentTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getRelativeTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// =============================================================================
// THREAD UTILITIES
// =============================================================================

export function createNewThread(clientId: string, title?: string): ChatThread {
  return {
    id: generateThreadId(),
    title: title || 'New Research Thread',
    timestamp: 'Just now',
    clientId,
  };
}

export function generateThreadTitleFromMessage(message: string): string {
  // Take first 40 characters of message as title
  const truncated = message.slice(0, 40);
  return truncated.length < message.length ? `${truncated}...` : truncated;
}

// =============================================================================
// MESSAGE UTILITIES
// =============================================================================

export function createUserMessage(content: string): Message {
  return {
    id: generateMessageId(),
    role: 'user',
    content,
    timestamp: getCurrentTimestamp(),
  };
}

// =============================================================================
// DOCUMENT UTILITIES
// =============================================================================

export const DOCUMENT_TYPES: DocumentType[] = [
  'W2',
  '1099',
  'Receipt',
  'Prior Return',
  'Other',
];

export function createDocument(name: string, type: DocumentType): Document {
  return {
    id: generateDocumentId(),
    name,
    type,
    uploadedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    'W2': 'W-2 Form',
    '1099': '1099 Form',
    'Receipt': 'Receipt',
    'Prior Return': 'Prior Year Return',
    'Other': 'Other Document',
  };
  return labels[type];
}

// =============================================================================
// MOCK DATA
// =============================================================================

export const MOCK_CLIENTS: Client[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'John Smith',
    state: 'FL',
    taxYear: 2024,
    filingStatus: 'MFJ',
    ssn: '•••-••-4521',
    grossIncome: 180700,
    schedCRevenue: 42300,
    dependents: 2,
    documents: [
      { id: 'd1', name: 'W-2 Employer Inc.', type: 'W2' },
      { id: 'd2', name: '1099-NEC Consulting', type: '1099' },
      { id: 'd3', name: 'Schedule C (Draft).pdf', type: 'Other' },
      { id: 'd4', name: 'Home Office Calc.xlsx', type: 'Other' },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Sarah Johnson',
    state: 'CA',
    taxYear: 2024,
    filingStatus: 'Single',
    ssn: '•••-••-7832',
    grossIncome: 95000,
    schedCRevenue: 0,
    dependents: 0,
    documents: [
      { id: 'd5', name: 'W-2 Tech Corp', type: 'W2' },
      { id: 'd6', name: '1099-INT Bank.pdf', type: '1099' },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Michael Chen',
    state: 'TX',
    taxYear: 2024,
    filingStatus: 'MFJ',
    ssn: '•••-••-9156',
    grossIncome: 245000,
    schedCRevenue: 120000,
    dependents: 3,
    documents: [
      { id: 'd7', name: 'W-2 Corp Executive', type: 'W2' },
      { id: 'd8', name: '1099-NEC Board Fees', type: '1099' },
      { id: 'd9', name: 'K-1 Partnership.pdf', type: 'Other' },
    ],
  },
];

export const INITIAL_THREADS: ChatThread[] = [
  { id: '00000000-0000-0000-1000-000000000001', title: 'Home office deduction analysis', timestamp: 'Active', clientId: '00000000-0000-0000-0000-000000000001' },
  { id: '00000000-0000-0000-1000-000000000002', title: 'QBI limitation for Schedule C', timestamp: 'Yesterday', clientId: '00000000-0000-0000-0000-000000000001' },
  { id: '00000000-0000-0000-1000-000000000003', title: 'Vehicle depreciation 179 vs MACRS', timestamp: 'Jan 3', clientId: '00000000-0000-0000-0000-000000000001' },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  '00000000-0000-0000-1000-000000000001': [
    {
      id: 'm1',
      role: 'user',
      content: 'Can John deduct his home office? He uses 300 sq ft of his 2,000 sq ft home for his consulting business.',
      timestamp: '2:34 PM',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: `Based on John's Schedule C income of $42,300, he qualifies for the home office deduction under IRC §280A. Since he uses the space regularly and exclusively for business, he meets the basic requirements.

The simplified method caps at 300 sq ft, so John gets the maximum benefit. I recommend the simplified method for ease of documentation and audit defense.`,
      timestamp: '2:34 PM',
      citation: {
        source: 'IRC Section 280A(c)(1)',
        excerpt: 'A portion of the dwelling unit which is exclusively used on a regular basis as the principal place of business for any trade or business of the taxpayer...',
      },
      comparison: {
        options: [
          {
            title: 'Simplified Method',
            formula: '300 sq ft × $5',
            result: '$1,500',
            recommended: true,
          },
          {
            title: 'Regular Method',
            formula: 'Actual expenses × 15%',
            result: 'Varies',
          },
        ],
      },
    },
  ],
  t2: [],
  t3: [],
};
