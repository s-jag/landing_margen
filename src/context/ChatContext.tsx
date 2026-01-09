'use client';

/**
 * @deprecated This file is maintained for backward compatibility.
 * Import from '@/context/chat' instead for the new split context architecture.
 *
 * Example:
 *   import { useChat, ChatProviders } from '@/context/chat';
 *
 * Or use specific contexts:
 *   import { useClientContext } from '@/context/chat/ClientContext';
 *   import { useThreadContext } from '@/context/chat/ThreadContext';
 */

// Re-export everything from the new split contexts
export {
  useChat,
  ChatProviders,
  useClientContext,
  useThreadContext,
  useStreamingContext,
  useTaskContext,
  useUIContext,
  ClientProvider,
  ThreadProvider,
  StreamingProvider,
  TaskProvider,
  UIProvider,
} from './chat';

// Re-export ChatProviders as ChatProvider for backward compatibility
export { ChatProviders as ChatProvider } from './chat';
