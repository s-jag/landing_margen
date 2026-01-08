import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createClientSchema } from '@/types/api';
import { standardLimiter, checkRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/clients - List all clients for the authenticated user's organization
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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
    const search = searchParams.get('search');
    const state = searchParams.get('state');
    const taxYear = searchParams.get('taxYear');

    // Build query
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (state) {
      query = query.eq('state', state);
    }
    if (taxYear) {
      query = query.eq('tax_year', parseInt(taxYear));
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
 * POST /api/clients - Create a new client
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

    // Get or create user's organization
    let { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    // Auto-create organization and user record if needed
    if (!userData?.organization_id) {
      // Use admin client to bypass RLS for organization setup
      const adminClient = createAdminClient();

      // Create a personal organization for the user
      const orgName = user.email ? `${user.email.split('@')[0]}'s Organization` : 'My Organization';
      const orgSlug = `org-${user.id.slice(0, 8)}`;

      const { data: newOrg, error: orgError } = await adminClient
        .from('organizations')
        .insert({
          name: orgName,
          slug: orgSlug,
          plan: 'free',
          settings: {},
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        return NextResponse.json({ error: 'DATABASE_ERROR', message: 'Failed to create organization' }, { status: 500 });
      }

      // Create or update user record with organization
      const { error: userError } = await adminClient
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          organization_id: newOrg.id,
          role: 'owner',
        });

      if (userError) {
        console.error('Error creating user record:', userError);
        return NextResponse.json({ error: 'DATABASE_ERROR', message: 'Failed to link user to organization' }, { status: 500 });
      }

      userData = { organization_id: newOrg.id };
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createClientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Create client
    const { data, error } = await supabase
      .from('clients')
      .insert({
        organization_id: userData.organization_id,
        name: result.data.name,
        state: result.data.state,
        tax_year: result.data.taxYear,
        filing_status: result.data.filingStatus,
        ssn_last_four: result.data.ssnLastFour,
        gross_income: result.data.grossIncome,
        sched_c_revenue: result.data.schedCRevenue,
        dependents: result.data.dependents,
        metadata: result.data.metadata || {},
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
