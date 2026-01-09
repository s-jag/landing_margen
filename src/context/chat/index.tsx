'use client';

import type { ReactNode } from 'react';

// Re-export all context providers and hooks
export { ClientProvider, useClientContext } from './ClientContext';
export { ThreadProvider, useThreadContext } from './ThreadContext';
export { StreamingProvider, useStreamingContext } from './StreamingContext';
export { TaskProvider, useTaskContext } from './TaskContext';
export { UIProvider, useUIContext } from './UIContext';

// Import for composite hook
import { useClientContext } from './ClientContext';
import { useThreadContext } from './ThreadContext';
import { useStreamingContext } from './StreamingContext';
import { useTaskContext } from './TaskContext';
import { useUIContext } from './UIContext';

// Import providers for composite provider
import { ClientProvider } from './ClientContext';
import { ThreadProvider } from './ThreadContext';
import { StreamingProvider } from './StreamingContext';
import { TaskProvider } from './TaskContext';
import { UIProvider } from './UIContext';

// =============================================================================
// COMPOSITE HOOK - For backward compatibility
// =============================================================================

/**
 * Composite hook that provides access to all chat-related contexts.
 * Use this for backward compatibility or when a component needs access to multiple contexts.
 *
 * For new components, prefer using the specific context hooks:
 * - useClientContext() for client selection and data
 * - useThreadContext() for threads and messages
 * - useStreamingContext() for real-time streaming state
 * - useTaskContext() for async task management
 * - useUIContext() for modals and UI state
 */
export function useChat() {
  const client = useClientContext();
  const thread = useThreadContext();
  const streaming = useStreamingContext();
  const task = useTaskContext();
  const ui = useUIContext();

  return {
    // Client context
    clients: client.clients,
    selectedClientId: client.selectedClientId,
    selectedClient: client.selectedClient,
    isInitialLoading: client.isInitialLoading,
    initialLoadError: client.initialLoadError,
    selectClient: client.selectClient,
    refreshClients: client.refreshClients,
    addDocument: client.addDocument,
    uploadFile: client.uploadFile,
    updateClient: client.updateClient,

    // Thread context
    threads: thread.threads,
    activeThreadId: thread.activeThreadId,
    activeThread: thread.activeThread,
    messagesByThread: thread.messagesByThread,
    activeMessages: thread.activeMessages,
    inputValue: thread.inputValue,
    isLoading: thread.isLoading,
    selectThread: thread.selectThread,
    createThread: thread.createThread,
    sendMessage: thread.sendMessage,
    setInputValue: thread.setInputValue,
    cleanupEmptyThreads: thread.cleanupEmptyThreads,

    // Streaming context
    isTyping: streaming.isTyping,
    isStreaming: streaming.isStreaming,
    streamingContent: streaming.streamingContent,
    reasoningSteps: streaming.reasoningSteps,
    pendingSources: streaming.pendingSources,
    streamStatus: streaming.streamStatus,
    streamError: streaming.streamError,

    // Task context
    tasks: task.tasks,
    selectedTaskId: task.selectedTaskId,
    selectedTask: task.selectedTask,
    inProgressTasks: task.inProgressTasks,
    readyTasks: task.readyTasks,
    selectTask: task.selectTask,
    addTask: task.addTask,
    advanceTaskStep: task.advanceTaskStep,
    completeTask: task.completeTask,

    // UI context
    clientDropdownOpen: ui.clientDropdownOpen,
    viewingDocument: ui.viewingDocument,
    uploadModalOpen: ui.uploadModalOpen,
    viewingCitation: ui.viewingCitation,
    attachedFile: ui.attachedFile,
    isUploading: ui.isUploading,
    uploadError: ui.uploadError,
    setClientDropdownOpen: ui.setClientDropdownOpen,
    openDocumentViewer: ui.openDocumentViewer,
    closeDocumentViewer: ui.closeDocumentViewer,
    openUploadModal: ui.openUploadModal,
    closeUploadModal: ui.closeUploadModal,
    openCitation: ui.openCitation,
    closeCitation: ui.closeCitation,
    fetchSourceAndOpen: ui.fetchSourceAndOpen,
    setAttachedFile: ui.setAttachedFile,
  };
}

// =============================================================================
// COMPOSITE PROVIDER
// =============================================================================

interface ChatProvidersProps {
  children: ReactNode;
}

/**
 * Composite provider that wraps all chat-related contexts.
 * Use this at the app/layout level to provide all chat functionality.
 *
 * Provider order matters - inner providers can access outer providers:
 * 1. UIProvider (no dependencies)
 * 2. TaskProvider (no dependencies)
 * 3. ClientProvider (no dependencies)
 * 4. StreamingProvider (no dependencies)
 * 5. ThreadProvider (depends on Client, Streaming, UI)
 */
export function ChatProviders({ children }: ChatProvidersProps) {
  return (
    <UIProvider>
      <TaskProvider>
        <ClientProvider>
          <StreamingProvider>
            <ThreadProvider>
              {children}
            </ThreadProvider>
          </StreamingProvider>
        </ClientProvider>
      </TaskProvider>
    </UIProvider>
  );
}
