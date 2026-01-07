'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { CreateClientModal } from './CreateClientModal';

export function ClientSelector() {
  const {
    clients,
    selectedClient,
    selectedClientId,
    clientDropdownOpen,
    setClientDropdownOpen,
    selectClient,
    refreshClients,
  } = useChat();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setClientDropdownOpen(false);
      }
    }

    if (clientDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [clientDropdownOpen, setClientDropdownOpen]);

  return (
    <div className="p-3 border-b border-border-01">
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
          className="w-full text-left bg-card-02 rounded-md p-3 border border-border-02 hover:border-border-03 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text">{selectedClient.name}</div>
              <div className="text-xs text-text-secondary mt-0.5">
                {selectedClient.state} · {selectedClient.taxYear} · {selectedClient.filingStatus}
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-text-secondary ml-3 flex-shrink-0 transition-transform ${
                clientDropdownOpen ? 'rotate-180' : ''
              }`}
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
          </div>
        </button>

        {/* Dropdown */}
        {clientDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card-02 border border-border-02 rounded-md shadow-lg z-10 overflow-hidden">
            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => selectClient(client.id)}
                className={`w-full text-left px-3 py-2 hover:bg-card-03 transition-colors ${
                  client.id === selectedClientId ? 'bg-card-03' : ''
                }`}
              >
                <div className="text-sm text-text">{client.name}</div>
                <div className="text-xs text-text-secondary">
                  {client.state} · {client.filingStatus}
                </div>
              </button>
            ))}

            {/* Divider and Create Button */}
            <div className="border-t border-border-01">
              <button
                type="button"
                onClick={() => {
                  setClientDropdownOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 hover:bg-card-03 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-accent font-medium">New Client</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClientCreated={refreshClients}
      />
    </div>
  );
}
