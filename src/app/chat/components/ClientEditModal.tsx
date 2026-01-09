'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import type { Client } from '@/types/chat';
import { cn } from '@/lib/utils';

// US State options
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

// Filing status options
const FILING_STATUSES = [
  { value: 'Single', label: 'Single' },
  { value: 'MFJ', label: 'Married Filing Jointly' },
  { value: 'MFS', label: 'Married Filing Separately' },
  { value: 'HoH', label: 'Head of Household' },
  { value: 'QW', label: 'Qualifying Widow(er)' },
];

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSave: (updates: Partial<Client>) => Promise<boolean>;
}

export function ClientEditModal({ isOpen, onClose, client, onSave }: ClientEditModalProps) {
  // Form state
  const [state, setState] = useState(client.state);
  const [filingStatus, setFilingStatus] = useState(client.filingStatus);
  const [taxYear, setTaxYear] = useState(client.taxYear);
  const [grossIncome, setGrossIncome] = useState(client.grossIncome);
  const [schedCRevenue, setSchedCRevenue] = useState(client.schedCRevenue);
  const [dependents, setDependents] = useState(client.dependents);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when client changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setState(client.state);
      setFilingStatus(client.filingStatus);
      setTaxYear(client.taxYear);
      setGrossIncome(client.grossIncome);
      setSchedCRevenue(client.schedCRevenue);
      setDependents(client.dependents);
      setError(null);
    }
  }, [isOpen, client]);

  const handleSubmit = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const updates: Partial<Client> = {
        state,
        filingStatus,
        taxYear,
        grossIncome,
        schedCRevenue,
        dependents,
      };

      const success = await onSave(updates);
      if (success) {
        onClose();
      } else {
        setError('Failed to save changes. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  }, [state, filingStatus, taxYear, grossIncome, schedCRevenue, dependents, onSave, onClose]);

  // Format currency for display
  const formatCurrencyInput = (value: number) => {
    return value.toLocaleString('en-US');
  };

  // Parse currency input
  const parseCurrencyInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Client">
      <div className="p-5">
        {/* Client Name (Read-only) */}
        <div className="mb-4">
          <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
            Client Name
          </label>
          <div className="px-3 py-2.5 bg-card-03 border border-border-02 rounded-md text-sm text-text-secondary">
            {client.name}
          </div>
        </div>

        {/* SSN (Read-only) */}
        <div className="mb-4">
          <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
            SSN
          </label>
          <div className="px-3 py-2.5 bg-card-03 border border-border-02 rounded-md text-sm text-text-secondary">
            {client.ssn}
          </div>
        </div>

        {/* State and Filing Status Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* State */}
          <div>
            <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
              State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2.5 bg-card-02 border border-border-02 rounded-md text-sm text-text hover:border-border-03 transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Tax Year */}
          <div>
            <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
              Tax Year
            </label>
            <input
              type="number"
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value) || 2024)}
              min={2000}
              max={2030}
              className="w-full px-3 py-2.5 bg-card-02 border border-border-02 rounded-md text-sm text-text hover:border-border-03 transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Filing Status */}
        <div className="mb-4">
          <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
            Filing Status
          </label>
          <select
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value)}
            className="w-full px-3 py-2.5 bg-card-02 border border-border-02 rounded-md text-sm text-text hover:border-border-03 transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {FILING_STATUSES.map((fs) => (
              <option key={fs.value} value={fs.value}>
                {fs.label}
              </option>
            ))}
          </select>
        </div>

        {/* Gross Income */}
        <div className="mb-4">
          <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
            Gross Income
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
            <input
              type="text"
              value={formatCurrencyInput(grossIncome)}
              onChange={(e) => setGrossIncome(parseCurrencyInput(e.target.value))}
              className="w-full pl-7 pr-3 py-2.5 bg-card-02 border border-border-02 rounded-md text-sm text-text hover:border-border-03 transition-colors focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
            />
          </div>
        </div>

        {/* Schedule C Revenue */}
        <div className="mb-4">
          <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
            Schedule C Revenue
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
            <input
              type="text"
              value={formatCurrencyInput(schedCRevenue)}
              onChange={(e) => setSchedCRevenue(parseCurrencyInput(e.target.value))}
              className="w-full pl-7 pr-3 py-2.5 bg-card-02 border border-border-02 rounded-md text-sm text-text hover:border-border-03 transition-colors focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
            />
          </div>
        </div>

        {/* Dependents */}
        <div className="mb-6">
          <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">
            Dependents
          </label>
          <input
            type="number"
            value={dependents}
            onChange={(e) => setDependents(parseInt(e.target.value) || 0)}
            min={0}
            max={20}
            className="w-full px-3 py-2.5 bg-card-02 border border-border-02 rounded-md text-sm text-text hover:border-border-03 transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-ansi-red/10 border border-ansi-red/30 rounded-md">
            <p className="text-sm text-ansi-red">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text hover:bg-card-02 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
              !isSaving
                ? 'bg-accent text-bg hover:bg-accent/90'
                : 'bg-card-03 text-text-tertiary cursor-not-allowed'
            )}
          >
            {isSaving && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
