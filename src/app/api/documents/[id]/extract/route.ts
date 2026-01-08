import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromPDF, truncateText } from '@/lib/pdfExtract';
import { extractFinancialData } from '@/lib/claude';
import { strictLimiter, getIdentifier, rateLimitResponse } from '@/lib/rateLimit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/documents/[id]/extract - Extract data from a document using AI
 * Rate limited: 10 requests per minute (uses AI credits)
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: documentId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limit: 10 extractions per minute (AI usage)
    const identifier = getIdentifier(request, user.id);
    const rateLimitResult = await strictLimiter.check(identifier);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'AI extraction service not configured' },
        { status: 500 }
      );
    }

    // 1. Get document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Document not found' },
        { status: 404 }
      );
    }

    // 2. Check if it's a PDF
    if (document.mime_type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'INVALID_TYPE', message: 'Only PDF documents can be extracted' },
        { status: 422 }
      );
    }

    // 3. Check if already extracted
    if (document.extraction_status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Already extracted',
        extractedData: document.extracted_data,
      });
    }

    // 4. Update status to 'processing'
    await supabase
      .from('documents')
      .update({ extraction_status: 'processing', extraction_error: null })
      .eq('id', documentId);

    // 5. Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      await supabase
        .from('documents')
        .update({
          extraction_status: 'failed',
          extraction_error: 'Failed to download document from storage',
        })
        .eq('id', documentId);

      return NextResponse.json(
        { error: 'STORAGE_ERROR', message: 'Failed to download document' },
        { status: 500 }
      );
    }

    // 6. Extract text from PDF
    let pdfText: string;
    try {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const pdfResult = await extractTextFromPDF(buffer);
      pdfText = pdfResult.text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF parsing failed';
      await supabase
        .from('documents')
        .update({
          extraction_status: 'failed',
          extraction_error: errorMessage,
        })
        .eq('id', documentId);

      return NextResponse.json(
        { error: 'EXTRACTION_ERROR', message: errorMessage },
        { status: 422 }
      );
    }

    // Check for minimum text content
    if (pdfText.trim().length < 50) {
      await supabase
        .from('documents')
        .update({
          extraction_status: 'failed',
          extraction_error: 'Insufficient text content. Is this a scanned document?',
        })
        .eq('id', documentId);

      return NextResponse.json(
        { error: 'NO_TEXT', message: 'No extractable text found in PDF' },
        { status: 422 }
      );
    }

    // 7. Truncate text if too long (for token limits)
    const truncatedText = truncateText(pdfText, 8000);

    // 8. Send to Claude for extraction
    let extractionResult;
    try {
      extractionResult = await extractFinancialData(
        truncatedText,
        document.type as 'W2' | '1099' | 'Receipt' | 'Prior Return' | 'Other'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI extraction failed';
      await supabase
        .from('documents')
        .update({
          extraction_status: 'failed',
          extraction_error: errorMessage,
        })
        .eq('id', documentId);

      return NextResponse.json(
        { error: 'AI_ERROR', message: errorMessage },
        { status: 500 }
      );
    }

    // 9. Save extracted data to document
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extraction_status: 'completed',
        extracted_data: extractionResult,
        extracted_at: new Date().toISOString(),
        extraction_error: null,
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to save extraction result:', updateError);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Failed to save extraction result' },
        { status: 500 }
      );
    }

    // 10. Return success with extracted data
    return NextResponse.json({
      success: true,
      documentId,
      extractedData: extractionResult,
    });

  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/[id]/extract - Get extraction status/result
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: documentId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select('id, extraction_status, extracted_data, extracted_at, extraction_error')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      documentId: document.id,
      status: document.extraction_status,
      extractedData: document.extracted_data,
      extractedAt: document.extracted_at,
      error: document.extraction_error,
    });

  } catch (error) {
    console.error('Get extraction error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
