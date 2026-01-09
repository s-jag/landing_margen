# Security Documentation

## Overview

This document outlines the security measures, data handling practices, and design decisions in the Margen application.

---

## Sensitive Data Handling

### Social Security Numbers (SSN)

**Design Decision: Last-4-Only Storage**

Margen intentionally stores only the last 4 digits of Social Security Numbers. This is a deliberate security design, not a limitation.

#### Implementation

| Layer | Field | Format |
|-------|-------|--------|
| API | `ssnLastFour` | 4 digits |
| Database | `ssn_last_four` | VARCHAR(4) |
| Frontend | Display | `•••-••-XXXX` |

#### Data Flow

```
User Input: ***-**-1234
     ↓
API Validation: Only accepts 4 digits
     ↓
Database: Stores "1234"
     ↓
Display: Renders "•••-••-1234"
```

#### Rationale

1. **Minimized Attack Surface**: Full SSNs are never transmitted or stored
2. **Reduced Compliance Scope**: Fewer PCI/SOC2 requirements apply
3. **Sufficient for Verification**: Last 4 digits adequate for client identification
4. **Zero Breach Risk**: Even if data is compromised, full SSNs cannot be reconstructed

#### Future Considerations

The database schema includes an unused `ssn_encrypted` field, reserved for potential e-filing integration. If full SSN storage is ever required:

- Encryption: AES-256-GCM
- Key Management: AWS KMS or similar HSM
- Access Controls: Strict audit logging
- Retention: Minimum necessary period

---

## API Security

### Rate Limiting

All API endpoints are protected by Upstash Redis-based rate limiting:

| Tier | Limit | Window |
|------|-------|--------|
| Default | 100 requests | 15 seconds |
| Authenticated | 200 requests | 15 seconds |

Configuration: `src/lib/rateLimit.ts`

### Authentication

- Supabase Auth with JWT tokens
- Server-side session validation
- Protected routes via middleware (`src/middleware.ts`)

### Input Validation

All API inputs are validated using Zod schemas:

```typescript
// Example: Client creation
const ClientCreateSchema = z.object({
  name: z.string().min(1).max(100),
  state: z.enum(['FL', 'UT', ...]),
  ssnLastFour: z.string().regex(/^\d{4}$/),
  // ...
});
```

---

## External API Security

### Retry Logic

External API calls include:
- Exponential backoff with jitter
- Circuit breaker pattern to prevent cascade failures
- Rate limit header awareness

Configuration: `src/lib/retry.ts`, `src/lib/circuitBreaker.ts`

### API Keys

All API keys are stored as environment variables:
- `ANTHROPIC_API_KEY` - Claude AI extraction
- `RAG_API_KEY` - Florida tax law API
- `UTAH_RAG_API_KEY` - Utah tax law API

Never exposed to client-side code.

---

## Error Handling

### Error Boundaries

React error boundaries prevent full application crashes:

```
ChatPage
└── ErrorBoundary (page-level)
    └── ChatProviders
        └── ChatContent
            ├── ErrorBoundary (left sidebar)
            ├── ErrorBoundary (center panel)
            └── ErrorBoundary (right sidebar)
            └── Modals (each with own boundary)
```

### Error Logging

Errors are logged with:
- Severity classification
- Component stack traces
- Structured context for debugging

Prepared for integration with external services (Sentry, Datadog).

---

## Environment Variables

### Required Variables

```bash
# Authentication
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AI Services
ANTHROPIC_API_KEY=

# RAG APIs
RAG_API_BASE_URL=
RAG_API_KEY=
UTAH_RAG_API_BASE_URL=
UTAH_RAG_API_KEY=
```

### Validation

Environment variables are validated at startup:
- Missing required variables cause build failure
- Type validation via Zod schemas

Configuration: `src/lib/env.ts`

---

## Content Security

### CORS

API routes configured with appropriate CORS headers for production deployment.

### XSS Prevention

- React's built-in escaping for rendered content
- Markdown rendered with sanitization
- No `dangerouslySetInnerHTML` without sanitization

### SQL Injection

- Supabase client uses parameterized queries
- No raw SQL string interpolation

---

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public GitHub issue
2. Email security concerns to the project maintainers
3. Provide detailed reproduction steps
4. Allow reasonable time for a fix before disclosure

---

## Changelog

| Date | Change |
|------|--------|
| 2024-01 | Initial security documentation |
| 2024-01 | Added rate limiting |
| 2024-01 | Added retry logic and circuit breakers |
| 2024-01 | Added error boundaries |
