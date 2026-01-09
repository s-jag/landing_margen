/**
 * OpenAPI Specification Generator
 *
 * Generates OpenAPI 3.0 documentation from Zod schemas.
 * Uses @asteasolutions/zod-to-openapi for schema conversion.
 */

import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

// =============================================================================
// REGISTRY
// =============================================================================

const registry = new OpenAPIRegistry();

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

const ErrorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({
    error: z.string().openapi({ example: 'VALIDATION_ERROR' }),
    message: z.string().openapi({ example: 'Invalid request body' }),
    details: z.record(z.string(), z.unknown()).optional(),
  }).openapi({ description: 'Standard error response' })
);

const PaginationSchema = z.object({
  total: z.number().openapi({ example: 100 }),
  page: z.number().openapi({ example: 1 }),
  pageSize: z.number().openapi({ example: 20 }),
  hasMore: z.boolean().openapi({ example: true }),
});

// =============================================================================
// CLIENT SCHEMAS
// =============================================================================

const ClientSchema = registry.register(
  'Client',
  z.object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    name: z.string().openapi({ example: 'John Smith' }),
    state: z.string().length(2).openapi({ example: 'FL' }),
    taxYear: z.number().openapi({ example: 2024 }),
    filingStatus: z.enum(['Single', 'MFJ', 'MFS', 'HoH', 'QW']).openapi({ example: 'Single' }),
    ssnLastFour: z.string().length(4).optional().openapi({ example: '1234' }),
    grossIncome: z.number().optional().openapi({ example: 75000 }),
    schedCRevenue: z.number().optional().openapi({ example: 0 }),
    dependents: z.number().optional().openapi({ example: 2 }),
    createdAt: z.string().datetime().openapi({ example: '2024-01-15T10:30:00Z' }),
    updatedAt: z.string().datetime().openapi({ example: '2024-01-15T10:30:00Z' }),
  }).openapi({ description: 'Client entity' })
);

const CreateClientSchema = registry.register(
  'CreateClient',
  z.object({
    name: z.string().min(1).max(255).openapi({ example: 'Jane Doe' }),
    state: z.string().length(2).openapi({ example: 'UT' }),
    taxYear: z.number().min(1990).max(2030).openapi({ example: 2024 }),
    filingStatus: z.enum(['Single', 'MFJ', 'MFS', 'HoH', 'QW']).openapi({ example: 'MFJ' }),
    ssnLastFour: z.string().length(4).optional().openapi({ example: '5678' }),
    grossIncome: z.number().optional().openapi({ example: 120000 }),
    schedCRevenue: z.number().optional().openapi({ example: 45000 }),
    dependents: z.number().min(0).optional().openapi({ example: 1 }),
  }).openapi({ description: 'Create client request body' })
);

// =============================================================================
// THREAD SCHEMAS
// =============================================================================

const ThreadSchema = registry.register(
  'Thread',
  z.object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    title: z.string(),
    messageCount: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).openapi({ description: 'Conversation thread' })
);

const CreateThreadSchema = registry.register(
  'CreateThread',
  z.object({
    clientId: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    title: z.string().min(1).max(255).openapi({ example: 'Tax Filing Questions' }),
  }).openapi({ description: 'Create thread request' })
);

// =============================================================================
// MESSAGE SCHEMAS
// =============================================================================

const MessageSchema = registry.register(
  'Message',
  z.object({
    id: z.string().uuid(),
    threadId: z.string().uuid(),
    content: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    citations: z.array(z.object({
      docId: z.string(),
      citation: z.string(),
      docType: z.enum(['statute', 'rule', 'case', 'taa']),
      excerpt: z.string(),
    })).optional(),
    createdAt: z.string().datetime(),
  }).openapi({ description: 'Chat message' })
);

const CreateMessageSchema = registry.register(
  'CreateMessage',
  z.object({
    content: z.string().min(1).max(10000).openapi({ example: 'What are the tax implications of...' }),
    role: z.enum(['user', 'assistant', 'system']).default('user'),
  }).openapi({ description: 'Create message request' })
);

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

const QueryRequestSchema = registry.register(
  'QueryRequest',
  z.object({
    message: z.string().min(3).max(2000).openapi({ example: 'What is the Florida sales tax rate?' }),
    clientId: z.string().uuid(),
    threadId: z.string().uuid(),
    options: z.object({
      docTypes: z.array(z.enum(['statute', 'rule', 'case', 'taa'])).optional(),
      taxYear: z.number().optional(),
      expandGraph: z.boolean().optional(),
      includeReasoning: z.boolean().optional(),
      timeoutSeconds: z.number().optional(),
    }).optional(),
  }).openapi({ description: 'RAG query request' })
);

const QueryResponseSchema = registry.register(
  'QueryResponse',
  z.object({
    id: z.string(),
    requestId: z.string(),
    answer: z.string(),
    citations: z.array(z.object({
      docId: z.string(),
      citation: z.string(),
      docType: z.enum(['statute', 'rule', 'case', 'taa']),
      excerpt: z.string(),
    })),
    confidence: z.number(),
    processingTimeMs: z.number(),
  }).openapi({ description: 'RAG query response' })
);

// =============================================================================
// DOCUMENT SCHEMAS
// =============================================================================

