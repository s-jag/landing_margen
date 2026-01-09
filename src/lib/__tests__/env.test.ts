import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Note: We need to be careful testing env.ts since it validates on module load.
// We'll test the helper functions and ensure the module can be imported.

describe('env module', () => {
  // Save original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to allow re-importing with different env
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('exports env object', async () => {
    const { env } = await import('../env');
    expect(env).toBeDefined();
    expect(typeof env).toBe('object');
  });

  it('exports helper functions', async () => {
    const { isServer, isProduction, isDevelopment, isTest, isUpstashConfigured } = await import('../env');

    expect(typeof isServer).toBe('function');
    expect(typeof isProduction).toBe('function');
    expect(typeof isDevelopment).toBe('function');
    expect(typeof isTest).toBe('function');
    expect(typeof isUpstashConfigured).toBe('function');
  });

  describe('isServer', () => {
    it('returns false in jsdom environment (window is defined)', async () => {
      // In jsdom test environment, window is defined, so isServer returns false
      const { isServer } = await import('../env');
      expect(isServer()).toBe(false);
    });
  });

  describe('isTest', () => {
    it('returns true when NODE_ENV is test', async () => {
      const { isTest } = await import('../env');
      expect(isTest()).toBe(true);
    });
  });

  describe('isDevelopment', () => {
    it('returns false when NODE_ENV is test', async () => {
      const { isDevelopment } = await import('../env');
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('isProduction', () => {
    it('returns false when NODE_ENV is test', async () => {
      const { isProduction } = await import('../env');
      expect(isProduction()).toBe(false);
    });
  });

  describe('isUpstashConfigured', () => {
    it('returns false when Upstash env vars are not set', async () => {
      const { isUpstashConfigured } = await import('../env');
      expect(isUpstashConfigured()).toBe(false);
    });
  });

  describe('env values', () => {
    it('has required Supabase values from test setup', async () => {
      const { env } = await import('../env');
      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
      expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-role-key');
    });

    it('has default APP_URL', async () => {
      const { env } = await import('../env');
      expect(env.NEXT_PUBLIC_APP_URL).toBeDefined();
    });

    it('has NODE_ENV set to test', async () => {
      const { env } = await import('../env');
      expect(env.NODE_ENV).toBe('test');
    });
  });

  describe('getServerEnv', () => {
    it('throws error when called from client-side (jsdom)', async () => {
      // In jsdom, window is defined, so getServerEnv should throw
      const { getServerEnv } = await import('../env');
      expect(() => getServerEnv('SUPABASE_SERVICE_ROLE_KEY')).toThrow(
        'Cannot access server environment variable'
      );
    });
  });
});

describe('env validation behavior', () => {
  it('env schema validates required fields', async () => {
    // The module should successfully import with test setup env vars
    const { env } = await import('../env');

    // These are set in the test setup
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeTruthy();
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeTruthy();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
  });

  it('optional fields can be undefined', async () => {
    const { env } = await import('../env');

    // These are optional and not set in test setup
    expect(env.RAG_API_KEY).toBeUndefined();
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.RESEND_API_KEY).toBeUndefined();
  });
});
