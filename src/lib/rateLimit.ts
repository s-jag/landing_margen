/**
 * Rate Limiting Utility
 *
 * Provides rate limiting for API routes using a sliding window algorithm.
 * Uses in-memory storage by default, can be upgraded to Redis for production.
 *
 * Usage:
 *   import { rateLimit, RateLimitConfig } from '@/lib/rateLimit';
 *
 *   const limiter = rateLimit({ limit: 10, window: '10s' });
 *   const result = await limiter.check(identifier);
 *   if (!result.success) return rateLimitResponse(result);
 */

import { NextResponse } from 'next/server';

// =============================================================================
// TYPES
// =============================================================================

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window (e.g., '10s', '1m', '1h') */
  window: string;
  /** Optional prefix for rate limit keys */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the window resets
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// =============================================================================
// IN-MEMORY STORE
// =============================================================================

class InMemoryStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.store.forEach((entry, key) => {
      if (entry.resetAt < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.store.delete(key));
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton store instance
const store = new InMemoryStore();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse window string to milliseconds
 * Supports: '10s', '1m', '5m', '1h', '1d'
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid window format: ${window}. Use format like '10s', '1m', '1h'`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Get client identifier from request
 * Uses IP address, falling back to a default for development
 */
export function getClientIdentifier(request: Request): string {
  // Try various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }

  // Fallback for development
  return 'localhost';
}

/**
 * Get identifier combining client IP and user ID (if authenticated)
 */
export function getIdentifier(request: Request, userId?: string): string {
  const clientIp = getClientIdentifier(request);
  return userId ? `${userId}:${clientIp}` : clientIp;
}

// =============================================================================
// RATE LIMITER
// =============================================================================

export interface RateLimiter {
  check(identifier: string): Promise<RateLimitResult>;
}

/**
 * Create a rate limiter with the given configuration
 */
export function rateLimit(config: RateLimitConfig): RateLimiter {
  const { limit, window, prefix = 'rl' } = config;
  const windowMs = parseWindow(window);

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const key = `${prefix}:${identifier}`;
      const now = Date.now();

      let entry = store.get(key);

      if (!entry || entry.resetAt < now) {
        // Create new window
        entry = {
          count: 1,
          resetAt: now + windowMs,
        };
        store.set(key, entry);

        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: Math.floor(entry.resetAt / 1000),
        };
      }

      // Increment existing window
      entry.count++;
      store.set(key, entry);

      const remaining = Math.max(0, limit - entry.count);
      const success = entry.count <= limit;

      return {
        success,
        limit,
        remaining,
        reset: Math.floor(entry.resetAt / 1000),
      };
    },
  };
}

// =============================================================================
// PRE-CONFIGURED LIMITERS
// =============================================================================

/**
 * Standard API rate limiter: 60 requests per minute
 */
export const standardLimiter = rateLimit({
  limit: 60,
  window: '1m',
  prefix: 'api',
});

/**
 * Strict rate limiter for expensive operations: 10 requests per minute
 */
export const strictLimiter = rateLimit({
  limit: 10,
  window: '1m',
  prefix: 'strict',
});

/**
 * Query rate limiter for RAG queries: 20 requests per minute
 */
export const queryLimiter = rateLimit({
  limit: 20,
  window: '1m',
  prefix: 'query',
});

/**
 * Upload rate limiter: 10 uploads per 5 minutes
 */
export const uploadLimiter = rateLimit({
  limit: 10,
  window: '5m',
  prefix: 'upload',
});

/**
 * Auth rate limiter: 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  limit: 5,
  window: '15m',
  prefix: 'auth',
});

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter: result.reset - Math.floor(Date.now() / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  return response;
}

// =============================================================================
// MIDDLEWARE HELPER
// =============================================================================

/**
 * Check rate limit and return error response if exceeded
 * Returns null if rate limit is OK
 */
export async function checkRateLimit(
  request: Request,
  limiter: RateLimiter = standardLimiter,
  userId?: string
): Promise<NextResponse | null> {
  const identifier = getIdentifier(request, userId);
  const result = await limiter.check(identifier);

  if (!result.success) {
    return rateLimitResponse(result);
  }

  return null;
}
