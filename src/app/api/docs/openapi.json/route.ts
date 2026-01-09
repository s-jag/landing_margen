import { NextResponse } from 'next/server';
import { generateOpenAPIDocument } from '@/lib/openapi';

/**
 * GET /api/docs/openapi.json
 *
 * Serves the OpenAPI 3.0 specification document.
 */
export async function GET() {
  const spec = generateOpenAPIDocument();

  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
