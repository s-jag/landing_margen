import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queryRequestSchema, type QueryResponse, type Citation, type Source } from '@/types/api';
import { ragService } from '@/services/ragService';

/**
 * POST /api/query - Execute a synchronous RAG query
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
    const result = queryRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { message, clientId, threadId, options } = result.data;

    // Verify thread belongs to client
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('id, client_id')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Thread not found' }, { status: 404 });
    }

    if (thread.client_id !== clientId) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Thread does not belong to client' }, { status: 403 });
    }

    // Save user message to thread
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        role: 'user',
        content: message,
      });

    if (userMsgError) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: userMsgError.message }, { status: 500 });
    }

    // Execute RAG query
    const ragResponse = await ragService.query(message, options);

    // Transform citations
    const citations: Citation[] = ragResponse.citations.map((c) => ({
      docId: c.doc_id,
      citation: c.citation,
      docType: c.doc_type,
      excerpt: c.text_snippet,
    }));

    // Transform sources
    const sources: Source[] = ragResponse.sources.map((s) => ({
      chunkId: s.chunk_id,
      docId: s.doc_id,
      docType: s.doc_type,
      citation: s.citation,
      text: s.text,
      relevanceScore: s.relevance_score,
    }));

    // Save assistant message with citations
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        role: 'assistant',
        content: ragResponse.answer,
        citations: citations,
      })
      .select()
      .single();

    if (assistantMsgError) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: assistantMsgError.message }, { status: 500 });
    }

    // Update thread timestamp
    await supabase
      .from('threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);

    // Build response
    const response: QueryResponse = {
      id: assistantMsg.id,
      requestId: ragResponse.request_id,
      answer: ragResponse.answer,
      citations,
      sources,
      confidence: ragResponse.confidence,
      processingTimeMs: ragResponse.processing_time_ms,
      warnings: ragResponse.warnings.length > 0 ? ragResponse.warnings : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
