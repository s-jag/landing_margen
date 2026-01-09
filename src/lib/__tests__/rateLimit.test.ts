import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getClientIdentifier,
  getIdentifier,
  rateLimit,
  rateLimitResponse,
  addRateLimitHeaders,
  isUsingUpstash,
  getRateLimitMode,
  standardLimiter,
  strictLimiter,
  queryLimiter,
  type RateLimitResult,
} from '../rateLimit';

// =============================================================================
// CLIENT IDENTIFIER TESTS
// =============================================================================

describe('getClientIdentifier', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.100, 10.0.0.1' },
    });
    expect(getClientIdentifier(request)).toBe('192.168.1.100');
  });

  it('extracts IP from x-real-ip header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '192.168.1.100' },
    });
    expect(getClientIdentifier(request)).toBe('192.168.1.100');
  });

  it('extracts IP from x-vercel-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-vercel-forwarded-for': '192.168.1.100, proxy' },
    });
    expect(getClientIdentifier(request)).toBe('192.168.1.100');
  });

  it('returns localhost when no IP headers present', () => {
    const request = new Request('http://localhost');
    expect(getClientIdentifier(request)).toBe('localhost');
  });

  it('trims whitespace from IP addresses', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '  192.168.1.100  , 10.0.0.1' },
    });
    expect(getClientIdentifier(request)).toBe('192.168.1.100');
  });
});

describe('getIdentifier', () => {
  it('returns client IP when no userId', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '192.168.1.100' },
    });
    expect(getIdentifier(request)).toBe('192.168.1.100');
  });

  it('combines userId and IP when userId provided', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '192.168.1.100' },
    });
    expect(getIdentifier(request, 'user-123')).toBe('user-123:192.168.1.100');
  });
});

// =============================================================================
// RATE LIMITER TESTS
// =============================================================================

describe('rateLimit factory', () => {
  it('creates a limiter with check method', () => {
    const limiter = rateLimit({ limit: 10, window: '1m', prefix: 'test' });
    expect(limiter).toHaveProperty('check');
    expect(typeof limiter.check).toBe('function');
  });
});

describe('in-memory rate limiter', () => {
  it('allows requests within limit', async () => {
    const limiter = rateLimit({ limit: 5, window: '1m', prefix: 'test-allow' });

    const result = await limiter.check('test-user-1');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
  });

  it('tracks request count correctly', async () => {
    const limiter = rateLimit({ limit: 3, window: '1m', prefix: 'test-count' });

    const result1 = await limiter.check('test-user-2');
    expect(result1.remaining).toBe(2);

    const result2 = await limiter.check('test-user-2');
    expect(result2.remaining).toBe(1);

    const result3 = await limiter.check('test-user-2');
    expect(result3.remaining).toBe(0);
  });

  it('blocks requests when limit exceeded', async () => {
    const limiter = rateLimit({ limit: 2, window: '1m', prefix: 'test-block' });

    await limiter.check('test-user-3');
    await limiter.check('test-user-3');
    const result = await limiter.check('test-user-3');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks different identifiers separately', async () => {
    const limiter = rateLimit({ limit: 2, window: '1m', prefix: 'test-separate' });

    await limiter.check('user-a');
    await limiter.check('user-a');
    const resultA = await limiter.check('user-a');

    const resultB = await limiter.check('user-b');

    expect(resultA.success).toBe(false);
    expect(resultB.success).toBe(true);
  });

  it('returns reset timestamp', async () => {
    const limiter = rateLimit({ limit: 5, window: '1m', prefix: 'test-reset' });

    const result = await limiter.check('test-user-4');
    expect(result.reset).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

// =============================================================================
// RESPONSE HELPERS TESTS
// =============================================================================

describe('rateLimitResponse', () => {
  it('returns 429 status', () => {
    const result: RateLimitResult = {
      success: false,
      limit: 10,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 60,
    };

    const response = rateLimitResponse(result);
    expect(response.status).toBe(429);
  });

  it('includes rate limit headers', () => {
    const result: RateLimitResult = {
      success: false,
      limit: 10,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 60,
    };

    const response = rateLimitResponse(result);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('Retry-After')).toBeDefined();
  });
});

describe('addRateLimitHeaders', () => {
  it('adds rate limit headers to existing response', async () => {
    // Create a mock NextResponse-like object
    const headers = new Headers();
    const mockResponse = {
      headers: {
        set: (key: string, value: string) => headers.set(key, value),
        get: (key: string) => headers.get(key),
      },
    };

    const result: RateLimitResult = {
      success: true,
      limit: 60,
      remaining: 55,
      reset: Math.floor(Date.now() / 1000) + 60,
    };

    // @ts-expect-error - using mock response
    addRateLimitHeaders(mockResponse, result);

    expect(headers.get('X-RateLimit-Limit')).toBe('60');
    expect(headers.get('X-RateLimit-Remaining')).toBe('55');
  });
});

// =============================================================================
// PRE-CONFIGURED LIMITERS TESTS
// =============================================================================

describe('pre-configured limiters', () => {
  it('standardLimiter has correct config', async () => {
    const result = await standardLimiter.check('standard-test');
    expect(result.limit).toBe(60);
  });

  it('strictLimiter has correct config', async () => {
    const result = await strictLimiter.check('strict-test');
    expect(result.limit).toBe(10);
  });

  it('queryLimiter has correct config', async () => {
    const result = await queryLimiter.check('query-test');
    expect(result.limit).toBe(20);
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('isUsingUpstash', () => {
  it('returns false when Redis not configured', () => {
    // In test environment, Upstash is not configured
    expect(isUsingUpstash()).toBe(false);
  });
});

describe('getRateLimitMode', () => {
  it('returns in-memory when Upstash not configured', () => {
    expect(getRateLimitMode()).toBe('in-memory');
  });
});
