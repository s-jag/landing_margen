import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateClientSchema } from '@/types/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clients/[id] - Get a specific client
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Client not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clients/[id] - Update a client
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = updateClientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Build update object with snake_case keys
    const updateData = {
      ...(result.data.name !== undefined && { name: result.data.name }),
      ...(result.data.state !== undefined && { state: result.data.state }),
      ...(result.data.taxYear !== undefined && { tax_year: result.data.taxYear }),
      ...(result.data.filingStatus !== undefined && { filing_status: result.data.filingStatus }),
      ...(result.data.ssnLastFour !== undefined && { ssn_last_four: result.data.ssnLastFour }),
      ...(result.data.grossIncome !== undefined && { gross_income: result.data.grossIncome }),
      ...(result.data.schedCRevenue !== undefined && { sched_c_revenue: result.data.schedCRevenue }),
      ...(result.data.dependents !== undefined && { dependents: result.data.dependents }),
      ...(result.data.metadata !== undefined && { metadata: result.data.metadata }),
    };

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Client not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id] - Delete a client
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
