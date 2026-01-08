'use client';

import { useState, useCallback } from 'react';
import type { ExtractedDocumentData } from '@/types/database';

interface ExtractionState {
  extracting: Record<string, boolean>;
  errors: Record<string, string>;
  results: Record<string, ExtractedDocumentData>;
}

interface AggregationResult {
  success: boolean;
  aggregatedValues: {
    grossIncome: number;
    schedCRevenue: number;
    dependents: number;
  };
  documentsProcessed: number;
}

/**
 * Hook for managing document data extraction
 */
export function useDocumentExtraction() {
  const [state, setState] = useState<ExtractionState>({
    extracting: {},
    errors: {},
    results: {},
  });
  const [aggregating, setAggregating] = useState(false);

  /**
   * Extract data from a single document
   */
  const extractDocument = useCallback(async (documentId: string): Promise<ExtractedDocumentData | null> => {
    setState(prev => ({
      ...prev,
      extracting: { ...prev.extracting, [documentId]: true },
      errors: { ...prev.errors, [documentId]: '' },
    }));

    try {
      const response = await fetch(`/api/documents/${documentId}/extract`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Extraction failed');
      }

      const extractedData = data.extractedData as ExtractedDocumentData;

      setState(prev => ({
        ...prev,
        extracting: { ...prev.extracting, [documentId]: false },
        results: { ...prev.results, [documentId]: extractedData },
      }));

      return extractedData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Extraction failed';
      setState(prev => ({
        ...prev,
        extracting: { ...prev.extracting, [documentId]: false },
        errors: { ...prev.errors, [documentId]: message },
      }));
      return null;
    }
  }, []);

  /**
   * Get extraction status for a document
   */
  const getExtractionStatus = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/extract`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get status');
      }

      return data;
    } catch (error) {
      console.error('Failed to get extraction status:', error);
      return null;
    }
  }, []);

  /**
   * Aggregate all extractions for a client and update their record
   */
  const aggregateExtractions = useCallback(async (clientId: string): Promise<AggregationResult | null> => {
    setAggregating(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/aggregate-extractions`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Aggregation failed');
      }

      return data as AggregationResult;
    } catch (error) {
      console.error('Aggregation failed:', error);
      return null;
    } finally {
      setAggregating(false);
    }
  }, []);

  /**
   * Extract all pending documents for a client
   */
  const extractAllDocuments = useCallback(async (documentIds: string[]): Promise<number> => {
    let successCount = 0;

    for (const docId of documentIds) {
      const result = await extractDocument(docId);
      if (result) {
        successCount++;
      }
    }

    return successCount;
  }, [extractDocument]);

  /**
   * Clear error for a document
   */
  const clearError = useCallback((documentId: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [documentId]: '' },
    }));
  }, []);

  /**
   * Check if a document is currently being extracted
   */
  const isExtracting = useCallback((documentId: string): boolean => {
    return state.extracting[documentId] || false;
  }, [state.extracting]);

  /**
   * Get error for a document
   */
  const getError = useCallback((documentId: string): string => {
    return state.errors[documentId] || '';
  }, [state.errors]);

  /**
   * Get extraction result for a document
   */
  const getResult = useCallback((documentId: string): ExtractedDocumentData | null => {
    return state.results[documentId] || null;
  }, [state.results]);

  return {
    // Actions
    extractDocument,
    extractAllDocuments,
    aggregateExtractions,
    getExtractionStatus,
    clearError,

    // State accessors
    isExtracting,
    getError,
    getResult,
    aggregating,

    // Raw state (for advanced use)
    extracting: state.extracting,
    errors: state.errors,
    results: state.results,
  };
}
