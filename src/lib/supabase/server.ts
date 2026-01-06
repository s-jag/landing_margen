import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * This client respects Row Level Security (RLS) policies and uses the user's session.
 *
 * Usage in Server Component:
 * ```tsx
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('clients').select('*');
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 * ```
 *
 * Usage in Server Action:
 * ```tsx
 * 'use server';
 * import { createClient } from '@/lib/supabase/server';
 *
 * export async function getClients() {
 *   const supabase = await createClient();
 *   return supabase.from('clients').select('*');
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates an admin Supabase client that bypasses RLS.
 * Only use this for server-side operations that need full access.
 * NEVER expose this client to the browser.
 *
 * Usage:
 * ```tsx
 * import { createAdminClient } from '@/lib/supabase/server';
 *
 * const supabase = createAdminClient();
 * // This bypasses RLS - use with caution
 * const { data } = await supabase.from('audit_log').insert({...});
 * ```
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
