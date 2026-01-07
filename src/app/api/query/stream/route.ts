import { createClient } from '@/lib/supabase/server';
import { queryRequestSchema, type Citation } from '@/types/api';
import { ragService } from '@/services/ragService';

/**
 * POST /api/query/stream - Execute a streaming RAG query (SSE)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = queryRequestSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'VALIDATION_ERROR', message: 'Invalid request body', details: result.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({ error: 'NOT_FOUND', message: 'Thread not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (thread.client_id !== clientId) {
      return new Response(
        JSON.stringify({ error: 'FORBIDDEN', message: 'Thread does not belong to client' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'DATABASE_ERROR', message: userMsgError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create streaming response
    const encoder = new TextEncoder();
    let fullAnswer = '';
    const collectedCitations: Citation[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Starting query...' })}\n\n`));

          // Stream RAG response
          for await (const event of ragService.streamQuery(message, options)) {
            // Collect answer content
            if (event.type === 'answer') {
              fullAnswer += event.content;
            }

            // Collect citations from chunk events
            if (event.type === 'chunk') {
              for (const chunk of event.chunks) {
                collectedCitations.push({
                  docId: chunk.chunkId, // Using chunkId as docId since we don't have docId in stream
                  citation: chunk.citation,
                  docType: 'statute', // Default, will be refined when fetching source details
                  excerpt: '',
                });
              }
            }

            // Send event to client
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

            // On completion, save assistant message
            if (event.type === 'complete') {
              // Save assistant message with accumulated content
              await supabase
                .from('messages')
                .insert({
                  thread_id: threadId,
                  role: 'assistant',
                  content: fullAnswer,
                  citations: collectedCitations.length > 0 ? collectedCitations : null,
                });

              // Update thread timestamp
              await supabase
                .from('threads')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', threadId);
            }

            // On error, still try to save partial response
            if (event.type === 'error' && fullAnswer) {
              await supabase
                .from('messages')
                .insert({
                  thread_id: threadId,
                  role: 'assistant',
                  content: fullAnswer + '\n\n[Response interrupted due to error]',
                  citations: collectedCitations.length > 0 ? collectedCitations : null,
                });
            }
          }

          // Send done event
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          // Send error event
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'STREAM_ERROR', message: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream query error:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
