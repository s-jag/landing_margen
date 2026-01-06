# Margen Production Development Plan

## Executive Summary

This document outlines the complete development roadmap to take Margen from its current frontend-only demo state to a production-ready tax research platform. The plan integrates existing Florida and Federal RAG systems, implements proper authentication and data persistence, and prepares for Vercel deployment.

**Tech Stack:**
- Frontend: Next.js 14 (existing)
- Backend: Next.js API Routes + External RAG APIs
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth
- File Storage: Supabase Storage
- Deployment: Vercel
- RAG: Existing Florida Tax RAG API (REST)

---

## Phase 1: Foundation & Infrastructure (Week 1-2)

### 1.1 Supabase Project Setup

**Tasks:**
- [ ] Create Supabase project
- [ ] Configure environment variables
- [ ] Set up database connection pooling for Vercel

**Files to Create:**
```
/.env.local                    # Local environment variables
/.env.example                  # Template for team
/src/lib/supabase/client.ts    # Browser client
/src/lib/supabase/server.ts    # Server client (API routes)
/src/lib/supabase/middleware.ts # Auth middleware
```

**Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# RAG API
RAG_API_BASE_URL=https://rag-api.margen.ai
RAG_API_KEY=xxx  # When auth is added

# App
NEXT_PUBLIC_APP_URL=https://app.margen.ai
```

### 1.2 Database Schema Design

**Core Tables:**

```sql
-- Organizations (CPA firms)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free', -- free, pro, enterprise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Tax professionals)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients (Taxpayers)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  ssn_encrypted TEXT, -- Encrypted SSN
  state TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  gross_income DECIMAL(15,2),
  sched_c_revenue DECIMAL(15,2) DEFAULT 0,
  dependents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (Client files)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- W2, 1099, Receipt, Prior Return, Other
  storage_path TEXT NOT NULL, -- Supabase Storage path
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Threads
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  citation JSONB, -- {source, excerpt, fullText, doc_id}
  comparison JSONB, -- {options: [...]}
  rag_request_id TEXT, -- Link to RAG API request
  confidence DECIMAL(3,2),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (Async workflows)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress', -- in_progress, ready, complete
  current_step INTEGER DEFAULT 0,
  steps JSONB NOT NULL, -- [{label, status}]
  attached_file TEXT,
  rag_request_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- query, view_document, export, etc.
  resource_type TEXT, -- client, document, thread
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_threads_client ON threads(client_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_audit_org ON audit_log(organization_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

**Row Level Security (RLS):**
```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their organization's clients
CREATE POLICY "Users can view org clients" ON clients
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
```

**Files to Create:**
```
/supabase/migrations/001_initial_schema.sql
/supabase/migrations/002_rls_policies.sql
/src/types/database.ts  # Generated types from Supabase
```

### 1.3 Authentication Setup

**Implementation:**
- Supabase Auth with email/password
- Magic link support
- OAuth providers (Google, Microsoft) for enterprise

**Files to Create:**
```
/src/app/(auth)/login/page.tsx
/src/app/(auth)/signup/page.tsx
/src/app/(auth)/forgot-password/page.tsx
/src/middleware.ts                    # Route protection
/src/lib/auth/actions.ts              # Server actions for auth
/src/components/auth/LoginForm.tsx
/src/components/auth/SignupForm.tsx
```

**Protected Routes:**
- `/chat/*` - Requires authentication
- `/settings/*` - Requires authentication
- `/` - Public (landing page)

---

## Phase 2: API Layer (Week 2-3)

### 2.1 Next.js API Routes Structure

```
/src/app/api/
├── auth/
│   └── callback/route.ts       # Supabase auth callback
├── clients/
│   ├── route.ts                # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts            # GET, PUT, DELETE
│       └── documents/route.ts  # GET, POST documents
├── threads/
│   ├── route.ts                # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts            # GET, DELETE
│       └── messages/route.ts   # GET, POST messages
├── query/
│   ├── route.ts                # POST - sync RAG query
│   └── stream/route.ts         # POST - streaming RAG query
├── sources/
│   └── [chunkId]/route.ts      # GET source details
├── tasks/
│   ├── route.ts                # GET, POST
│   └── [id]/route.ts           # GET, PUT (update status)
├── documents/
│   ├── upload/route.ts         # POST - file upload
│   └── [id]/route.ts           # GET, DELETE
└── health/route.ts             # Health check
```

### 2.2 RAG API Integration Service

**File: `/src/services/ragService.ts`**

```typescript
interface RAGService {
  // Query endpoints
  query(params: QueryParams): Promise<QueryResponse>;
  streamQuery(params: QueryParams): AsyncGenerator<StreamEvent>;

  // Source endpoints
  getSource(chunkId: string): Promise<SourceDetails>;
  getStatute(section: string): Promise<StatuteWithRules>;
  getRelatedDocs(docId: string): Promise<RelatedDocuments>;

  // Health
  checkHealth(): Promise<HealthStatus>;
}
```

**Key Integration Points:**

1. **Sync Query** (`POST /api/query`)
   - Receives user question + client context
   - Calls RAG API `/api/v1/query`
   - Stores message + response in database
   - Returns formatted response

2. **Streaming Query** (`POST /api/query/stream`)
   - Uses Server-Sent Events (SSE)
   - Proxies RAG API `/api/v1/query/stream`
   - Real-time status updates to frontend
   - Progressive answer display

3. **Source Lookup** (`GET /api/sources/[chunkId]`)
   - Proxies to RAG API `/api/v1/sources/{chunk_id}`
   - Returns full citation text for modals

### 2.3 Request/Response Types

**File: `/src/types/api.ts`**

```typescript
// Query request to our API
interface QueryRequest {
  message: string;
  clientId: string;
  threadId: string;
  options?: {
    docTypes?: ('statute' | 'rule' | 'case' | 'taa')[];
    taxYear?: number;
    expandGraph?: boolean;
    includeReasoning?: boolean;
  };
}

// Response from our API (transformed from RAG)
interface QueryResponse {
  id: string;
  answer: string;
  citations: Citation[];
  sources: Source[];
  confidence: number;
  processingTimeMs: number;
}

// Stream events
type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'reasoning'; step: number; description: string }
  | { type: 'chunk'; chunks: SourceChunk[] }
  | { type: 'answer'; content: string }
  | { type: 'complete'; metadata: QueryMetadata }
  | { type: 'error'; error: string; message: string };
```

---

## Phase 3: Frontend Integration (Week 3-4)

### 3.1 Replace Mock Service with Real API

**File Changes:**

1. **`/src/services/chatService.ts`** - Replace mock with real API calls
   ```typescript
   class RealChatService implements ChatService {
     async sendMessage(request: ChatRequest): Promise<ChatResponse> {
       const response = await fetch('/api/query', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(request),
       });
       return response.json();
     }

     async *streamMessage(request: ChatRequest): AsyncGenerator<StreamEvent> {
       const response = await fetch('/api/query/stream', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(request),
       });
       // Parse SSE stream...
     }
   }
   ```

2. **`/src/context/ChatContext.tsx`** - Update to use server data
   - Replace localStorage with API calls
   - Add proper loading/error states
   - Implement optimistic updates

3. **`/src/app/chat/page.tsx`** - Add auth guards
   - Redirect unauthenticated users
   - Load user's organization data

### 3.2 Streaming UI Updates

**New Components:**
```
/src/app/chat/components/StreamingMessage.tsx  # Progressive answer display
/src/app/chat/components/ReasoningSteps.tsx    # Show RAG reasoning
/src/app/chat/components/SourceChips.tsx       # Clickable source refs
```

**Streaming Flow:**
1. User sends message → Show typing indicator
2. Receive `status` events → Update task progress
3. Receive `reasoning` events → Show in TaskDetail
4. Receive `chunk` events → Preview sources
5. Receive `answer` event → Stream text character by character
6. Receive `complete` event → Finalize message, show confidence

### 3.3 File Upload Implementation

**Flow:**
1. User drags file to ChatInput
2. File uploaded to Supabase Storage via `/api/documents/upload`
3. Document record created in database
4. File reference attached to message/task
5. RAG can access file contents if needed

**Storage Structure:**
```
supabase-storage/
└── documents/
    └── {organization_id}/
        └── {client_id}/
            └── {document_id}/{filename}
```

### 3.4 Real-time Task Updates

**Options:**
1. **Polling** - Simple, check task status every 2s
2. **Supabase Realtime** - WebSocket subscriptions to task table
3. **SSE from RAG** - Already streaming, can include task updates

**Recommended:** Use SSE from RAG for active queries, Supabase Realtime for background tasks.

---

## Phase 4: Security & Compliance (Week 4-5)

### 4.1 Data Security

**SSN Handling:**
- Encrypt SSN at rest using Supabase Vault or application-level encryption
- Never log SSNs
- Mask in UI (show last 4 only)
- Audit all SSN access

**File Security:**
- Signed URLs for document access (expire in 1 hour)
- Virus scanning on upload (ClamAV or cloud service)
- File type validation (allowlist)

### 4.2 Audit Logging

**Log Events:**
- `query.executed` - RAG query with question (not answer)
- `document.viewed` - Document access
- `document.uploaded` - New upload
- `client.created` / `client.updated` - Client changes
- `export.generated` - Data exports
- `auth.login` / `auth.logout` - Authentication events

**Implementation:**
```typescript
// /src/lib/audit.ts
async function logAudit(event: AuditEvent) {
  await supabase.from('audit_log').insert({
    organization_id: event.orgId,
    user_id: event.userId,
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    metadata: event.metadata,
    ip_address: event.ip,
  });
}
```

### 4.3 Rate Limiting

**Implement at API route level:**
```typescript
// /src/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
});
```

### 4.4 Input Validation

**Use Zod for all API inputs:**
```typescript
import { z } from 'zod';

const querySchema = z.object({
  message: z.string().min(3).max(2000),
  clientId: z.string().uuid(),
  threadId: z.string().uuid(),
  options: z.object({
    docTypes: z.array(z.enum(['statute', 'rule', 'case', 'taa'])).optional(),
    taxYear: z.number().min(1990).max(2030).optional(),
  }).optional(),
});
```

---

## Phase 5: Testing & Quality (Week 5-6)

### 5.1 Testing Strategy

**Unit Tests (Vitest):**
```
/src/__tests__/
├── services/
│   ├── ragService.test.ts
│   └── chatService.test.ts
├── lib/
│   ├── chatUtils.test.ts
│   └── validation.test.ts
└── components/
    └── chat/
        └── MessageList.test.tsx
```

**Integration Tests:**
- API route tests with mocked Supabase
- RAG API integration tests (staging environment)

**E2E Tests (Playwright):**
```
/e2e/
├── auth.spec.ts        # Login/signup flows
├── chat.spec.ts        # Chat functionality
├── documents.spec.ts   # Upload/view documents
└── clients.spec.ts     # Client management
```

### 5.2 Error Handling

**Global Error Boundary:**
```typescript
// /src/app/error.tsx
'use client';

export default function Error({ error, reset }) {
  // Log to error tracking service
  // Show user-friendly error UI
}
```

**API Error Responses:**
```typescript
// Consistent error format
interface APIError {
  error: string;      // ERROR_CODE
  message: string;    // Human readable
  details?: object;   // Additional context
}
```

### 5.3 Monitoring Setup

**Services:**
- **Vercel Analytics** - Core web vitals, page performance
- **Sentry** - Error tracking, session replay
- **Supabase Dashboard** - Database metrics, auth analytics

**Custom Metrics:**
- Query latency (P50, P95, P99)
- RAG confidence distribution
- Error rates by type
- Active users, queries per day

---

## Phase 6: Deployment & DevOps (Week 6-7)

### 6.1 Vercel Configuration

**File: `/vercel.json`**
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "RAG_API_BASE_URL": "@rag-api-url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

### 6.2 Environment Strategy

| Environment | Purpose | RAG API | Database |
|-------------|---------|---------|----------|
| Development | Local dev | localhost:8000 | Supabase local |
| Preview | PR previews | Staging RAG | Supabase staging |
| Production | Live app | Production RAG | Supabase prod |

### 6.3 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
# /.github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

### 6.4 Database Migrations

**Using Supabase CLI:**
```bash
# Create migration
supabase migration new add_user_preferences

# Apply migrations
supabase db push

# Generate types
supabase gen types typescript --local > src/types/database.ts
```

---

## Phase 7: Launch Preparation (Week 7-8)

### 7.1 Performance Optimization

**Caching Strategy:**
- RAG responses: Redis cache (1 hour TTL for identical queries)
- Static assets: Vercel Edge caching
- Database: Supabase connection pooling

**Code Splitting:**
- Lazy load heavy components (charts, modals)
- Dynamic imports for chat components
- Optimize bundle size (<150KB first load)

### 7.2 SEO & Marketing Pages

**Public Pages:**
- `/` - Landing page (existing)
- `/features` - Feature details (existing)
- `/pricing` - Pricing tiers (existing)
- `/enterprise` - Enterprise offering (existing)
- `/blog` - Content marketing (new)
- `/docs` - Documentation (new)

### 7.3 Launch Checklist

**Pre-Launch:**
- [ ] Security audit (OWASP top 10)
- [ ] Load testing (target: 100 concurrent users)
- [ ] Backup/restore procedures documented
- [ ] Incident response plan
- [ ] Privacy policy & terms of service
- [ ] GDPR compliance review

**Launch Day:**
- [ ] Enable production environment
- [ ] Monitor error rates
- [ ] Watch RAG API latency
- [ ] Standby for hotfixes

**Post-Launch:**
- [ ] Collect user feedback
- [ ] Monitor analytics
- [ ] Plan iteration cycle

---

## File Structure Summary

```
/src/
├── app/
│   ├── (auth)/                  # Auth pages (login, signup)
│   ├── (marketing)/             # Public pages
│   ├── api/                     # API routes
│   │   ├── auth/callback/
│   │   ├── clients/
│   │   ├── threads/
│   │   ├── query/
│   │   ├── sources/
│   │   ├── tasks/
│   │   └── documents/
│   └── chat/                    # Protected chat app
├── components/
│   ├── auth/                    # Auth components
│   └── ...existing
├── lib/
│   ├── supabase/               # Supabase clients
│   ├── audit.ts                # Audit logging
│   ├── rateLimit.ts            # Rate limiting
│   └── ...existing
├── services/
│   ├── ragService.ts           # RAG API client
│   └── chatService.ts          # Updated chat service
├── types/
│   ├── api.ts                  # API types
│   ├── database.ts             # Generated DB types
│   └── ...existing
└── middleware.ts               # Auth middleware

/supabase/
├── migrations/                  # Database migrations
└── config.toml                 # Local dev config

/.github/
└── workflows/
    └── ci.yml                  # CI/CD pipeline
```

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1. Foundation | Week 1-2 | Supabase setup, DB schema, auth |
| 2. API Layer | Week 2-3 | API routes, RAG integration |
| 3. Frontend | Week 3-4 | Real data, streaming UI |
| 4. Security | Week 4-5 | Encryption, audit, rate limits |
| 5. Testing | Week 5-6 | Unit, integration, E2E tests |
| 6. DevOps | Week 6-7 | CI/CD, environments, deployment |
| 7. Launch | Week 7-8 | Optimization, checklist, go-live |

**Total Estimated Time: 6-8 weeks**

---

## Next Steps

1. **Immediate:** Set up Supabase project and configure environment variables
2. **This Week:** Implement database schema and auth flow
3. **Next Sprint:** Build API routes and RAG integration
4. **Ongoing:** Iterative frontend updates as APIs become available

---

## Dependencies & Packages to Add

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Validation
npm install zod

# Rate Limiting (optional, for production)
npm install @upstash/ratelimit @upstash/redis

# Testing
npm install -D vitest @testing-library/react playwright

# Error Tracking
npm install @sentry/nextjs
```
