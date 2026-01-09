# Margen

AI-powered tax research assistant built for speed and accuracy. Margen helps tax professionals prep taxes with intelligent form completion, comprehensive tax code understanding, and audit-ready documentation.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL via Supabase
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **AI Extraction:** Claude API (Anthropic)
- **Rate Limiting:** Upstash Redis
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Validation:** Zod
- **Testing:** Vitest + React Testing Library
- **API Documentation:** OpenAPI/Swagger

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   UPSTASH_REDIS_REST_URL=your_upstash_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

Run the migrations in order in Supabase SQL Editor:
```
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_rls_policies.sql
3. supabase/migrations/003_document_extraction.sql
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (login, signup, forgot-password)
│   ├── api/              # API routes
│   │   ├── clients/      # Client CRUD
│   │   ├── threads/      # Thread & message management
│   │   ├── query/        # RAG query (sync & streaming)
│   │   ├── sources/      # Source chunk lookup
│   │   ├── tasks/        # Task management
│   │   ├── documents/    # Document upload/management
│   │   ├── docs/         # OpenAPI/Swagger documentation
│   │   └── health/       # Health check
│   ├── chat/             # Research assistant interface
│   └── ...
├── components/
│   ├── auth/             # Auth form components
│   ├── chat/             # Chat UI components
│   ├── ErrorBoundary.tsx # Error boundary component
│   ├── error-fallbacks/  # Error fallback UIs
│   ├── features/         # Product mockups & demos
│   ├── layout/           # Header, Footer, Navigation
│   ├── sections/         # Landing page sections
│   └── ui/               # Reusable UI components
├── lib/
│   ├── auth/             # Auth server actions
│   ├── supabase/         # Supabase client utilities
│   ├── retry.ts          # Retry logic with exponential backoff
│   ├── circuitBreaker.ts # Circuit breaker pattern
│   ├── errorLogging.ts   # Structured error logging
│   ├── openapi.ts        # OpenAPI spec generation
│   ├── rateLimit.ts      # API rate limiting utility
│   ├── env.ts            # Environment validation
│   └── utils.ts          # Utility functions
├── services/
│   ├── chatService.ts    # Chat API (sync & streaming)
│   ├── ragService.ts     # RAG API integration
│   └── rag/              # State-specific RAG providers
├── hooks/
│   ├── useAuth.ts        # Authentication hook
│   ├── useAutoScroll.ts  # Auto-scroll for chat
│   └── useLocalStorage.ts # Persistent state
├── context/
│   └── chat/             # Chat state management (5 contexts)
└── types/
    ├── api.ts            # API types & Zod schemas
    ├── database.ts       # Database types
    └── rag.ts            # RAG provider types
```

## API Reference

### Interactive Documentation

API documentation is available via Swagger UI:
- **Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **OpenAPI JSON:** [http://localhost:3000/api/docs/openapi.json](http://localhost:3000/api/docs/openapi.json)

### Authentication
All API routes require authentication via Supabase Auth session cookies.

### Rate Limiting

API endpoints are rate limited using Upstash Redis:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/query`, `/api/query/stream` | 20 requests | 1 minute |
| `/api/clients`, `/api/threads` | 60 requests | 1 minute |
| `/api/documents/upload` | 10 requests | 5 minutes |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Unix timestamp when window resets

When rate limited, the API returns `429 Too Many Requests` with a `Retry-After` header.

### API Resilience

External API calls include automatic retry logic:
- **Exponential Backoff:** Retries with increasing delays (1s, 2s, 4s...)
- **Jitter:** Random delay variation to prevent thundering herd
- **Circuit Breaker:** Prevents cascading failures when services are down
- **Rate Limit Awareness:** Respects Retry-After headers

### Endpoints

#### Clients

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clients` | GET | List clients (paginated) |
| `/api/clients` | POST | Create client |
| `/api/clients/[id]` | GET | Get client by ID |
| `/api/clients/[id]` | PUT | Update client |
| `/api/clients/[id]` | DELETE | Delete client |
| `/api/clients/[id]/documents` | GET | List client documents |

#### Threads & Messages

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/threads` | GET | List threads |
| `/api/threads` | POST | Create thread |
| `/api/threads/[id]` | GET | Get thread |
| `/api/threads/[id]` | DELETE | Delete thread |
| `/api/threads/[id]/messages` | GET | List messages |
| `/api/threads/[id]/messages` | POST | Create message |

#### RAG Query

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/query` | POST | Synchronous RAG query |
| `/api/query/stream` | POST | Streaming RAG query (SSE) |
| `/api/sources/[chunkId]` | GET | Get source details |

#### Documents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/upload` | POST | Upload document (multipart) |
| `/api/documents/[id]` | GET | Get document with signed URL |
| `/api/documents/[id]` | DELETE | Delete document |
| `/api/documents/[id]/extract` | POST | Extract data from PDF using AI |
| `/api/documents/[id]/extract` | GET | Get extraction status/result |

#### Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check API and service health |

## Error Response Format

All API errors follow this format:
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}
}
```

## Key Pages

### Landing Page (`/`)

Marketing page with:
- Hero section with product mockup
- Feature showcases (autocomplete, agent capabilities)
- Social proof & ecosystem partners
- Call to action

### Chat Interface (`/chat`)

Three-panel research assistant with error boundaries:
- **Left:** Client selector + chat history
- **Center:** Conversation with citations
- **Right:** Client context & documents

#### Features
- **Real-time responses** - Progressive text display with blinking cursor
- **Reasoning steps** - Collapsible timeline showing RAG processing
- **Source chips** - Clickable references with relevance scores
- **File upload** - Document type selector with drag-and-drop support
- **Error recovery** - Isolated failures with retry functionality

## Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

**Test Summary:**
- 154 tests across 8 test files
- Core utilities: 100% coverage
- Context reducers: 94-98% coverage

## Security

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

### Highlights

- **SSN Protection:** Only last 4 digits stored (never full SSN)
- **Authentication:** Supabase Auth with JWT tokens
- **Authorization:** Row Level Security (RLS) on all tables
- **Rate Limiting:** Distributed via Upstash Redis
- **Input Validation:** Zod schemas on all inputs
- **Error Handling:** Structured logging, no sensitive data exposure

### Test Endpoints
Test endpoints (`/api/test-*`) are blocked in production (`NODE_ENV=production`).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token |
| `RAG_API_BASE_URL` | No | RAG API URL (default: http://localhost:8000) |
| `RAG_API_KEY` | No | RAG API authentication key |
| `ANTHROPIC_API_KEY` | No | Claude API key for document extraction |
| `RESEND_API_KEY` | No | Resend API key for contact form emails |
| `CONTACT_EMAIL` | No | Email address to receive contact form submissions |

## Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#14120b` | Page background (warm brown) |
| `--color-card` | `#1b1913` | Card backgrounds |
| `--color-accent` | `#f54e00` | Primary actions (orange) |
| `--color-text` | `#edecec` | Primary text (warm white) |

### Spacing

- **Grid (horizontal):** 10px base (`--g`)
- **Vertical rhythm:** 1.4rem base (`--v`)

### Border Radius

- `--radius-xs`: 4px (cards, inputs)
- `--radius-full`: 9999px (buttons)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

## License

Private - All rights reserved.
