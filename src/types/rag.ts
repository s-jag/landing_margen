// =============================================================================
// UNIFIED RAG TYPES
// =============================================================================
// These types provide a common interface for all state RAG providers,
// normalizing the different response formats into a unified structure.

import type { StateCapabilities, StateCode } from '@/config/stateConfig';

// =============================================================================
// UNIFIED CITATION TYPE
// =============================================================================

export interface UnifiedCitation {
  // Common fields (all states)
  text: string;
  citation: string;
  source: string;
  relevanceScore: number;

  // Optional fields (state-specific)
  sourceLabel?: string;        // Utah: human-readable source label
  docType?: string;            // Florida: statute, rule, case, taa
  docId?: string;              // Florida: document ID for drill-down
  chunkId?: string;            // Florida: chunk ID for source details
  authorityLevel?: number;     // Utah: 1=highest authority
  link?: string;               // External URL to official source
}

// =============================================================================
// UNIFIED RESPONSE TYPE
// =============================================================================

export interface UnifiedRAGResponse {
  // Core response fields (all states)
  requestId: string;
  response: string;
  citations: UnifiedCitation[];
  confidence: number;
  confidenceLabel?: string;    // Utah: high, medium, low
  warnings: string[];
  processingTimeMs: number;

  // Utah-specific fields
  formsMentioned?: string[];
  taxType?: string;
  taxTypeLabel?: string;

  // Florida-specific fields
  reasoningSteps?: Array<{
    stepNumber: number;
    node: string;
    description: string;
  }>;
  stageTimings?: Record<string, number>;

  // Metadata for UI
  stateCode: StateCode;
  capabilities: StateCapabilities;
}

// =============================================================================
// STREAMING EVENT TYPES
// =============================================================================

export type UnifiedStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'reasoning'; step: number; node: string; description: string }
  | { type: 'chunk'; chunks: UnifiedCitation[] }
  | { type: 'answer'; content: string }
  | { type: 'complete'; response: UnifiedRAGResponse }
  | { type: 'error'; error: string; message: string };

// =============================================================================
// PROVIDER INTERFACE
// =============================================================================

export interface QueryOptions {
  docTypes?: string[];
  taxYear?: number;
  expandGraph?: boolean;
  includeReasoning?: boolean;
  timeoutSeconds?: number;
  includeTrace?: boolean;
}

export interface ClientContext {
  state: string;
  filingStatus?: string;
}

export interface RAGProviderInterface {
  // Core query methods
  query(
    query: string,
    options?: QueryOptions,
    clientContext?: ClientContext
  ): Promise<UnifiedRAGResponse>;

  streamQuery(
    query: string,
    options?: QueryOptions,
    clientContext?: ClientContext
  ): AsyncGenerator<UnifiedStreamEvent>;

  // Health check
  checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;

  // Provider info
  getStateCode(): StateCode;
  getCapabilities(): StateCapabilities;
}

// =============================================================================
// UTAH-SPECIFIC TYPES (Raw API Response)
// =============================================================================

export interface UtahCitationRaw {
  text: string;
  source: string;
  source_label: string;
  citation: string;
  authority_level: number;
  relevance_score: number;
  link?: string;
}

export interface UtahQueryResponseRaw {
  response: string;
  citations: UtahCitationRaw[];
  forms_mentioned: string[];
  confidence: number;
  confidence_label: string;
  tax_type: string | null;
  tax_type_label: string;
  warnings: string[];
  trace?: Record<string, unknown>;
}

export interface UtahFormInfo {
  form_number: string;
  title: string;
  url: string | null;
  description: string;
}

export interface UtahHealthResponse {
  status: string;
  qdrant: {
    status: string;
    connected: boolean;
    details?: Record<string, unknown>;
  };
  neo4j: {
    status: string;
    connected: boolean;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

// =============================================================================
// FLORIDA-SPECIFIC TYPES (Raw API Response)
// =============================================================================

export interface FloridaCitationRaw {
  doc_id: string;
  citation: string;
  doc_type: 'statute' | 'rule' | 'case' | 'taa';
  text_snippet: string;
}

export interface FloridaSourceRaw {
  chunk_id: string;
  doc_id: string;
  doc_type: 'statute' | 'rule' | 'case' | 'taa';
  citation: string;
  text: string;
  effective_date?: string;
  relevance_score: number;
}

export interface FloridaQueryResponseRaw {
  request_id: string;
  answer: string;
  citations: FloridaCitationRaw[];
  sources: FloridaSourceRaw[];
  confidence: number;
  warnings: string[];
  reasoning_steps: Array<{
    step_number: number;
    node: string;
    description: string;
  }>;
  validation_passed: boolean;
  processing_time_ms: number;
  stage_timings: Record<string, number>;
}

// =============================================================================
// FORM TYPES (Utah-specific, but could be extended)
// =============================================================================

export interface TaxFormInfo {
  formNumber: string;
  title: string;
  url: string | null;
  description: string;
  stateCode: StateCode;
}
