-- =============================================================================
-- DOCUMENT EXTRACTION SCHEMA
-- =============================================================================
-- Add extraction fields to documents table for AI-powered data extraction

-- Add extraction status and data columns
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending'
  CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS extracted_data JSONB,
ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS extraction_error TEXT;

-- Index for querying by extraction status
CREATE INDEX IF NOT EXISTS idx_documents_extraction_status ON documents(extraction_status);

-- Comment on columns for documentation
COMMENT ON COLUMN documents.extraction_status IS 'Status of AI data extraction: pending, processing, completed, failed';
COMMENT ON COLUMN documents.extracted_data IS 'JSON object containing extracted financial data from the document';
COMMENT ON COLUMN documents.extracted_at IS 'Timestamp when extraction was completed';
COMMENT ON COLUMN documents.extraction_error IS 'Error message if extraction failed';
