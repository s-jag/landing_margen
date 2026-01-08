import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapExtractionToClientFields } from '@/lib/claude';
import type { ExtractedDocumentData } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clients/[id]/aggregate-extractions
 * Aggregate extracted data from all documents and update client record
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 1. Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, gross_income, sched_c_revenue, dependents')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Client not found' },
        { status: 404 }
      );
    }

    // 2. Get all completed extractions for this client
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, type, extracted_data, extraction_status')
      .eq('client_id', clientId)
      .eq('extraction_status', 'completed');

    if (docsError) {
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed extractions to aggregate',
        aggregatedValues: {
          grossIncome: client.gross_income || 0,
          schedCRevenue: client.sched_c_revenue || 0,
          dependents: client.dependents || 0,
        },
        documentsProcessed: 0,
      });
    }

    // 3. Aggregate values from all documents
    let totalGrossIncome = 0;
    let totalSchedCRevenue = 0;
    let dependents: number | null = null;
    const processedDocs: Array<{ id: string; type: string; contribution: Record<string, number> }> = [];

    for (const doc of documents) {
      if (!doc.extracted_data) continue;

      const extractedData = doc.extracted_data as ExtractedDocumentData;
      const mapping = mapExtractionToClientFields(
        extractedData,
        doc.type as 'W2' | '1099' | 'Receipt' | 'Prior Return' | 'Other'
      );

      const contribution: Record<string, number> = {};

      // Accumulate gross income (wages from W-2s, other income from 1099s, etc.)
      if (mapping.grossIncome != null) {
        totalGrossIncome += mapping.grossIncome;
        contribution.grossIncome = mapping.grossIncome;
      }

      // Accumulate Schedule C revenue (1099-NEC, business income)
      if (mapping.schedCRevenue != null) {
        totalSchedCRevenue += mapping.schedCRevenue;
        contribution.schedCRevenue = mapping.schedCRevenue;
      }

      // For dependents, take the latest value (usually from prior return)
      if (mapping.dependents != null) {
        dependents = mapping.dependents;
        contribution.dependents = mapping.dependents;
      }

      processedDocs.push({
        id: doc.id,
        type: doc.type,
        contribution,
      });
    }

    // 4. Build update object (only include non-zero values)
    const updateData: Record<string, number> = {};
    if (totalGrossIncome > 0) {
      updateData.gross_income = totalGrossIncome;
    }
    if (totalSchedCRevenue > 0) {
      updateData.sched_c_revenue = totalSchedCRevenue;
    }
    if (dependents != null) {
      updateData.dependents = dependents;
    }

    // 5. Update client if there are values to update
    let updatedClient = client;
    if (Object.keys(updateData).length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update client:', updateError);
        return NextResponse.json(
          { error: 'DATABASE_ERROR', message: 'Failed to update client' },
          { status: 500 }
        );
      }

      updatedClient = updated;
    }

    // 6. Return aggregated results
    return NextResponse.json({
      success: true,
      aggregatedValues: {
        grossIncome: totalGrossIncome,
        schedCRevenue: totalSchedCRevenue,
        dependents: dependents ?? client.dependents ?? 0,
      },
      documentsProcessed: processedDocs.length,
      breakdown: processedDocs,
      client: {
        id: updatedClient.id,
        name: updatedClient.name,
        grossIncome: updatedClient.gross_income,
        schedCRevenue: updatedClient.sched_c_revenue,
        dependents: updatedClient.dependents,
      },
    });

  } catch (error) {
    console.error('Aggregation error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/clients/[id]/aggregate-extractions
 * Get current aggregation status without updating
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get document extraction stats for this client
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, type, extraction_status, extracted_data')
      .eq('client_id', clientId);

    if (error) {
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    const stats = {
      total: documents?.length || 0,
      pending: documents?.filter(d => d.extraction_status === 'pending').length || 0,
      processing: documents?.filter(d => d.extraction_status === 'processing').length || 0,
      completed: documents?.filter(d => d.extraction_status === 'completed').length || 0,
      failed: documents?.filter(d => d.extraction_status === 'failed').length || 0,
    };

    return NextResponse.json({
      clientId,
      extractionStats: stats,
      canAggregate: stats.completed > 0,
    });

  } catch (error) {
    console.error('Get aggregation status error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
