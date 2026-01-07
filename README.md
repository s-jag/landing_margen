# Margen

AI-powered tax research assistant built for speed and accuracy. Margen helps tax professionals prep taxes with intelligent form completion, comprehensive tax code understanding, and audit-ready documentation.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL via Supabase
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Validation:** Zod

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

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
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
│   │   └── health/       # Health check
│   ├── chat/             # Research assistant interface
│   └── ...
├── components/
│   ├── auth/             # Auth form components
│   ├── chat/             # Chat UI components
│   ├── features/         # Product mockups & demos
│   ├── layout/           # Header, Footer, Navigation
│   ├── sections/         # Landing page sections
│   └── ui/               # Reusable UI components
├── lib/
│   ├── auth/             # Auth server actions
│   ├── supabase/         # Supabase client utilities
│   ├── constants.ts      # App constants
│   └── utils.ts          # Utility functions
├── services/
│   └── ragService.ts     # RAG API integration
└── types/
    ├── api.ts            # API types & Zod schemas
    ├── database.ts       # Database types
    └── index.ts          # General TypeScript types
```

## API Reference

### Authentication
All API routes require authentication via Supabase Auth session cookies.

### Clients

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clients` | GET | List clients (paginated) |
| `/api/clients` | POST | Create client |
| `/api/clients/[id]` | GET | Get client by ID |
| `/api/clients/[id]` | PUT | Update client |
| `/api/clients/[id]` | DELETE | Delete client |
| `/api/clients/[id]/documents` | GET | List client documents |

### Threads & Messages

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/threads` | GET | List threads |
| `/api/threads` | POST | Create thread |
| `/api/threads/[id]` | GET | Get thread |
| `/api/threads/[id]` | DELETE | Delete thread |
| `/api/threads/[id]/messages` | GET | List messages |
| `/api/threads/[id]/messages` | POST | Create message |

### RAG Query

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/query` | POST | Synchronous RAG query |
| `/api/query/stream` | POST | Streaming RAG query (SSE) |
| `/api/sources/[chunkId]` | GET | Get source details |

### Tasks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List tasks |
| `/api/tasks` | POST | Create task |
| `/api/tasks/[id]` | GET | Get task |
| `/api/tasks/[id]` | PUT | Update task |
| `/api/tasks/[id]` | DELETE | Delete task |

### Documents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/upload` | POST | Upload document (multipart) |
| `/api/documents/[id]` | GET | Get document with signed URL |
| `/api/documents/[id]` | DELETE | Delete document |

### Health Check

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

Three-panel research assistant:
- **Left:** Client selector + chat history
- **Center:** Conversation with citations
- **Right:** Client context & documents

## Features

- **Audit-ready form completion** - Predictive data entry with traceable accuracy
- **Complete tax code understanding** - Semantic search across IRC sections
- **Multi-model support** - Access to Claude, GPT-4, Gemini, and more
- **Enterprise ready** - Secure, scalable architecture for accounting firms

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `RAG_API_BASE_URL` | No | RAG API URL (default: http://localhost:8000) |
| `RAG_API_KEY` | No | RAG API authentication key |

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

## License

Private - All rights reserved.
