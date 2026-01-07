import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createThreadSchema } from '@/types/api';
import { standardLimiter, checkRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/threads - List all threads for the authenticated user
 * Rate limited: 60 requests per minute
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Check rate limit
    const rateLimitError = await checkRateLimit(request, standardLimiter, user.id);
    if (rateLimitError) return rateLimitError;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);

    // Build query
    let query = supabase
      .from('threads')
      .select('*, clients(name)', { count: 'exact' });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('updated_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/threads - Create a new thread
 * Rate limited: 60 requests per minute
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Check rate limit
    const rateLimitError = await checkRateLimit(request, standardLimiter, user.id);
    if (rateLimitError) return rateLimitError;

    // Parse and validate request body
    const body = await request.json();
    const result = createThreadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Create thread
    const { data, error } = await supabase
      .from('threads')
      .insert({
        client_id: result.data.clientId,
        user_id: user.id,
        title: result.data.title,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
