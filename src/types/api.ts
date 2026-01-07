import { z } from 'zod';

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface APIError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================================================
// CLIENT SCHEMAS & TYPES
// =============================================================================

export const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  state: z.string().length(2),
  taxYear: z.number().min(1990).max(2030),
  filingStatus: z.enum(['Single', 'MFJ', 'MFS', 'HoH', 'QW']),
  ssnLastFour: z.string().length(4).optional(),
  grossIncome: z.number().optional(),
  schedCRevenue: z.number().optional(),
  dependents: z.number().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientRequest = z.infer<typeof createClientSchema>;
export type UpdateClientRequest = z.infer<typeof updateClientSchema>;

// =============================================================================
// THREAD SCHEMAS & TYPES
// =============================================================================

export const createThreadSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1).max(255),
});

export type CreateThreadRequest = z.infer<typeof createThreadSchema>;

// =============================================================================
// MESSAGE SCHEMAS & TYPES
// =============================================================================

export const createMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  role: z.enum(['user', 'assistant', 'system']).default('user'),
});

export type CreateMessageRequest = z.infer<typeof createMessageSchema>;

// =============================================================================
// QUERY SCHEMAS & TYPES (RAG Integration)
// =============================================================================

export const queryOptionsSchema = z.object({
  docTypes: z.array(z.enum(['statute', 'rule', 'case', 'taa'])).optional(),
  taxYear: z.number().min(1990).max(2030).optional(),
  expandGraph: z.boolean().optional(),
  includeReasoning: z.boolean().optional(),
  timeoutSeconds: z.number().min(5).max(300).optional(),
});

export const queryRequestSchema = z.object({
  message: z.string().min(3).max(2000),
  clientId: z.string().uuid(),
  threadId: z.string().uuid(),
  options: queryOptionsSchema.optional(),
});

export type QueryOptions = z.infer<typeof queryOptionsSchema>;
export type QueryRequest = z.infer<typeof queryRequestSchema>;

// RAG API Response Types (from external RAG service)
export interface RAGCitation {
  doc_id: string;
  citation: string;
  doc_type: 'statute' | 'rule' | 'case' | 'taa';
  text_snippet: string;
}

export interface RAGSource {
  chunk_id: string;
  doc_id: string;
  doc_type: 'statute' | 'rule' | 'case' | 'taa';
  citation: string;
  text: string;
  effective_date?: string;
  relevance_score: number;
}

export interface RAGQueryResponse {
  request_id: string;
  answer: string;
  citations: RAGCitation[];
  sources: RAGSource[];
  confidence: number;
  warnings: string[];
  reasoning_steps: Array<{ step_number: number; node: string; description: string }>;
  validation_passed: boolean;
  processing_time_ms: number;
  stage_timings: Record<string, number>;
}

// Our API Response Types (transformed)
export interface Citation {
  docId: string;
  citation: string;
  docType: 'statute' | 'rule' | 'case' | 'taa';
  excerpt: string;
  fullText?: string;
}

export interface Source {
  chunkId: string;
  docId: string;
  docType: 'statute' | 'rule' | 'case' | 'taa';
  citation: string;
  text: string;
  relevanceScore: number;
}

export interface QueryResponse {
  id: string;
  requestId: string;
  answer: string;
  citations: Citation[];
  sources: Source[];
  confidence: number;
  processingTimeMs: number;
  warnings?: string[];
}

// =============================================================================
// STREAMING EVENT TYPES
// =============================================================================

export type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'reasoning'; step: number; node: string; description: string }
  | { type: 'chunk'; chunks: Array<{ chunkId: string; citation: string; relevanceScore: number }> }
  | { type: 'answer'; content: string }
  | { type: 'complete'; metadata: QueryMetadata }
  | { type: 'error'; error: string; message: string };

export interface QueryMetadata {
  requestId: string;
  confidence: number;
  processingTimeMs: number;
  citationCount: number;
  sourceCount: number;
}

// =============================================================================
// SOURCE DETAIL TYPES
// =============================================================================

export interface SourceDetail {
  chunkId: string;
  docId: string;
  docType: 'statute' | 'rule' | 'case' | 'taa';
  level: string;
  text: string;
  textWithAncestry: string;
  ancestry: string;
  citation: string;
  effectiveDate?: string;
  tokenCount: number;
  parentChunkId?: string;
  childChunkIds: string[];
  relatedDocIds: string[];
}

export interface StatuteWithRules {
  statute: {
    docId: string;
    title: string;
    text: string;
    effectiveDate: string;
  };
  implementingRules: Array<{
    docId: string;
    title: string;
    citation: string;
  }>;
  interpretingCases: Array<{
    docId: string;
    title: string;
    citation: string;
  }>;
  interpretingTaas: Array<{
    docId: string;
    title: string;
    citation: string;
  }>;
}

export interface RelatedDocuments {
  docId: string;
  citingDocuments: Array<{
    docId: string;
    docType: string;
    citation: string;
  }>;
  citedDocuments: Array<{
    docId: string;
    docType: string;
    citation: string;
  }>;
  interpretationChain?: {
    implementingRules: Array<{ docId: string; citation: string }>;
    interpretingCases: Array<{ docId: string; citation: string }>;
    interpretingTaas: Array<{ docId: string; citation: string }>;
  };
}

// =============================================================================
// TASK SCHEMAS & TYPES
// =============================================================================

export const taskStepSchema = z.object({
  label: z.string(),
  status: z.enum(['pending', 'running', 'done']),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  clientId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  steps: z.array(taskStepSchema).optional(),
  attachedFile: z.string().optional(),
});

export const updateTaskSchema = z.object({
  status: z.enum(['in_progress', 'ready', 'complete', 'failed']).optional(),
  currentStep: z.number().min(0).optional(),
  steps: z.array(taskStepSchema).optional(),
  errorMessage: z.string().optional(),
});

export type TaskStep = z.infer<typeof taskStepSchema>;
export type CreateTaskRequest = z.infer<typeof createTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof updateTaskSchema>;

// =============================================================================
// DOCUMENT SCHEMAS & TYPES
// =============================================================================

export const documentTypeSchema = z.enum(['W2', '1099', 'Receipt', 'Prior Return', 'Other']);

export const uploadDocumentSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: documentTypeSchema,
});

export type DocumentType = z.infer<typeof documentTypeSchema>;
export type UploadDocumentRequest = z.infer<typeof uploadDocumentSchema>;

// =============================================================================
// HEALTH CHECK TYPES
// =============================================================================

export interface ServiceHealth {
  name: string;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  timestamp: string;
}
