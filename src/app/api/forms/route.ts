import { NextResponse } from 'next/server';
import { ragProviderRegistry } from '@/services/rag';
import { UtahRAGProvider } from '@/services/rag/UtahRAGProvider';

/**
 * GET /api/forms
 * List all available tax forms for a state.
 * Currently only Utah supports this endpoint.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateCode = searchParams.get('state') || 'UT';

  // Check if the state supports forms
  const provider = ragProviderRegistry.getProvider(stateCode);
  const capabilities = provider.getCapabilities();

  if (!capabilities.hasTaxForms) {
    return NextResponse.json(
      { error: 'NOT_SUPPORTED', message: `Tax forms not available for state: ${stateCode}` },
      { status: 404 }
    );
  }

  // Utah-specific: fetch forms
  if (provider instanceof UtahRAGProvider) {
    try {
      const forms = await provider.listForms();
      return NextResponse.json({ forms, stateCode });
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      return NextResponse.json(
        { error: 'FETCH_FAILED', message: 'Failed to fetch tax forms' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'Forms not implemented for this provider' },
    { status: 501 }
  );
}
