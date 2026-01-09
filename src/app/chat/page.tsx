'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChatProvider, useChat } from '@/context/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentExtraction } from '@/hooks/useDocumentExtraction';
import { getStateBadgeColor, formatCurrency, getDocIcon } from '@/lib/chatUtils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageErrorFallback, PanelErrorFallback } from '@/components/error-fallbacks';
import {
  CitationModal,
  ClientSelector,
  ThreadList,
  MessageList,
  ChatInput,
  DocumentViewer,
  DocumentUpload,
  TaskDetail,
} from './components';

// =============================================================================
// RIGHT SIDEBAR - Client Context Panel
// =============================================================================

function RightSidebar() {
  const { selectedClient, openDocumentViewer, openUploadModal, refreshClients } = useChat();
  const { extractDocument, aggregateExtractions, isExtracting, getError, aggregating } = useDocumentExtraction();

  // Check if a document is a PDF (can be extracted)
  const isPDF = (doc: { name: string; mimeType?: string }) => {
    return doc.mimeType === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf');
  };

  // Handle extraction for a single document
  const handleExtract = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation(); // Don't open the document viewer
    const result = await extractDocument(docId);
    if (result) {
      // Refresh client data to update Quick Facts
      await refreshClients();
    }
  };

  // Handle aggregation of all extractions
  const handleAggregate = async () => {
    const result = await aggregateExtractions(selectedClient.id);
    if (result?.success) {
      await refreshClients();
    }
  };

  // Count documents with completed extractions
  const completedExtractions = selectedClient.documents.filter(
    d => d.extractionStatus === 'completed'
  ).length;

  return (
    <aside className="w-72 border-l border-border-01 bg-card flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Client Info Card */}
      <div className="p-4 border-b border-border-01">
        <div className="text-xs text-text-secondary mb-3">SSN: {selectedClient.ssn}</div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded border ${getStateBadgeColor(
              selectedClient.state
            )}`}
          >
            {selectedClient.state}
          </span>
          <span className="px-2.5 py-1 text-xs text-text-secondary bg-card-03 rounded border border-border-01">
            {selectedClient.filingStatus} · {selectedClient.taxYear}
          </span>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="p-4 border-b border-border-01">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-text-secondary uppercase tracking-wider">
            Quick Facts
          </div>
          {completedExtractions > 0 && (
            <button
              type="button"
              onClick={handleAggregate}
              disabled={aggregating}
              className="text-xs text-accent hover:text-accent/80 disabled:opacity-50"
              title="Update Quick Facts from extracted documents"
            >
              {aggregating ? 'Updating...' : 'Refresh'}
            </button>
          )}
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Gross Income</span>
            <span className="text-text font-medium tabular-nums">
              {formatCurrency(selectedClient.grossIncome)}
            </span>
          </div>
          {selectedClient.schedCRevenue > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Sched C Revenue</span>
              <span className="text-text font-medium tabular-nums">
                {formatCurrency(selectedClient.schedCRevenue)}
              </span>
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
          <div className="text-xs text-text-secondary uppercase tracking-wider">
            Documents ({selectedClient.documents.length})
          </div>
          <button
            type="button"
            onClick={openUploadModal}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 border border-accent/30 rounded-md transition-colors min-h-[32px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add
          </button>
        </div>
        <div className="space-y-1">
          {selectedClient.documents.map((doc) => {
            const iconInfo = getDocIcon(doc.name);
            const extracting = isExtracting(doc.id);
            const error = getError(doc.id);
            const canExtract = isPDF(doc) && doc.extractionStatus !== 'completed';
            const isCompleted = doc.extractionStatus === 'completed';
            const isFailed = doc.extractionStatus === 'failed';

            return (
              <div key={doc.id} className="group">
                <button
                  type="button"
                  onClick={() => openDocumentViewer(doc)}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-card-02 cursor-pointer transition-colors text-left"
                >
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${iconInfo.color} ${iconInfo.bg}`}
                  >
                    {iconInfo.label}
                  </span>
                  <span className="text-sm text-text-secondary group-hover:text-text truncate transition-colors flex-1">
                    {doc.name}
                  </span>
                  {/* Extraction status indicators */}
                  {isCompleted && (
                    <span className="text-ansi-green text-xs" title="Data extracted">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  {isFailed && (
                    <span className="text-ansi-red text-xs" title={doc.extractionError || 'Extraction failed'}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  )}
                  {extracting && (
                    <span className="text-accent text-xs animate-pulse">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  {canExtract && !extracting && (
                    <button
                      type="button"
                      onClick={(e) => handleExtract(e, doc.id)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-accent hover:text-accent/80 transition-opacity px-1.5 py-0.5 rounded hover:bg-accent/10"
                      title="Extract data from this document"
                    >
                      Extract
                    </button>
                  )}
                </button>
                {error && (
                  <p className="text-xs text-ansi-red px-2 pb-1">{error}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// =============================================================================
// MAIN CHAT CONTENT
// =============================================================================

function ChatContent() {
  const { selectedTask } = useChat();
  const { user, signOut } = useAuth();

  return (
    <>
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
            <span className="text-xs text-text-secondary">Research Assistant</span>
            <span className="text-text-tertiary">·</span>
            <Link
              href="/waitlist"
              className="group flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-accent hover:text-white bg-accent/10 hover:bg-accent border border-accent/30 hover:border-accent rounded-full transition-all"
            >
              Try the full platform
              <svg
                className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            {user?.email && (
              <>
                <span className="text-xs text-text-tertiary truncate max-w-[150px]">{user.email}</span>
                <button
                  onClick={signOut}
                  className="text-xs text-text-secondary hover:text-accent transition-colors"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </header>

        {/* Three-Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Clients & Chats */}
          <aside className="w-60 border-r border-border-01 bg-card flex flex-col flex-shrink-0">
            <ErrorBoundary
              name="left-sidebar"
              fallback={(props) => (
                <div className="p-4">
                  <PanelErrorFallback {...props} />
                </div>
              )}
            >
              <ClientSelector />
              <ThreadList />
            </ErrorBoundary>
          </aside>

          {/* Center - Chat Area or Task Detail */}
          <ErrorBoundary
            name="center-panel"
            fallback={(props) => (
              <main className="flex-1 flex flex-col bg-bg overflow-hidden items-center justify-center">
                <PanelErrorFallback {...props} />
              </main>
            )}
          >
            {selectedTask ? (
              <TaskDetail />
            ) : (
              <main className="flex-1 flex flex-col bg-bg overflow-hidden">
                <MessageList />
                <ChatInput />
              </main>
            )}
          </ErrorBoundary>

          {/* Right Panel - Context */}
          <ErrorBoundary
            name="right-sidebar"
            fallback={(props) => (
              <aside className="w-72 border-l border-border-01 bg-card flex flex-col flex-shrink-0 p-4">
                <PanelErrorFallback {...props} />
              </aside>
            )}
          >
            <RightSidebar />
          </ErrorBoundary>
        </div>
      </div>

      {/* Modals - Each with its own boundary */}
      <ErrorBoundary name="document-viewer-modal">
        <DocumentViewer />
      </ErrorBoundary>
      <ErrorBoundary name="document-upload-modal">
        <DocumentUpload />
      </ErrorBoundary>
      <ErrorBoundary name="citation-modal">
        <CitationModal />
      </ErrorBoundary>
    </>
  );
}

// =============================================================================
// AUTH LOADING SCREEN
// =============================================================================

function AuthLoading() {
  return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="w-8 h-8 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm text-text-secondary">Loading...</span>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Client-side redirect if not authenticated (backup to middleware)
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/chat');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <AuthLoading />;
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return <AuthLoading />;
  }

  return (
    <ErrorBoundary
      name="chat-page"
      fallback={(props) => (
        <div className="h-screen bg-bg">
          <PageErrorFallback {...props} />
        </div>
      )}
    >
      <ChatProvider>
        <ChatContent />
      </ChatProvider>
    </ErrorBoundary>
  );
}
