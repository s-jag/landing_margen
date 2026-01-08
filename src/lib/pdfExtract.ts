/**
 * PDF Text Extraction Utility
 *
 * Extracts text content from PDF documents for AI processing.
 * Uses pdf-parse for digital/text-based PDFs.
 */

// pdf-parse uses CommonJS exports
/* eslint-disable */
const pdf = require('pdf-parse');
/* eslint-enable */

export interface PDFTextResult {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
}

export interface PDFExtractionError {
  code: 'EMPTY_PDF' | 'PARSE_ERROR' | 'NO_TEXT';
  message: string;
}

/**
 * Extract text content from a PDF buffer
 *
 * @param buffer - The PDF file as a Buffer
 * @returns Extracted text and metadata
 * @throws PDFExtractionError if extraction fails
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<PDFTextResult> {
  try {
    const data = await pdf(buffer);

    // Check if we got any text
    if (!data.text || data.text.trim().length === 0) {
      const error: PDFExtractionError = {
        code: 'NO_TEXT',
        message: 'No extractable text found in PDF. This may be a scanned document.',
      };
      throw error;
    }

    return {
      text: data.text,
      numPages: data.numpages,
      info: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
      },
    };
  } catch (error) {
    // Re-throw our custom errors
    if ((error as PDFExtractionError).code) {
      throw error;
    }

    // Wrap other errors
    const extractionError: PDFExtractionError = {
      code: 'PARSE_ERROR',
      message: error instanceof Error ? error.message : 'Failed to parse PDF',
    };
    throw extractionError;
  }
}

/**
 * Check if a buffer appears to be a valid PDF
 *
 * @param buffer - The file buffer to check
 * @returns true if the buffer starts with PDF magic bytes
 */
export function isPDFBuffer(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  return buffer.length >= 5 && buffer.toString('utf8', 0, 5) === '%PDF-';
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum character length (default 10000 for token limits)
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 10000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}