const DocumentSchema = registry.register(
  'Document',
  z.object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    name: z.string(),
    type: z.enum(['W2', '1099', 'Receipt', 'Prior Return', 'Other']),
    mimeType: z.string().optional(),
    extractionStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    createdAt: z.string().datetime(),
  }).openapi({ description: 'Document entity' })
);

// =============================================================================
// HEALTH SCHEMAS
// =============================================================================

const HealthResponseSchema = registry.register(
  'HealthResponse',
  z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']).openapi({ example: 'healthy' }),
    services: z.array(z.object({
      name: z.string().openapi({ example: 'database' }),
      healthy: z.boolean().openapi({ example: true }),
      latencyMs: z.number().optional().openapi({ example: 15 }),
      error: z.string().optional(),
    })),
    timestamp: z.string().datetime().openapi({ example: '2024-01-15T10:30:00Z' }),
  }).openapi({ description: 'Health check response' })
);

// =============================================================================
// REGISTER PATHS
// =============================================================================

// Health Check
registry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['Health'],
  summary: 'Check API health status',
  responses: {
    200: {
      description: 'Health status',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
  },
});

// Clients
registry.registerPath({
  method: 'get',
  path: '/api/clients',
  tags: ['Clients'],
  summary: 'List all clients',
  responses: {
    200: {
      description: 'List of clients',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(ClientSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/clients',
  tags: ['Clients'],
  summary: 'Create a new client',
  request: {
    body: {
      content: { 'application/json': { schema: CreateClientSchema } },
    },
  },
  responses: {
    201: {
      description: 'Client created',
      content: { 'application/json': { schema: ClientSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/clients/{id}',
  tags: ['Clients'],
  summary: 'Get client by ID',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Client details',
      content: { 'application/json': { schema: ClientSchema } },
    },
    404: {
      description: 'Client not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

// Threads
registry.registerPath({
  method: 'get',
  path: '/api/threads',
  tags: ['Threads'],
  summary: 'List threads for a client',
  request: {
    query: z.object({ clientId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'List of threads',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(ThreadSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/threads',
  tags: ['Threads'],
  summary: 'Create a new thread',
  request: {
    body: { content: { 'application/json': { schema: CreateThreadSchema } } },
  },
  responses: {
    201: {
      description: 'Thread created',
      content: { 'application/json': { schema: ThreadSchema } },
    },
  },
});

// Messages
registry.registerPath({
  method: 'get',
  path: '/api/threads/{threadId}/messages',
  tags: ['Messages'],
  summary: 'Get messages in a thread',
  request: {
    params: z.object({ threadId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'List of messages',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(MessageSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/threads/{threadId}/messages',
  tags: ['Messages'],
  summary: 'Add a message to a thread',
  request: {
    params: z.object({ threadId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: CreateMessageSchema } } },
  },
  responses: {
    201: {
      description: 'Message created',
      content: { 'application/json': { schema: MessageSchema } },
    },
  },
});

// Query
registry.registerPath({
  method: 'post',
  path: '/api/query',
  tags: ['Query'],
  summary: 'Execute a RAG query',
  description: 'Query the tax law knowledge base with AI-powered retrieval',
  request: {
    body: { content: { 'application/json': { schema: QueryRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Query response with citations',
      content: { 'application/json': { schema: QueryResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/query/stream',
  tags: ['Query'],
  summary: 'Execute a streaming RAG query',
  description: 'Query with Server-Sent Events for real-time responses',
  request: {
    body: { content: { 'application/json': { schema: QueryRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Server-Sent Events stream',
      content: {
        'text/event-stream': {
          schema: z.string().openapi({
            description: 'Server-Sent Events stream with JSON-encoded events',
            example: 'event: answer\ndata: {"content": "The tax rate is..."}\n\n',
          }),
        },
      },
    },
  },
});

// Documents
registry.registerPath({
  method: 'post',
  path: '/api/documents/upload',
  tags: ['Documents'],
  summary: 'Upload a document',
  description: 'Upload a PDF document for a client with optional AI extraction',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().openapi({ type: 'string', format: 'binary' }),
            clientId: z.string().uuid(),
            type: z.enum(['W2', '1099', 'Receipt', 'Prior Return', 'Other']),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Document uploaded',
      content: { 'application/json': { schema: DocumentSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/documents/{id}',
  tags: ['Documents'],
  summary: 'Get document by ID',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Document details',
      content: { 'application/json': { schema: DocumentSchema } },
    },
  },
});

// =============================================================================
// GENERATE OPENAPI DOCUMENT
// =============================================================================

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Margen API',
      version: '1.0.0',
      description: `
# Margen Tax Research API

AI-powered tax law research assistant API for Florida and Utah tax codes.

## Authentication

Most endpoints require authentication via Supabase Auth. Include the JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

- Default: 100 requests per 15 seconds
- Authenticated: 200 requests per 15 seconds

Rate limit headers are included in responses:
- \`X-RateLimit-Limit\`
- \`X-RateLimit-Remaining\`
- \`X-RateLimit-Reset\`
      `,
      contact: {
        name: 'Margen Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Health', description: 'API health and status' },
      { name: 'Clients', description: 'Client management' },
      { name: 'Threads', description: 'Conversation threads' },
      { name: 'Messages', description: 'Thread messages' },
      { name: 'Query', description: 'RAG query endpoints' },
      { name: 'Documents', description: 'Document upload and management' },
    ],
  });
}

export { registry };
