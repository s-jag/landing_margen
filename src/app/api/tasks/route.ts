import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTaskSchema } from '@/types/api';

/**
 * GET /api/tasks - List all tasks for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);

    // Build query
    let query = supabase
      .from('tasks')
      .select('*, clients(name)', { count: 'exact' });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

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
 * POST /api/tasks - Create a new task
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Create task
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        client_id: result.data.clientId,
        thread_id: result.data.threadId,
        title: result.data.title,
        steps: result.data.steps || [],
        attached_file: result.data.attachedFile,
        status: 'in_progress',
        current_step: 0,
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
