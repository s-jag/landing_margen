import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createMessageSchema } from '@/types/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/threads/[id]/messages - Get all messages for a thread
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: threadId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);

    // Get messages
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .range(from, to);

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
 * POST /api/threads/[id]/messages - Create a new message in a thread
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: threadId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Create message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        role: result.data.role,
        content: result.data.content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    // Update thread's updated_at timestamp
    await supabase
      .from('threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
