import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ragService } from '@/services/ragService';

interface RouteContext {
  params: Promise<{ chunkId: string }>;
}

/**
 * GET /api/sources/[chunkId] - Get detailed information about a source chunk
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { chunkId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Fetch source details from RAG API
    const sourceDetail = await ragService.getSource(chunkId);

    return NextResponse.json(sourceDetail);
  } catch (error) {
    console.error('Source fetch error:', error);

    // Check if it's a 404 from the RAG API
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
