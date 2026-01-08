import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Block test endpoints in production
const isProduction = process.env.NODE_ENV === 'production';

// Default organization ID for testing (bypasses auth)
// Must be a valid UUID format for the database
const DEFAULT_ORG_ID = process.env.TEST_ORGANIZATION_ID || '00000000-0000-0000-0000-000000000001';

/**
 * GET /api/test-clients - List all clients (NO AUTH - for testing only)
 * BLOCKED IN PRODUCTION
 */
export async function GET() {
  if (isProduction) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Test clients GET error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-clients - Create a new client (NO AUTH - for testing only)
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
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.state || typeof body.state !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'State is required' },
        { status: 400 }
      );
    }

    const validFilingStatuses = ['Single', 'MFJ', 'MFS', 'HoH', 'QW'];
    if (!body.filingStatus || !validFilingStatuses.includes(body.filingStatus)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Valid filing status is required (Single, MFJ, MFS, HoH, QW)' },
        { status: 400 }
      );
    }

    // First, ensure the organization exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', DEFAULT_ORG_ID)
      .single();

    if (!existingOrg) {
      // Create the test organization if it doesn't exist
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({
          id: DEFAULT_ORG_ID,
          name: 'Test Organization',
          slug: 'test-org',
          plan: 'free',
          settings: {},
        });

      if (orgError && !orgError.message.includes('duplicate')) {
        console.error('Error creating org:', orgError);
        return NextResponse.json(
          { error: 'DATABASE_ERROR', message: 'Failed to create organization' },
          { status: 500 }
        );
      }
    }

    // Create the client
    const { data, error } = await supabase
      .from('clients')
      .insert({
        organization_id: DEFAULT_ORG_ID,
        name: body.name,
        state: body.state,
        tax_year: body.taxYear || new Date().getFullYear(),
        filing_status: body.filingStatus,
        ssn_last_four: body.ssnLastFour || null,
        gross_income: body.grossIncome || null,
        sched_c_revenue: body.schedCRevenue || null,
        dependents: body.dependents || 0,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Test clients POST error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
