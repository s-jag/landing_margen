'use client';

import { useState } from 'react';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface Client {
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

interface Document {
  id: string;
  name: string;
  type: 'W2' | '1099' | 'Receipt' | 'Prior Return' | 'Other';
}

interface ChatThread {
  id: string;
  title: string;
  timestamp: string;
  active?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citation?: {
    source: string;
    excerpt: string;
  };
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
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
      { id: 'd3', name: 'Schedule C (Draft)', type: 'Other' },
      { id: 'd4', name: 'Home Office Calc.xlsx', type: 'Other' },
    ],
  },
  {
    id: '2',
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
      { id: 'd6', name: '1099-INT Bank', type: '1099' },
    ],
  },
  {
    id: '3',
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
      { id: 'd9', name: 'K-1 Partnership', type: 'Other' },
    ],
  },
];

const MOCK_CHAT_THREADS: ChatThread[] = [
  { id: 't1', title: 'Home office deduction analysis', timestamp: '2 min ago', active: true },
  { id: 't2', title: 'QBI limitation for Schedule C', timestamp: 'Yesterday' },
  { id: 't3', title: 'Vehicle depreciation 179 vs MACRS', timestamp: 'Jan 3' },
];

const MOCK_MESSAGES: Message[] = [
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

**Two calculation methods available:**

• **Simplified Method** (Rev. Proc. 2013-13): 300 sq ft × $5 = **$1,500**
• **Regular Method**: Actual expenses × 15% (300/2,000 sq ft)

The simplified method caps at 300 sq ft, so John gets the maximum benefit. I recommend the simplified method for ease of documentation and audit defense.`,
    timestamp: '2:34 PM',
    citation: {
      source: 'IRC Section 280A(c)(1)',
      excerpt: 'A portion of the dwelling unit which is exclusively used on a regular basis as the principal place of business for any trade or business of the taxpayer...',
    },
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getStateBadgeColor(state: string): string {
  // No state income tax states
  const noTaxStates = ['FL', 'TX', 'NV', 'WA', 'WY', 'SD', 'AK', 'TN', 'NH'];
  // High tax states
  const highTaxStates = ['CA', 'NY', 'NJ', 'OR', 'MN'];

  if (noTaxStates.includes(state)) {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
  if (highTaxStates.includes(state)) {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
  return 'bg-card-03 text-text-secondary border-border-02';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ChatPage() {
  const [selectedClientId, setSelectedClientId] = useState(MOCK_CLIENTS[0].id);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const selectedClient = MOCK_CLIENTS.find(c => c.id === selectedClientId) || MOCK_CLIENTS[0];

  return (
    <div className="h-screen bg-bg flex flex-col">
      {/* Minimal Header */}
      <header className="h-12 border-b border-border-01 flex items-center justify-between px-4 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 4h3l5 8 5-8h3v12h-3V8l-5 8-5-8v8H2V4z"
              fill="currentColor"
              className="text-text"
            />
          </svg>
          <span className="text-sm font-medium text-text">Margen</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-tertiary">Research Assistant</span>
        </div>
      </header>

      {/* Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Clients & Chats */}
        <aside className="w-60 border-r border-border-01 bg-card flex flex-col flex-shrink-0">
          {/* Client Selector */}
          <div className="p-3 border-b border-border-01">
            <div className="relative">
              <button
                onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                className="w-full text-left bg-card-02 rounded-md p-3 border border-border-01 hover:border-border-02 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-text">{selectedClient.name}</div>
                    <div className="text-xs text-text-tertiary mt-0.5">
                      {selectedClient.state} · {selectedClient.taxYear} · {selectedClient.filingStatus}
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-text-tertiary transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Dropdown */}
              {clientDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card-02 border border-border-02 rounded-md shadow-lg z-10 overflow-hidden">
                  {MOCK_CLIENTS.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setClientDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-card-03 transition-colors ${
                        client.id === selectedClientId ? 'bg-card-03' : ''
                      }`}
                    >
                      <div className="text-sm text-text">{client.name}</div>
                      <div className="text-xs text-text-tertiary">
                        {client.state} · {client.filingStatus}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-card-02 border border-border-01 rounded-md text-sm text-text-secondary hover:text-text hover:border-border-02 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Research Thread
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2">
              <div className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Recent Chats</div>
              {MOCK_CHAT_THREADS.map((thread) => (
                <div
                  key={thread.id}
                  className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    thread.active ? 'bg-card-03' : 'hover:bg-card-02'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        thread.active ? 'bg-accent' : 'bg-text-tertiary'
                      }`}
                    />
                    <span className={`text-sm truncate ${thread.active ? 'text-text' : 'text-text-secondary'}`}>
                      {thread.title}
                    </span>
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5 ml-3.5">{thread.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center - Chat Area */}
        <main className="flex-1 flex flex-col bg-bg overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {MOCK_MESSAGES.map((message) => (
                <div key={message.id} className="group">
                  {/* Message Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      {message.role === 'user' ? 'You' : 'Margen'}
                    </span>
                    <span className="text-xs text-text-tertiary">{message.timestamp}</span>
                  </div>

                  {/* Message Content */}
                  <div className={`text-sm leading-relaxed ${message.role === 'user' ? 'text-text-secondary' : 'text-text'}`}>
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('•') ? 'ml-4' : line.startsWith('**') ? 'font-medium mt-3' : 'mt-2'}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Citation Card */}
                  {message.citation && (
                    <div className="mt-4 bg-card border border-border-01 rounded-md overflow-hidden">
                      <div className="border-l-2 border-accent p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-text-tertiary">Source</span>
                        </div>
                        <div className="text-sm font-medium text-text">{message.citation.source}</div>
                        <div className="text-xs text-text-secondary mt-1 italic">
                          "{message.citation.excerpt}"
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border-01 p-4 bg-card">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card-02 border border-border-01 rounded-lg p-3 focus-within:border-border-02 transition-colors">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Ask about ${selectedClient.name}'s tax situation...`}
                  className="w-full bg-transparent text-sm text-text placeholder:text-text-tertiary resize-none outline-none"
                  rows={2}
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-01">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Attach
                    </button>
                    <div className="flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary bg-card-03 rounded">
                      <span>Claude Sonnet 4</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 bg-accent text-bg text-sm font-medium rounded-full hover:bg-accent/80 transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - Context */}
        <aside className="w-72 border-l border-border-01 bg-card flex flex-col flex-shrink-0 overflow-y-auto">
          {/* Client Info Card */}
          <div className="p-4 border-b border-border-01">
            <div className="text-lg font-medium text-text">{selectedClient.name}</div>
            <div className="text-xs text-text-tertiary mt-0.5">SSN: {selectedClient.ssn}</div>

            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2 py-1 text-xs font-medium rounded border ${getStateBadgeColor(selectedClient.state)}`}>
                {selectedClient.state}
              </span>
              <span className="px-2 py-1 text-xs text-text-secondary bg-card-03 rounded">
                {selectedClient.filingStatus} · {selectedClient.taxYear}
              </span>
            </div>
          </div>

          {/* Quick Facts */}
          <div className="p-4 border-b border-border-01">
            <div className="text-xs text-text-tertiary uppercase tracking-wider mb-3">Quick Facts</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Gross Income</span>
                <span className="text-text font-medium">{formatCurrency(selectedClient.grossIncome)}</span>
              </div>
              {selectedClient.schedCRevenue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Sched C Revenue</span>
                  <span className="text-text font-medium">{formatCurrency(selectedClient.schedCRevenue)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Dependents</span>
                <span className="text-text font-medium">{selectedClient.dependents}</span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-text-tertiary uppercase tracking-wider">
                Documents ({selectedClient.documents.length})
              </div>
              <button className="text-xs text-accent hover:text-accent/80 transition-colors">+ Add</button>
            </div>
            <div className="space-y-1">
              {selectedClient.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-card-02 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-text-secondary truncate">{doc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
