# Margen Technical Review

**Review Date:** January 2026
**Codebase Version:** Main branch (commit 8144ccd)
**Reviewer:** Claude Code

---

## Executive Summary

### Overall Assessment: B-

Margen is a well-structured Next.js 14 application with a clean separation between marketing pages and the core chat product. The recent Utah RAG integration demonstrates thoughtful architecture through the Provider Registry pattern. However, **the codebase is not production-ready** due to critical gaps in testing, state management complexity, and security concerns.

| Category | Grade | Notes |
|----------|-------|-------|
| Architecture | B+ | Clean separation, good patterns, some monoliths |
| Type Safety | B+ | ~95% coverage, Zod validation present |
| Security | C+ | RLS policies good, but gaps in validation |
| Testing | F | 0% test coverage |
| Code Quality | B | Generally clean, some antipatterns |
| Documentation | C | Inline comments sparse, no API docs |
| Production Readiness | C | In-memory rate limiting, missing env validation |

### Production Readiness Score: 45/100

**Must address before production:**
1. Add test coverage (currently 0%)
2. Replace in-memory rate limiting with Redis
3. Fix environment validation at startup
4. Split ChatContext monolith
5. Fix citation data loss in streaming

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend Analysis](#2-frontend-analysis)
3. [Backend Analysis](#3-backend-analysis)
4. [Database Architecture](#4-database-architecture)
5. [Type Safety Analysis](#5-type-safety-analysis)
6. [Configuration & Infrastructure](#6-configuration--infrastructure)
7. [Critical Issues](#7-critical-issues)
8. [Recommendations](#8-recommendations)
9. [Appendix](#9-appendix)

---

## 1. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Landing   │  │   Features  │  │  Waitlist   │  │      Chat App       │ │
│  │   Page      │  │   Pages     │  │   Form      │  │  (Authenticated)    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS 14 (App Router)                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         MIDDLEWARE LAYER                              │  │
│  │  • Auth verification (Supabase JWT)                                   │  │
│  │  • Route protection (/chat/*, /api/*)                                 │  │
│  │  • Rate limiting (in-memory - PROBLEM)                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │        API ROUTES (18)          │  │      SERVER COMPONENTS          │  │
│  │  /api/chat      (streaming)     │  │  Marketing pages (SSG)          │  │
│  │  /api/clients   (CRUD)          │  │  Chat page (client-side)        │  │
│  │  /api/threads   (CRUD)          │  └─────────────────────────────────┘  │
│  │  /api/documents (upload)        │                                       │
│  │  /api/extract   (PDF → data)    │                                       │
│  │  /api/forms     (Utah forms)    │                                       │
│  │  /api/source    (drill-down)    │                                       │
│  │  /api/waitlist  (leads)         │                                       │
│  │  /api/contact   (inquiries)     │                                       │
│  └─────────────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────────┐
│      SUPABASE         │ │   RAG PROVIDERS   │ │      EXTERNAL APIS        │
│  ┌─────────────────┐  │ │ ┌───────────────┐ │ │  ┌─────────────────────┐  │
│  │   PostgreSQL    │  │ │ │ Florida (8001)│ │ │  │   OpenAI (GPT-4)    │  │
│  │   (8 tables)    │  │ │ │ - Streaming   │ │ │  │   - Document extract│  │
│  │   + 20 RLS      │  │ │ │ - Drill-down  │ │ │  │   - Fallback chat   │  │
│  └─────────────────┘  │ │ └───────────────┘ │ │  └─────────────────────┘  │
│  ┌─────────────────┐  │ │ ┌───────────────┐ │ │  ┌─────────────────────┐  │
│  │     Storage     │  │ │ │ Utah (8000)   │ │ │  │   Anthropic Claude  │  │
│  │   (documents)   │  │ │ │ - Sync only   │ │ │  │   - Primary chat    │  │
│  └─────────────────┘  │ │ │ - Tax forms   │ │ │  └─────────────────────┘  │
│  ┌─────────────────┐  │ │ └───────────────┘ │ └───────────────────────────┘
│  │      Auth       │  │ └───────────────────┘
│  │   (JWT + RLS)   │  │
│  └─────────────────┘  │
└───────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Framework | Next.js | 14.2.35 | App Router, RSC |
| Language | TypeScript | 5.x | Strict mode enabled |
| Styling | Tailwind CSS | 3.4.1 | Custom design system |
| State | React Context | - | useReducer pattern |
| Database | Supabase | - | PostgreSQL + Auth + Storage |
| Validation | Zod | 3.22.4 | **18 versions behind** |
| AI/Chat | Anthropic Claude | - | Primary LLM |
| AI/Extract | OpenAI GPT-4 | - | Document extraction |
| Rate Limiting | Custom | - | **In-memory (problematic)** |

### Key Architectural Decisions

#### Good Decisions

1. **Provider Registry Pattern** (`src/services/rag/RAGProviderRegistry.ts`)
   - Elegant abstraction for multi-state RAG support
   - Capability-based feature detection
   - Easy to add new states

2. **Separation of Marketing and Product**
   - Marketing pages are static/SSG
   - Chat app is fully client-side
   - Clean route boundaries

3. **RLS-First Security Model**
   - All data access controlled at DB level
   - User context embedded in JWT
   - No business logic leakage

#### Questionable Decisions

1. **ChatContext Monolith** (1,196 lines)
   - Single context for all chat state
   - 50+ action types
   - Should be split into domain contexts

2. **In-Memory Rate Limiting**
   - Doesn't work across serverless instances
   - Resets on deployment
   - Must use Redis for production

3. **Client-Side Auth Check as Backup**
   - Middleware should be the only gate
   - Client-side check adds complexity
   - Can cause flash of protected content

---

## 2. Frontend Analysis

### Page Structure

```
src/app/
├── (marketing)/           # Marketing pages (SSG)
│   ├── page.tsx           # Landing page (972 lines - TOO LONG)
│   ├── features/          # Features page
│   ├── enterprise/        # Enterprise page
│   ├── pricing/           # Pricing page
│   ├── resources/         # Resources page
│   ├── contact/           # Contact form
│   └── layout.tsx         # Marketing layout with nav
│
├── chat/                  # Product app (CSR)
│   ├── page.tsx           # Main chat UI (342 lines)
│   └── components/        # Chat-specific components
│
├── login/                 # Auth pages
├── waitlist/              # Waitlist signup
└── api/                   # API routes
```

### Component Architecture

**File Count:** 122 TypeScript/TSX files
**Total Lines:** ~15,000+ lines
**Average Component Size:** ~125 lines

#### Component Breakdown

| Directory | Files | Lines | Purpose |
|-----------|-------|-------|---------|
| `src/app/chat/components/` | 15 | 2,883 | Chat UI components |
| `src/components/ui/` | 8 | 892 | Design system |
| `src/components/marketing/` | 6 | 1,245 | Marketing components |
| `src/context/` | 1 | 1,196 | State management |

#### Critical Component Issues

**1. Landing Page Monolith** (`src/app/(marketing)/page.tsx`)

```typescript
// 972 lines in a single page component
// Contains: Hero, Features, Testimonials, FAQ, CTA, etc.
// PROBLEM: Unmaintainable, not reusable
```

**Recommendation:** Extract into separate components:
- `<HeroSection />`
- `<FeaturesSection />`
- `<TestimonialsSection />`
- `<FAQSection />`
- `<CTASection />`

**2. Button Component Uses Non-Existent Tokens** (`src/components/ui/Button.tsx:23-45`)

```typescript
// Line 23-45: Uses color tokens that don't exist in Tailwind config
const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  // ...
};
// PROBLEM: 'primary' and 'primary-foreground' are not defined
// in tailwind.config.ts, causing fallback to default colors
```

**Recommendation:** Either:
- Add tokens to `tailwind.config.ts`
- Use existing tokens from the design system

**3. ChatContext is a God Object** (`src/context/ChatContext.tsx`)

```typescript
// 1,196 lines in a single context
// 50+ action types in the reducer
// Manages: clients, threads, messages, tasks, streaming, UI state, modals

// Lines 89-257: Action type union with 50+ variants
export type ChatAction =
  | { type: 'SET_SELECTED_CLIENT'; payload: string }
  | { type: 'SET_CLIENT_DROPDOWN_OPEN'; payload: boolean }
  // ... 48 more action types
```

**Recommendation:** Split into focused contexts:
```typescript
// Proposed structure
src/context/
├── ClientContext.tsx    // Client selection, data
├── ThreadContext.tsx    // Thread management
├── MessageContext.tsx   // Messages, streaming
├── TaskContext.tsx      // Async task workflows
└── UIContext.tsx        // Modals, dropdowns, UI state
```

### State Management Deep Dive

**Current Pattern:**
```typescript
// ChatContext.tsx
const [state, dispatch] = useReducer(chatReducer, initialState);

// Problems:
// 1. Every state change re-renders entire tree
// 2. No memoization of selectors
// 3. 50+ action types in single switch statement
```

**Performance Issue Example:**
```typescript
// src/app/chat/components/MessageList.tsx:12
const { messages, streamingContent, reasoningSteps } = useChat();
// Problem: This component re-renders on ANY state change
// Even if only 'clientDropdownOpen' changed
```

**Recommendation:** Use state selectors with memoization:
```typescript
// Better approach
const messages = useChatSelector(state => state.messagesByThread[threadId]);
const streamingContent = useChatSelector(state => state.streamingContent);
```

### Design System Analysis

**CSS Variables** (`src/app/globals.css`):
```css
:root {
  --bg: 250 250 250;
  --card: 255 255 255;
  --text: 10 10 10;
  --text-secondary: 115 115 115;
  --accent: 0 122 255;
  /* ... 20+ tokens */
}
```

**Strengths:**
- Consistent color tokens
- Dark mode support via CSS variables
- Clean semantic naming

**Weaknesses:**
- No design token documentation
- Some components bypass tokens (use raw hex)
- Button variants reference undefined tokens

### Critical Frontend Issues Summary

| Issue | Severity | Location | Impact |
|-------|----------|----------|--------|
| ChatContext monolith | High | `ChatContext.tsx` | Performance, maintainability |
| Button undefined tokens | Medium | `Button.tsx:23-45` | Inconsistent styling |
| Landing page monolith | Medium | `page.tsx` | Maintainability |
| No component tests | Critical | Entire codebase | Quality assurance |
| Missing error boundaries | High | Chat app | User experience |

---

## 3. Backend Analysis

### API Routes Inventory

| Route | Method | Auth | Purpose | Issues |
|-------|--------|------|---------|--------|
| `/api/chat` | POST | Yes | AI chat streaming | Citation loss |
| `/api/clients` | GET/POST | Yes | Client management | - |
| `/api/clients/[id]` | GET/PUT/DELETE | Yes | Single client | - |
| `/api/threads` | GET/POST | Yes | Thread management | - |
| `/api/threads/[id]` | GET/DELETE | Yes | Single thread | - |
| `/api/threads/[id]/messages` | GET/POST | Yes | Thread messages | - |
| `/api/documents/upload` | POST | Yes | File upload | Size limits? |
| `/api/extract` | POST | Yes | PDF extraction | Truncation risk |
| `/api/aggregate` | POST | Yes | Aggregate extractions | - |
| `/api/source/[chunkId]` | GET | Yes | Source drill-down | - |
| `/api/forms` | GET | No | Utah tax forms list | No rate limit |
| `/api/forms/[formNumber]` | GET | No | Single form detail | No rate limit |
| `/api/waitlist` | POST | No | Waitlist signup | Rate limited |
| `/api/contact` | POST | No | Contact form | Rate limited |
| `/api/health` | GET | No | Health check | - |
| `/api/test-rag` | GET | Dev only | RAG testing | NODE_ENV check |
| `/api/debug/context` | GET | Dev only | Debug context | NODE_ENV check |

### Service Layer Architecture

```
src/services/
├── chatService.ts         # Chat orchestration, streaming
├── ragService.ts          # Legacy RAG + state routing
├── clientService.ts       # Client CRUD operations
├── documentService.ts     # Document management
├── extractionService.ts   # PDF extraction (OpenAI)
└── rag/
    ├── index.ts           # Re-exports
    ├── BaseRAGProvider.ts # Abstract base class
    ├── FloridaRAGProvider.ts
    ├── UtahRAGProvider.ts
    └── RAGProviderRegistry.ts
```

#### RAG Provider System (Well Designed)

```typescript
// src/services/rag/RAGProviderRegistry.ts
class RAGProviderRegistry {
  private static instance: RAGProviderRegistry;
  private providers: Map<StateCode, RAGProviderInterface>;

  getProvider(stateCode: string): RAGProviderInterface {
    const normalizedCode = stateCode.toUpperCase();
    if (this.providers.has(normalizedCode as StateCode)) {
      return this.providers.get(normalizedCode as StateCode)!;
    }
    // Fallback to Florida (default)
    return this.providers.get('FL')!;
  }
}
```

**Strengths:**
- Clean abstraction over different RAG APIs
- Capability-based feature detection
- Easy to add new state providers

**Concerns:**
- Singleton pattern may cause issues in serverless
- No provider health monitoring
- Fallback silently uses Florida (should log warning)

#### Chat Service Streaming Issue

**Critical Bug:** Citation data loss in streaming pipeline

```typescript
// src/services/chatService.ts:145-165
function transformUnifiedEvent(event: UnifiedStreamEvent): StreamEvent | null {
  switch (event.type) {
    case 'chunk':
      return {
        type: 'chunk',
        chunks: event.chunks.map(c => ({
          chunkId: c.chunkId || c.docId || '',  // May be undefined
          citation: c.citation,
          relevanceScore: c.relevanceScore,
          // PROBLEM: Utah's authorityLevel, sourceLabel, link are LOST here
        })),
      };
    // ...
  }
}
```

**Impact:** Utah citations lose authority levels and links during transformation.

**Fix:**
```typescript
chunks: event.chunks.map(c => ({
  chunkId: c.chunkId || c.docId || '',
  citation: c.citation,
  relevanceScore: c.relevanceScore,
  authorityLevel: c.authorityLevel,    // Add these
  sourceLabel: c.sourceLabel,          // Add these
  link: c.link,                         // Add these
})),
```

### Authentication & Authorization

**Flow:**
```
1. User authenticates via Supabase Auth
2. JWT stored in cookies (httpOnly)
3. Middleware validates JWT on protected routes
4. API routes extract user from JWT
5. Supabase RLS policies filter data by user_id
```

**Implementation:**
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request, res: response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && protectedPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

**Issues:**

1. **Double Auth Check:** Client-side also checks auth (`src/app/chat/page.tsx:320-325`)
   - Middleware should be sufficient
   - Client check causes flash of loading state

2. **No Session Refresh:** Sessions may expire mid-session
   - Should implement token refresh logic

3. **Missing CSRF Protection:** Forms don't include CSRF tokens
   - Supabase JWT mitigates but not defense in depth

### Rate Limiting Analysis

**Current Implementation:** In-memory rate limiter

```typescript
// src/lib/rateLimit.ts
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function rateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  // ...
}
```

**Problems:**

1. **Doesn't work in serverless:** Each instance has its own Map
2. **Memory leak:** Old entries never cleaned up
3. **Resets on deploy:** All limits reset when new version deploys

**Recommendation:** Use Redis or Upstash for production:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

### API Error Handling

**Pattern Used:**
```typescript
// src/app/api/chat/route.ts
try {
  // ... logic
} catch (error) {
  console.error('Chat API error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

**Issues:**

1. **No error classification:** All errors return 500
2. **No request ID:** Can't trace errors in logs
3. **Leaky error messages:** Some endpoints return error.message directly
4. **No retry logic:** External API failures aren't retried

**Recommendation:** Implement structured error handling:
```typescript
class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public requestId?: string
  ) {
    super(message);
  }
}

function handleAPIError(error: unknown, requestId: string) {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.code, message: error.message, requestId },
      { status: error.statusCode }
    );
  }
  // Log and return generic error
  console.error(`[${requestId}] Unexpected error:`, error);
  return NextResponse.json(
    { error: 'INTERNAL_ERROR', requestId },
    { status: 500 }
  );
}
```

---

## 4. Database Architecture

### Schema Overview

**Tables:** 8 primary tables
**RLS Policies:** 20+ policies
**Migrations:** 4 migration files

```sql
-- Core Tables
users (Supabase Auth)        -- Managed by Supabase
clients                      -- Tax clients
threads                      -- Chat threads
messages                     -- Chat messages
documents                    -- Uploaded documents
extractions                  -- PDF extraction results
waitlist                     -- Marketing waitlist
contact_submissions          -- Contact form entries
```

### Table Schemas

**clients**
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  ssn TEXT, -- CONCERN: Encrypted? Masked?
  gross_income NUMERIC,
  sched_c_revenue NUMERIC,
  dependents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Concern:** SSN storage without explicit encryption. Should use:
- Field-level encryption (pgcrypto)
- Or store encrypted SSN separately
- At minimum, mask in application layer

**threads**
```sql
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations JSONB,
  sources JSONB,
  metadata JSONB, -- forms_mentioned, tax_type, warnings, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Row-Level Security Policies

**Pattern:** All tables use user_id filtering

```sql
-- Example: clients table policies
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);
```

**Strengths:**
- Comprehensive coverage (all CRUD operations)
- Consistent pattern across tables
- CASCADE deletes properly configured

**Concerns:**

1. **No organization/team support:** Current schema only supports single-user access
   - To add teams, need `organization_id` and role-based policies

2. **Thread access via client ownership:** If client is deleted, thread access breaks
   ```sql
   -- threads RLS uses client.user_id for access
   -- But client_id can be SET NULL on delete
   ```

3. **No audit logging:** No record of who accessed/modified data

### Migration Strategy

**Current:** 4 migration files in `supabase/migrations/`

```
supabase/migrations/
├── 20240101000000_initial_schema.sql
├── 20240115000000_add_documents.sql
├── 20240201000000_add_extractions.sql
└── 20240215000000_add_metadata_fields.sql
```

**Issues:**
- No down migrations (can't rollback)
- No migration tests
- Migrations not versioned in sync with code

### Data Flow Patterns

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │───▶│   API   │───▶│ Service │───▶│Supabase │
│ Action  │    │  Route  │    │  Layer  │    │   DB    │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │   Supabase  │
                            │   Client    │
                            │ (with JWT)  │
                            └─────────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │    RLS      │
                            │  Policies   │
                            │  Filter     │
                            └─────────────┘
```

---

## 5. Type Safety Analysis

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Strengths:**
- Strict mode enabled
- Path aliases configured
- Incremental compilation

**Recommendations:**
- Add `noUncheckedIndexedAccess: true` for safer array access
- Add `exactOptionalPropertyTypes: true` for stricter optional handling

### Type Definition Coverage

**Files with types:** ~95%
**Files with `any`:** ~8 occurrences
**Files with `// @ts-ignore`:** 2 occurrences

#### Type Definition Files

```
src/types/
├── api.ts          # API request/response types
├── chat.ts         # Chat domain types
├── rag.ts          # RAG provider types
└── supabase.ts     # Database types
```

#### Well-Typed Areas

**Chat Types** (`src/types/chat.ts`)
```typescript
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citation?: Citation;
  sources?: SourceChip[];
  // Utah-specific fields
  formsMentioned?: string[];
  taxType?: string;
  warnings?: string[];
}
```

**RAG Types** (`src/types/rag.ts`)
```typescript
export interface UnifiedRAGResponse {
  requestId: string;
  response: string;
  citations: UnifiedCitation[];
  confidence: number;
  warnings: string[];
  processingTimeMs: number;
  stateCode: StateCode;
  capabilities: StateCapabilities;
}
```

#### Type Safety Gaps

**1. Untyped External API Responses**

```typescript
// src/services/rag/UtahRAGProvider.ts:89
const data = await response.json(); // Type: any
// Should use:
const data: UtahQueryResponseRaw = await response.json();
```

**2. Unsafe Type Assertions**

```typescript
// src/services/ragService.ts:266
docType: data.doc_type as 'statute' | 'rule' | 'case' | 'taa',
// No runtime validation that doc_type is actually one of these values
```

**3. Missing Database Type Generation**

```typescript
// Should generate types from Supabase schema
// Currently using manually defined types that may drift
```

**Recommendation:** Add Supabase type generation:
```bash
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

### Zod Validation Analysis

**Current Version:** 3.22.4
**Latest Version:** 3.24.1
**Behind by:** 18 versions

**Usage Locations:**
- `src/app/api/waitlist/route.ts` - Waitlist form validation
- `src/app/api/contact/route.ts` - Contact form validation
- `src/app/api/chat/route.ts` - Chat request validation

**Example:**
```typescript
// src/app/api/waitlist/route.ts
const WaitlistSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  role: z.string().optional(),
});
```

**Gaps:**
- Client data not validated with Zod (manual checks)
- Document upload metadata not validated
- Thread creation not validated

**Recommendation:** Add Zod validation to all API inputs:
```typescript
// src/lib/validation.ts
export const ClientSchema = z.object({
  name: z.string().min(1).max(100),
  state: z.string().length(2),
  taxYear: z.number().int().min(2020).max(2030),
  filingStatus: z.enum(['single', 'married_joint', 'married_separate', 'head_of_household']),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/).optional(),
  grossIncome: z.number().nonnegative().optional(),
});
```

---

## 6. Configuration & Infrastructure

### Environment Variables

**Required Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# RAG APIs (optional, have defaults)
RAG_API_BASE_URL=http://localhost:8000
FLORIDA_RAG_API_URL=http://localhost:8001
UTAH_RAG_API_URL=http://localhost:8000
RAG_API_KEY=
```

**Critical Issue:** No environment validation at startup

```typescript
// MISSING: src/lib/env.ts
// Should validate env vars at build/start time

import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  // ... etc
});

export const env = envSchema.parse(process.env);
```

### Build Configuration

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
};

module.exports = nextConfig;
```

**Issues:**
- No bundle analyzer configured
- No security headers
- No image optimization configuration

**Recommendation:**
```javascript
const nextConfig = {
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Bundle optimization
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
};
```

### Dependency Audit

**Total Dependencies:** 32 (23 production, 9 dev)

| Package | Version | Latest | Behind | Risk |
|---------|---------|--------|--------|------|
| next | 14.2.35 | 15.1.x | Minor | Low |
| react | 18.2.0 | 19.0.x | Major | Medium |
| zod | 3.22.4 | 3.24.1 | 18 | Medium |
| @supabase/supabase-js | 2.39.x | 2.47.x | 8 | Low |
| tailwindcss | 3.4.1 | 3.4.17 | Patch | Low |

**Security Vulnerabilities:** None reported (as of audit date)

**Recommendations:**
1. Update Zod to latest (breaking changes minimal)
2. Plan React 19 migration (Server Components improvements)
3. Consider Next.js 15 upgrade for Turbopack stability

### Development vs Production

**Current Approach:**
```typescript
// src/app/api/test-rag/route.ts
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  // ... test code
}
```

**Problems:**
1. **NODE_ENV is not secure:** Can be spoofed
2. **Test endpoints in production bundle:** Code bloat
3. **No staging environment handling:** Only dev/prod

**Recommendation:**
```typescript
// Use separate route files or feature flags
// Move test routes to /api/__test__/ with middleware blocking
```

---

## 7. Critical Issues

### P0: Must Fix Before Production

#### 1. No Test Coverage (Severity: Critical)

**Impact:** No confidence in code correctness, regressions likely
**Files Affected:** Entire codebase
**Effort:** High (2-3 weeks)

**Recommendation:**
```bash
# Add testing infrastructure
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D vitest @vitejs/plugin-react jsdom

# Priority test targets:
# 1. API route handlers
# 2. RAG providers
# 3. ChatContext reducer
# 4. Utility functions
```

#### 2. In-Memory Rate Limiting (Severity: Critical)

**Impact:** Rate limits don't work in serverless, vulnerable to abuse
**File:** `src/lib/rateLimit.ts`
**Effort:** Low (1-2 days)

**Current Code:**
```typescript
const rateLimitMap = new Map(); // Per-instance, not shared
```

**Fix:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

#### 3. Citation Data Loss in Streaming (Severity: High)

**Impact:** Utah authority levels and links not displayed
**File:** `src/services/chatService.ts:145-165`
**Effort:** Low (1 hour)

**Fix:** Add missing fields to transformation:
```typescript
case 'chunk':
  return {
    type: 'chunk',
    chunks: event.chunks.map(c => ({
      chunkId: c.chunkId || c.docId || '',
      citation: c.citation,
      relevanceScore: c.relevanceScore,
      authorityLevel: c.authorityLevel,    // ADD
      sourceLabel: c.sourceLabel,          // ADD
      link: c.link,                         // ADD
      canDrillInto: c.canDrillInto,        // ADD
    })),
  };
```

#### 4. Missing Environment Validation (Severity: High)

**Impact:** Silent failures when env vars missing
**File:** Missing (`src/lib/env.ts`)
**Effort:** Low (2-3 hours)

**Add:**
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),

  // Optional with defaults
  RAG_API_BASE_URL: z.string().url().default('http://localhost:8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

### P1: Should Fix Soon

#### 5. ChatContext Monolith (Severity: Medium)

**Impact:** Performance issues, hard to maintain
**File:** `src/context/ChatContext.tsx`
**Effort:** Medium (1 week)

**Split into:**
- `ClientContext` - Client selection and data
- `ThreadContext` - Thread management
- `StreamContext` - Streaming state
- `UIContext` - Modals, dropdowns

#### 6. SSN Storage Without Encryption (Severity: Medium)

**Impact:** Sensitive data exposure risk
**File:** Database schema, `src/types/chat.ts`
**Effort:** Medium (3-4 days)

**Options:**
1. Field-level encryption with pgcrypto
2. External secrets manager (Vault)
3. Token-based reference to secure store

#### 7. No Error Boundaries (Severity: Medium)

**Impact:** Entire app crashes on component error
**Files:** All page components
**Effort:** Low (1-2 days)

**Add:**
```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

### P2: Technical Debt

#### 8. Button Component Undefined Tokens

**File:** `src/components/ui/Button.tsx:23-45`
**Effort:** Low (1 hour)

#### 9. Landing Page Should Be Componentized

**File:** `src/app/(marketing)/page.tsx`
**Effort:** Medium (1-2 days)

#### 10. No API Documentation

**Files:** All API routes
**Effort:** Medium (2-3 days)

Consider using OpenAPI/Swagger or ts-rest for typed API contracts.

#### 11. No Retry Logic for External APIs

**Files:** RAG providers, AI services
**Effort:** Low (1 day)

Add exponential backoff for transient failures:
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(baseDelay * Math.pow(2, attempt - 1));
    }
  }
  throw new Error('Unreachable');
}
```

---

## 8. Recommendations

### Architecture Improvements

#### 1. Split State Management

**Current:** Single 1,196-line ChatContext
**Proposed:** Domain-focused contexts

```
src/context/
├── providers/
│   ├── ClientProvider.tsx     # Client data, selection
│   ├── ThreadProvider.tsx     # Threads, messages
│   ├── StreamProvider.tsx     # Streaming state
│   └── UIProvider.tsx         # Modals, dropdowns
├── hooks/
│   ├── useClient.ts
│   ├── useThread.ts
│   ├── useStream.ts
│   └── useUI.ts
└── ChatProvider.tsx           # Composes all providers
```

#### 2. Add API Layer Abstraction

```typescript
// src/lib/api/client.ts
class APIClient {
  private baseUrl: string;

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }

    return response.json();
  }
}

