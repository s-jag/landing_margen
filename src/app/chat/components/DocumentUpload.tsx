'use client';

import { useState, useRef, useCallback } from 'react';
import { useChat } from '@/context/ChatContext';
import { Modal } from './Modal';
import { DOCUMENT_TYPES } from '@/lib/chatUtils';
import type { DocumentType } from '@/types/chat';
import { cn } from '@/lib/utils';

// Accepted file types (matching API)
const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx';
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload() {
  const { uploadModalOpen, closeUploadModal, uploadFile, selectedClient } = useChat();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('Other');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PDF, image, or Word document.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 10MB.';
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
  }, [validateFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadFile(selectedFile, documentType);
      if (result) {
        handleClose();
      } else {
        setUploadError('Failed to upload document. Please try again.');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    closeUploadModal();
    // Reset form
    setSelectedFile(null);
    setDocumentType('Other');
    setTypeDropdownOpen(false);
    setUploadError(null);
  };

  const clearSelectedFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const isValid = selectedFile !== null;

  return (
    <Modal isOpen={uploadModalOpen} onClose={handleClose} title="Upload Document">
      <div className="p-5">
        {/* Info text */}
        <p className="text-sm text-text-secondary mb-5">
          Upload a document to {selectedClient.name}&apos;s file.
        </p>

        {/* File Drop Zone */}
        <div className="mb-4">
          <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
            File
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all',
              isDragging
                ? 'border-accent bg-accent/5'
                : 'border-border-02 hover:border-border-03 hover:bg-card-02'
            )}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-text truncate max-w-[200px]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="ml-2 p-1 text-text-secondary hover:text-text hover:bg-card-03 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-text-secondary">
                  Drag & drop a file or <span className="text-accent">browse</span>
                </span>
                <span className="text-xs text-text-tertiary">
                  PDF, images, or Word docs (max 10MB)
                </span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            accept={ACCEPTED_FILE_TYPES}
            className="hidden"
          />
        </div>

        {/* Error Message */}
        {uploadError && (
          <div className="mb-4 p-3 bg-ansi-red/10 border border-ansi-red/30 rounded-md">
            <p className="text-sm text-ansi-red">{uploadError}</p>
          </div>
        )}

        {/* Document Type Selector */}
        <div className="mb-6">
          <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
            Document Type
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              className="w-full text-left px-3 py-2.5 bg-card-02 border border-border-02 rounded-md text-sm text-text hover:border-border-03 transition-colors flex items-center justify-between"
            >
              <span>{documentType}</span>
              <svg
                className={cn(
                  'w-4 h-4 text-text-secondary transition-transform',
                  typeDropdownOpen && 'rotate-180'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {typeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card-02 border border-border-02 rounded-md shadow-lg z-10 overflow-hidden">
                {DOCUMENT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setDocumentType(type);
                      setTypeDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-card-03 transition-colors',
                      type === documentType ? 'bg-card-03 text-text' : 'text-text-secondary'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text hover:bg-card-02 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isUploading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
              isValid && !isUploading
                ? 'bg-accent text-bg hover:bg-accent/90'
                : 'bg-card-03 text-text-tertiary cursor-not-allowed'
            )}
          >
            {isUploading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
