import { NextResponse } from 'next/server';
import { ragProviderRegistry } from '@/services/rag';
import { UtahRAGProvider } from '@/services/rag/UtahRAGProvider';

interface RouteContext {
  params: Promise<{ formNumber: string }>;
}

/**
 * GET /api/forms/[formNumber]
 * Get details about a specific tax form.
 * Currently only Utah supports this endpoint.
 */
export async function GET(request: Request, context: RouteContext) {
  const { formNumber } = await context.params;
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

  // Utah-specific: fetch form details
  if (provider instanceof UtahRAGProvider) {
    try {
      const formInfo = await provider.getFormInfo(formNumber);

      if (!formInfo) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: `Form ${formNumber} not found` },
          { status: 404 }
        );
      }

      return NextResponse.json(formInfo);
    } catch (error) {
      console.error('Failed to fetch form details:', error);
      return NextResponse.json(
        { error: 'FETCH_FAILED', message: 'Failed to fetch form details' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'Form details not implemented for this provider' },
    { status: 501 }
  );
}
