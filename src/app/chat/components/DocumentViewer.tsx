'use client';

import { useChat } from '@/context/ChatContext';
import { Modal } from './Modal';
import { getDocIcon, getDocumentTypeLabel } from '@/lib/chatUtils';

export function DocumentViewer() {
  const { viewingDocument, closeDocumentViewer } = useChat();

  if (!viewingDocument) return null;

  const iconInfo = getDocIcon(viewingDocument.name);

  // Generate mock preview content based on document type
  const getMockPreviewContent = () => {
    switch (viewingDocument.type) {
      case 'W2':
        return (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Employer</span>
              <span className="text-text">ABC Corporation</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Wages (Box 1)</span>
              <span className="text-text font-medium tabular-nums">$85,000.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Federal Tax Withheld</span>
              <span className="text-text font-medium tabular-nums">$12,750.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Social Security Wages</span>
              <span className="text-text font-medium tabular-nums">$85,000.00</span>
            </div>
          </div>
        );

      case '1099':
        return (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Payer</span>
              <span className="text-text">Consulting Services LLC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Nonemployee Compensation</span>
              <span className="text-text font-medium tabular-nums">$42,300.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Federal Tax Withheld</span>
              <span className="text-text font-medium tabular-nums">$0.00</span>
            </div>
          </div>
        );

      case 'Receipt':
        return (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Vendor</span>
              <span className="text-text">Office Supplies Co.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Date</span>
              <span className="text-text">Dec 15, 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Amount</span>
              <span className="text-text font-medium tabular-nums">$245.99</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Category</span>
              <span className="text-text">Business Expense</span>
            </div>
          </div>
        );

      case 'Prior Return':
        return (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Tax Year</span>
              <span className="text-text">2023</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Filing Status</span>
              <span className="text-text">Married Filing Jointly</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">AGI</span>
              <span className="text-text font-medium tabular-nums">$165,400.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Tax Liability</span>
              <span className="text-text font-medium tabular-nums">$24,810.00</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-text-tertiary text-sm py-4">
            Document preview not available
          </div>
        );
    }
  };

  return (
    <Modal isOpen={!!viewingDocument} onClose={closeDocumentViewer} title="Document View">
      <div className="p-5">
        {/* Document Header */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className={`text-sm font-medium px-2 py-1 rounded ${iconInfo.color} ${iconInfo.bg}`}
          >
            {iconInfo.label}
          </span>
          <span className="text-text font-medium">{viewingDocument.name}</span>
        </div>

        {/* Mock Preview Area */}
        <div className="bg-card-02 border border-border-02 rounded-md p-5 mb-6">
          {getMockPreviewContent()}
        </div>

        {/* Document Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Type</span>
            <span className="text-text">{getDocumentTypeLabel(viewingDocument.type)}</span>
          </div>
          {viewingDocument.uploadedAt && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Added</span>
              <span className="text-text">{viewingDocument.uploadedAt}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
