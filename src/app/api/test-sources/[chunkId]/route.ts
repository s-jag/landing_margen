import { NextResponse } from 'next/server';

// Block test endpoints in production
const isProduction = process.env.NODE_ENV === 'production';

const RAG_API_BASE_URL = process.env.RAG_API_BASE_URL || 'http://localhost:8000';

/**
 * GET /api/test-sources/[chunkId] - Fetch source details (NO AUTH - for testing)
 * BLOCKED IN PRODUCTION
 */
export async function GET(
  request: Request,
  { params }: { params: { chunkId: string } }
) {
  if (isProduction) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  try {
    const { chunkId } = params;

    const response = await fetch(
      `${RAG_API_BASE_URL}/api/v1/sources/${encodeURIComponent(chunkId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'FETCH_ERROR', message: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform to frontend format
    return NextResponse.json({
      chunkId: data.chunk_id,
      docId: data.doc_id,
      docType: data.doc_type,
      citation: data.citation,
      text: data.text,
      textWithAncestry: data.text_with_ancestry,
      ancestry: data.ancestry,
      effectiveDate: data.effective_date,
      level: data.level,
      // Generate a link based on doc type
      link: generateSourceLink(data.doc_type, data.doc_id, data.citation),
    });
  } catch (error) {
    console.error('Source fetch error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateSourceLink(docType: string, docId: string, citation: string): string | null {
  // Generate links to official sources based on document type
  switch (docType) {
    case 'statute':
      // Florida Statutes - extract section number
      const statuteMatch = citation.match(/§\s*([\d.]+)/);
      if (statuteMatch) {
        const section = statuteMatch[1];
        return `http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0200-0299/0212/Sections/0212.${section.split('.')[1] || section}.html`;
      }
      return null;

    case 'rule':
      // Florida Administrative Code
      const ruleMatch = citation.match(/R\.\s*([\d\w.-]+)/);
      if (ruleMatch) {
        return `https://www.flrules.org/gateway/RuleNo.asp?id=${ruleMatch[1]}`;
      }
      return null;

    case 'taa':
      // Technical Assistance Advisements
      return `https://floridarevenue.com/taxes/tips/Pages/default.aspx`;

    default:
      return null;
  }
}