// Type-safe endpoint definitions
export const api = {
  clients: {
    list: () => client.request<Client[]>('/api/clients'),
    get: (id: string) => client.request<Client>(`/api/clients/${id}`),
    create: (data: CreateClient) => client.request<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  // ...
};
```

#### 3. Implement Event Sourcing for Messages

Instead of storing messages as static JSON, consider event sourcing for the chat:

```typescript
interface MessageEvent {
  id: string;
  threadId: string;
  type: 'message_started' | 'content_chunk' | 'citation_added' | 'message_completed';
  payload: unknown;
  timestamp: string;
}
```

This enables:
- Replay of message generation
- Better streaming state management
- Audit trail of AI responses

### Code Quality Enhancements

#### 1. Add ESLint Rules

```json
// .eslintrc.json additions
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/exhaustive-deps": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

#### 2. Add Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### 3. Add Husky Pre-Commit Hooks

```bash
npm install -D husky lint-staged

# .husky/pre-commit
npx lint-staged

# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Security Hardening

#### 1. Add Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];
```

#### 2. Add CSRF Protection

```typescript
// Use next-csrf or implement token-based protection
import { csrf } from 'next-csrf';

const { csrfToken, verifyCsrf } = csrf({
  secret: process.env.CSRF_SECRET,
});
```

#### 3. Add Input Sanitization

```typescript
import DOMPurify from 'dompurify';

function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: [],
  });
}
```

### Performance Optimizations

#### 1. Add React Query for Server State

```typescript
// Replace manual fetching with React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => api.clients.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.clients.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
```

#### 2. Implement Virtual Scrolling for Message List

```typescript
// For threads with many messages
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // ...
}
```

#### 3. Add Bundle Analysis

```bash
npm install -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

---

## 9. Appendix

### A. File Metrics

```
Total Files: 122
Total Lines: ~15,000+

By Directory:
src/app/          - 45 files, ~6,000 lines
src/components/   - 25 files, ~2,500 lines
src/context/      - 1 file, 1,196 lines
src/services/     - 12 files, ~2,000 lines
src/types/        - 5 files, ~800 lines
src/hooks/        - 6 files, ~400 lines
src/lib/          - 8 files, ~600 lines
src/config/       - 2 files, ~200 lines
```

### B. Dependency List

**Production Dependencies:**
```
@anthropic-ai/sdk
@supabase/auth-helpers-nextjs
@supabase/supabase-js
clsx
lucide-react
next
openai
react
react-dom
tailwind-merge
zod
```

**Dev Dependencies:**
```
@types/node
@types/react
@types/react-dom
autoprefixer
eslint
eslint-config-next
postcss
tailwindcss
typescript
```

### C. API Endpoint Reference

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `POST /api/chat` | POST | Required | None | Stream chat response |
| `GET /api/clients` | GET | Required | None | List user's clients |
| `POST /api/clients` | POST | Required | None | Create client |
| `GET /api/clients/:id` | GET | Required | None | Get single client |
| `PUT /api/clients/:id` | PUT | Required | None | Update client |
| `DELETE /api/clients/:id` | DELETE | Required | None | Delete client |
| `GET /api/threads` | GET | Required | None | List user's threads |
| `POST /api/threads` | POST | Required | None | Create thread |
| `GET /api/threads/:id` | GET | Required | None | Get thread |
| `DELETE /api/threads/:id` | DELETE | Required | None | Delete thread |
| `GET /api/threads/:id/messages` | GET | Required | None | Get thread messages |
| `POST /api/threads/:id/messages` | POST | Required | None | Add message |
| `POST /api/documents/upload` | POST | Required | None | Upload document |
| `POST /api/extract` | POST | Required | None | Extract PDF data |
| `POST /api/aggregate` | POST | Required | None | Aggregate extractions |
| `GET /api/source/:chunkId` | GET | Required | None | Get source detail |
| `GET /api/forms` | GET | None | None | List Utah tax forms |
| `GET /api/forms/:formNumber` | GET | None | None | Get form detail |
| `POST /api/waitlist` | POST | None | 5/min | Join waitlist |
| `POST /api/contact` | POST | None | 3/min | Submit contact form |
| `GET /api/health` | GET | None | None | Health check |

### D. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | - | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | - | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Supabase service role key |
| `ANTHROPIC_API_KEY` | Yes | - | Anthropic API key |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `RAG_API_BASE_URL` | No | `http://localhost:8000` | Legacy RAG API URL |
| `FLORIDA_RAG_API_URL` | No | `http://localhost:8001` | Florida RAG API URL |
| `UTAH_RAG_API_URL` | No | `http://localhost:8000` | Utah RAG API URL |
| `RAG_API_KEY` | No | - | RAG API authentication key |

---

## Conclusion

Margen has a solid foundation with thoughtful architectural decisions, particularly the RAG Provider Registry pattern and comprehensive RLS policies. However, **critical gaps in testing, security, and infrastructure must be addressed before production deployment**.

**Priority Action Items:**
1. Add test coverage (start with API routes and reducers)
2. Replace in-memory rate limiting with Redis
3. Fix citation data loss in streaming
4. Add environment validation
5. Split ChatContext into focused contexts

With these improvements, the codebase would be production-ready within 2-3 weeks of focused effort.

---

*Generated by Claude Code - January 2026*
