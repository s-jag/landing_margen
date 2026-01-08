/**
 * Claude AI Extraction Service
 *
 * Uses Claude API to extract structured financial data from document text.
 * Server-side only - API key is never exposed to the client.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedDocumentData } from '@/types/database';

// Lazy initialization to avoid build-time errors
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

type DocumentType = 'W2' | '1099' | 'Receipt' | 'Prior Return' | 'Other';

/**
 * Build the extraction prompt for Claude
 */
function buildExtractionPrompt(pdfText: string, documentType: DocumentType): string {
  return `You are a tax document data extraction specialist. Extract financial data from the following ${documentType} document.

DOCUMENT TEXT:
${pdfText}

INSTRUCTIONS:
1. Identify and extract all financial values with precision
2. For W-2 forms:
   - Box 1: Wages, tips, other compensation → "wages"
   - Box 2: Federal income tax withheld → "federalWithholding"
   - Box 16: State wages → include in rawFields
   - Box 17: State income tax → "stateWithholding"
3. For 1099 forms:
   - 1099-NEC Box 1: Nonemployee compensation → "businessIncome"
   - 1099-MISC: Various boxes depending on income type → "businessIncome" or "grossIncome"
   - 1099-INT: Interest income → "grossIncome"
   - 1099-DIV: Dividend income → "grossIncome"
4. For receipts:
   - Total amount → include in rawFields as "totalAmount"
   - Categorize the expense type
5. For prior returns:
   - Line 9 (Total income) or Line 11 (AGI) → "grossIncome"
   - Schedule C net profit → "schedCRevenue"
   - Number of dependents if visible → "dependents"
6. Convert all dollar amounts to numbers (remove $, commas)
7. If a value cannot be found or is unclear, use null

RESPOND IN THIS EXACT JSON FORMAT (no additional text, only valid JSON):
{
  "documentType": "${documentType}",
  "confidence": 0.0 to 1.0,
  "extractedData": {
    "grossIncome": number or null,
    "schedCRevenue": number or null,
    "dependents": number or null,
    "wages": number or null,
    "federalWithholding": number or null,
    "stateWithholding": number or null,
    "businessIncome": number or null,
    "businessExpenses": number or null
  },
  "rawFields": {
    "boxLabel": "value"
  }
}`;
}

/**
 * Parse and validate the extraction response from Claude
 */
function parseExtractionResponse(responseText: string, documentType: DocumentType): ExtractedDocumentData {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    return {
      documentType: parsed.documentType || documentType,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      extractedData: {
        grossIncome: normalizeNumber(parsed.extractedData?.grossIncome),
        schedCRevenue: normalizeNumber(parsed.extractedData?.schedCRevenue),
        dependents: normalizeNumber(parsed.extractedData?.dependents),
        wages: normalizeNumber(parsed.extractedData?.wages),
        federalWithholding: normalizeNumber(parsed.extractedData?.federalWithholding),
        stateWithholding: normalizeNumber(parsed.extractedData?.stateWithholding),
        businessIncome: normalizeNumber(parsed.extractedData?.businessIncome),
        businessExpenses: normalizeNumber(parsed.extractedData?.businessExpenses),
      },
      rawFields: parsed.rawFields || {},
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    // Return a default structure on parse failure
    return {
      documentType,
      confidence: 0,
      extractedData: {},
      rawFields: { error: 'Failed to parse AI response' },
    };
  }
}

/**
 * Normalize a value to a number or null
 */
function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$,]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  return null;
}

/**
 * Extract financial data from document text using Claude AI
 *
 * @param pdfText - The extracted text from the PDF
 * @param documentType - The type of document (W2, 1099, etc.)
 * @returns Structured extraction result
 */
export async function extractFinancialData(
  pdfText: string,
  documentType: DocumentType
): Promise<ExtractedDocumentData> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: buildExtractionPrompt(pdfText, documentType),
      },
    ],
  });

  // Extract text content from response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response format from Claude');
  }

  return parseExtractionResponse(content.text, documentType);
}

/**
 * Map extraction result to client field updates
 */
export interface ClientFieldUpdate {
  grossIncome?: number;
  schedCRevenue?: number;
  dependents?: number;
}

export function mapExtractionToClientFields(
  extraction: ExtractedDocumentData,
  documentType: DocumentType
): ClientFieldUpdate {
  const updates: ClientFieldUpdate = {};
  const data = extraction.extractedData;

  switch (documentType) {
    case 'W2':
      // W-2 wages contribute to gross income
      if (data.wages != null) {
        updates.grossIncome = data.wages;
      }
      break;

    case '1099':
      // 1099-NEC/MISC goes to Schedule C revenue
      if (data.businessIncome != null) {
        updates.schedCRevenue = data.businessIncome;
      }
      // Other 1099 types (INT, DIV) go to gross income
      if (data.grossIncome != null) {
        updates.grossIncome = data.grossIncome;
      }
      break;

    case 'Prior Return':
      // Prior returns can set all fields
      if (data.grossIncome != null) {
        updates.grossIncome = data.grossIncome;
      }
      if (data.schedCRevenue != null) {
        updates.schedCRevenue = data.schedCRevenue;
      }
      if (data.dependents != null) {
        updates.dependents = data.dependents;
      }
      break;

    case 'Receipt':
    case 'Other':
      // These don't typically map to client fields directly
      // But include gross income if found
      if (data.grossIncome != null) {
        updates.grossIncome = data.grossIncome;
      }
      break;
  }

  return updates;
}
