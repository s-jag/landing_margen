import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Block test endpoints in production
const isProduction = process.env.NODE_ENV === 'production';

/**
 * GET /api/test-messages - List messages for a thread (NO AUTH - for testing only)
 * BLOCKED IN PRODUCTION
 * Requires query param: ?threadId=xxx
 */
export async function GET(request: Request) {
  if (isProduction) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Test messages GET error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-messages - Create a new message (NO AUTH - for testing only)
 * BLOCKED IN PRODUCTION
 */
export async function POST(request: Request) {
  if (isProduction) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate required fields
    if (!body.threadId || typeof body.threadId !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Thread ID is required' },
        { status: 400 }
      );
    }

    if (!body.role || !['user', 'assistant', 'system'].includes(body.role)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Valid role is required (user, assistant, system)' },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Content is required' },
        { status: 400 }
      );
    }

    // Create the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_id: body.threadId,
        role: body.role,
        content: body.content,
        citation: body.citation || null,
        comparison: body.comparison || null,
        rag_request_id: body.ragRequestId || null,
        confidence: body.confidence || null,
        processing_time_ms: body.processingTimeMs || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    // Update thread's updated_at timestamp
    await supabase
      .from('threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', body.threadId);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Test messages POST error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
