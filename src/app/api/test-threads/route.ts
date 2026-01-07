import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Default user ID for testing (bypasses auth)
const DEFAULT_USER_ID = process.env.TEST_USER_ID || 'test-user-001';

/**
 * GET /api/test-threads - List all threads (NO AUTH - for testing only)
 * Supports query param: ?clientId=xxx to filter by client
 */
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    let query = supabase
      .from('threads')
      .select('*')
      .order('updated_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching threads:', error);
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Test threads GET error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-threads - Create a new thread (NO AUTH - for testing only)
 */
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate required fields
    if (!body.clientId || typeof body.clientId !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Title is required' },
        { status: 400 }
      );
    }

    // Ensure user exists (create if not)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', DEFAULT_USER_ID)
      .single();

    if (!existingUser) {
      // Create test user
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: DEFAULT_USER_ID,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'member',
          preferences: {},
        });

      if (userError && !userError.message.includes('duplicate')) {
        console.error('Error creating user:', userError);
        // Continue anyway - user might exist
      }
    }

    // Create the thread
    const { data, error } = await supabase
      .from('threads')
      .insert({
        client_id: body.clientId,
        user_id: DEFAULT_USER_ID,
        title: body.title,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating thread:', error);
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Test threads POST error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
