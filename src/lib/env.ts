import { z } from 'zod';

/**
 * Environment variable validation schema.
 * This ensures all required environment variables are present and correctly formatted.
 * The validation runs at module load time, failing fast if configuration is invalid.
 */
const envSchema = z.object({
  // =============================================================================
  // SUPABASE (Required)
  // =============================================================================
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // =============================================================================
  // RAG APIs (Optional with fallbacks)
  // =============================================================================
  RAG_API_BASE_URL: z.string().url().optional(),
  FLORIDA_RAG_API_URL: z.string().url().optional(),
  UTAH_RAG_API_URL: z.string().url().optional(),

  // =============================================================================
  // API Keys (Optional)
  // =============================================================================
  RAG_API_KEY: z.string().optional(),
  FLORIDA_RAG_API_KEY: z.string().optional(),
  UTAH_RAG_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // =============================================================================
  // Upstash Redis (Optional - for production rate limiting)
  // =============================================================================
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // =============================================================================
  // App Configuration
  // =============================================================================
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  CONTACT_EMAIL: z.string().email().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Server-only environment variables that should never be exposed to the client.
 * These are validated separately to ensure they're only accessed server-side.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

/**
 * Validates environment variables at module load time.
 * Throws an error with details if validation fails.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error('❌ Invalid environment variables:');
    Object.entries(errors).forEach(([key, messages]) => {
      console.error(`  ${key}: ${messages?.join(', ')}`);
    });

    // In development, provide helpful guidance
    if (process.env.NODE_ENV === 'development') {
      console.error('\n💡 Tip: Copy .env.example to .env.local and fill in the required values.');
    }

    throw new Error('Invalid environment configuration. See errors above.');
  }

  return result.data;
}

/**
 * Validated environment variables.
 * Access environment variables through this object instead of process.env directly.
 *
 * @example
 * import { env } from '@/lib/env';
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
 */
export const env = validateEnv();

/**
 * Type definition for validated environment variables.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if we're running in a server context.
 * Useful for conditionally accessing server-only env vars.
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Get server-only environment variable.
 * Throws if accessed from client-side code.
 */
export function getServerEnv<K extends keyof z.infer<typeof serverEnvSchema>>(
  key: K
): z.infer<typeof serverEnvSchema>[K] {
  if (!isServer()) {
    throw new Error(`Cannot access server environment variable "${key}" from client-side code`);
  }
  return env[key as keyof Env] as z.infer<typeof serverEnvSchema>[K];
}

/**
 * Check if Upstash Redis is configured for rate limiting.
 */
export function isUpstashConfigured(): boolean {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Check if we're in production environment.
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Check if we're in development environment.
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Check if we're in test environment.
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}
