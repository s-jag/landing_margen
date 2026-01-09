/**
 * Vitest Test Setup
 *
 * This file runs before each test file. It:
 * - Extends expect with jest-dom matchers
 * - Mocks Next.js navigation
 * - Sets up MSW for API mocking
 * - Configures global test utilities
 */

import '@testing-library/jest-dom/vitest';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// =============================================================================
// NEXT.JS NAVIGATION MOCKS
// =============================================================================

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  }),
  headers: () => new Headers(),
}));

// =============================================================================
// NEXT/SERVER MOCKS
// =============================================================================

vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: (body: unknown, init?: ResponseInit) => {
        const response = new Response(JSON.stringify(body), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
        });
        return response;
      },
      redirect: (url: string) => Response.redirect(url),
      next: () => new Response(null, { status: 200 }),
    },
  };
});

// =============================================================================
// ENVIRONMENT MOCKS
// =============================================================================

// Set test environment variables
// Note: NODE_ENV is set by vitest, this is a backup for direct test runs
// Using type assertion to avoid readonly error
(process.env as Record<string, string>).NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// =============================================================================
// FETCH MOCK (Basic)
// =============================================================================

// Simple fetch mock for tests that don't use MSW
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Reset fetch mock before each test
beforeAll(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  mockFetch.mockReset();
});

// =============================================================================
// CONSOLE MOCKS (Optional - uncomment to suppress logs in tests)
// =============================================================================

// Suppress console.log in tests (comment out for debugging)
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});

// Keep console.error for debugging test failures
// vi.spyOn(console, 'error').mockImplementation(() => {});

// =============================================================================
// GLOBAL TEST UTILITIES
// =============================================================================

/**
 * Wait for a specified time in tests
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock request for API testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = 'GET', body, headers = {} } = options;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// =============================================================================
// CLEANUP
// =============================================================================

afterAll(() => {
  vi.clearAllMocks();
});
