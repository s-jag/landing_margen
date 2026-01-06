'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { Modal } from './Modal';
import { DOCUMENT_TYPES } from '@/lib/chatUtils';
import type { DocumentType } from '@/types/chat';
import { cn } from '@/lib/utils';

export function DocumentUpload() {
  const { uploadModalOpen, closeUploadModal, addDocument, selectedClient } = useChat();

  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('Other');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const handleSubmit = () => {
    if (!documentName.trim()) return;

    addDocument(documentName.trim(), documentType);

    // Reset form
    setDocumentName('');
    setDocumentType('Other');
  };

  const handleClose = () => {
    closeUploadModal();
    // Reset form
    setDocumentName('');
    setDocumentType('Other');
    setTypeDropdownOpen(false);
  };

  const isValid = documentName.trim().length > 0;

  return (
    <Modal isOpen={uploadModalOpen} onClose={handleClose} title="Add Document">
      <div className="p-5">
        {/* Info text */}
        <p className="text-sm text-text-secondary mb-5">
          Add a document to {selectedClient.name}&apos;s file.
        </p>

        {/* Document Name Input */}
        <div className="mb-4">
          <label
            htmlFor="document-name"
            className="block text-xs text-text-secondary uppercase tracking-wider mb-2"
          >
            Document Name
          </label>
          <input
            id="document-name"
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="e.g., W-2 Employer Name.pdf"
            className="w-full px-3 py-2.5 bg-card-02 border border-border-02 rounded-md text-sm text-text placeholder:text-text-tertiary outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            autoFocus
          />
        </div>

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
            className="px-4 py-2 text-sm text-text-secondary hover:text-text hover:bg-card-02 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isValid
                ? 'bg-accent text-bg hover:bg-accent/90'
                : 'bg-card-03 text-text-tertiary cursor-not-allowed'
            )}
          >
            Add Document
          </button>
        </div>
      </div>
    </Modal>
  );
}
