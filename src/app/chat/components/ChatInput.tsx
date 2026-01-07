'use client';

import { useRef, useCallback, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { cn } from '@/lib/utils';
import type { DocumentType } from '@/types/chat';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'W2', label: 'W-2' },
  { value: '1099', label: '1099' },
  { value: 'Receipt', label: 'Receipt' },
  { value: 'Prior Return', label: 'Prior Return' },
  { value: 'Other', label: 'Other' },
];

export function ChatInput() {
  const {
    inputValue,
    setInputValue,
    sendMessage,
    isLoading,
    isTyping,
    selectedClient,
    attachedFile,
    setAttachedFile,
    uploadFile,
    isUploading,
    uploadError,
  } = useChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isLoading || isTyping || isUploading) return;

    // Upload file first if attached
    if (attachedFile) {
      const documentId = await uploadFile(attachedFile.file, attachedFile.type);
      if (!documentId) {
        // Upload failed, don't send message
        return;
      }
    }

    sendMessage(inputValue);
    setAttachedFile(null);
  }, [inputValue, isLoading, isTyping, isUploading, attachedFile, uploadFile, sendMessage, setAttachedFile]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      setPendingFile(file);
      setShowTypeSelector(true);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowTypeSelector(true);
    }
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  }, []);

  const handleTypeSelect = useCallback((type: DocumentType) => {
    if (pendingFile) {
      setAttachedFile({
        name: pendingFile.name,
        size: pendingFile.size,
        file: pendingFile,
        type,
      });
    }
    setPendingFile(null);
    setShowTypeSelector(false);
  }, [pendingFile, setAttachedFile]);

  const handleCancelTypeSelect = useCallback(() => {
    setPendingFile(null);
    setShowTypeSelector(false);
  }, []);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(() => {
    setAttachedFile(null);
  }, [setAttachedFile]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isDisabled = !inputValue.trim() || isLoading || isTyping || isUploading;

  return (
    <div
      className={cn(
        'border-t border-border-02 px-2 py-1.5 bg-card transition-colors',
        isDragging && 'bg-accent/5 border-accent/30'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-[680px] mx-auto">
        {/* Document Type Selector Modal */}
        {showTypeSelector && pendingFile && (
          <div className="mb-2 p-3 bg-card-02 border border-border-01 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text">Select document type for: {pendingFile.name}</span>
              <button
                type="button"
                onClick={handleCancelTypeSelect}
                className="p-1 text-text-tertiary hover:text-text hover:bg-card-03 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((docType) => (
                <button
                  key={docType.value}
                  type="button"
                  onClick={() => handleTypeSelect(docType.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-card border border-border-01 rounded-md hover:bg-accent/10 hover:border-accent/30 transition-colors"
                >
                  {docType.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attached File */}
        {attachedFile && (
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-card-02 border border-border-01 rounded-md">
              <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-text">{attachedFile.name}</span>
              <span className="text-xs text-accent px-1.5 py-0.5 bg-accent/10 rounded">{attachedFile.type}</span>
              <span className="text-xs text-text-tertiary">{formatFileSize(attachedFile.size)}</span>
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="ml-1 p-0.5 text-text-tertiary hover:text-text hover:bg-card-03 rounded transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400">
            {uploadError}
          </div>
        )}

        {/* Drop Zone Indicator */}
        {isDragging && (
          <div className="mb-2 p-4 border-2 border-dashed border-accent/50 rounded-md text-center">
            <span className="text-sm text-accent">Drop file to attach</span>
          </div>
        )}

        <div className="bg-card-02 border border-border-02 rounded-md overflow-hidden focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
          <div className="flex items-center gap-3 px-3 py-2">
            {/* Left controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleAttachClick}
                disabled={isUploading}
                className={cn(
                  "p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-card-03 rounded transition-colors",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary hover:text-text-secondary hover:bg-card-03 rounded transition-colors"
              >
                <span>Claude 4</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Input - grows to fill */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${selectedClient.name}'s tax situation...`}
              disabled={isLoading || isTyping || isUploading}
              className="flex-1 bg-transparent text-sm text-text placeholder:text-text-tertiary outline-none min-w-0 disabled:opacity-50"
            />

            {/* Send button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isDisabled}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-full flex-shrink-0 transition-colors',
                isDisabled
                  ? 'bg-card-03 text-text-tertiary cursor-not-allowed'
                  : 'bg-accent text-bg hover:bg-accent/90'
              )}
            >
              {isUploading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </span>
              ) : isLoading || isTyping ? (
                'Thinking...'
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".csv,.xlsx,.xls,.pdf,.txt"
        />
      </div>
    </div>
  );
}
