import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser/client components.
 * This client respects Row Level Security (RLS) policies.
 *
 * Usage:
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 *
 * const supabase = createClient();
 * const { data } = await supabase.from('clients').select('*');
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
