import { ragService } from '@/services/ragService';

/**
 * POST /api/test-query - Direct RAG query (NO AUTH - for testing only)
 *
 * This endpoint bypasses Supabase auth and database operations
 * to test direct connectivity to the FastAPI backend.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'VALIDATION_ERROR', message: 'Query is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create streaming response directly from RAG service
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Connecting to RAG API...' })}\n\n`));

          for await (const event of ragService.streamQuery(query, { includeReasoning: true })) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
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
    console.error('Test query error:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
