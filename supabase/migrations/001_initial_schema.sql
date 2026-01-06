-- =============================================================================
-- MARGEN DATABASE SCHEMA
-- Migration: 001_initial_schema
-- Description: Creates all core tables for the Margen tax research platform
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ORGANIZATIONS (CPA Firms)
-- -----------------------------------------------------------------------------
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'CPA firms and accounting organizations';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN organizations.plan IS 'Subscription tier: free, pro, or enterprise';

-- -----------------------------------------------------------------------------
-- USERS (Tax Professionals)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Tax professionals using the platform';
COMMENT ON COLUMN users.role IS 'User role within their organization';

-- -----------------------------------------------------------------------------
-- CLIENTS (Taxpayers)
-- -----------------------------------------------------------------------------
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ssn_encrypted TEXT, -- Encrypted SSN, last 4 visible
  ssn_last_four TEXT, -- Last 4 digits for display
  state TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL CHECK (filing_status IN ('Single', 'MFJ', 'MFS', 'HoH', 'QW')),
  gross_income DECIMAL(15,2),
  sched_c_revenue DECIMAL(15,2) DEFAULT 0,
  dependents INTEGER DEFAULT 0 CHECK (dependents >= 0),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clients IS 'Taxpayer clients managed by organizations';
COMMENT ON COLUMN clients.ssn_encrypted IS 'AES-256 encrypted SSN';
COMMENT ON COLUMN clients.filing_status IS 'Single, MFJ (Married Filing Jointly), MFS, HoH (Head of Household), QW (Qualifying Widow)';

-- Create index for organization queries
CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_clients_tax_year ON clients(tax_year);
CREATE INDEX idx_clients_state ON clients(state);

-- -----------------------------------------------------------------------------
-- DOCUMENTS (Client Files)
-- -----------------------------------------------------------------------------
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('W2', '1099', 'Receipt', 'Prior Return', 'Other')),
  storage_path TEXT NOT NULL, -- Supabase Storage path
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE documents IS 'Tax documents uploaded for clients';
COMMENT ON COLUMN documents.storage_path IS 'Path in Supabase Storage bucket';

CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_type ON documents(type);

-- -----------------------------------------------------------------------------
-- THREADS (Chat Conversations)
-- -----------------------------------------------------------------------------
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE threads IS 'Chat conversation threads about specific clients';

CREATE INDEX idx_threads_client ON threads(client_id);
CREATE INDEX idx_threads_user ON threads(user_id);
CREATE INDEX idx_threads_updated ON threads(updated_at DESC);

-- -----------------------------------------------------------------------------
-- MESSAGES (Chat Messages)
-- -----------------------------------------------------------------------------
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citation JSONB, -- {source, excerpt, fullText, doc_id, doc_type}
  comparison JSONB, -- {options: [{title, formula, result, recommended}]}
  rag_request_id TEXT, -- Link to RAG API request for debugging
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE messages IS 'Individual messages within chat threads';
COMMENT ON COLUMN messages.citation IS 'Source citation data from RAG system';
COMMENT ON COLUMN messages.rag_request_id IS 'Request ID from RAG API for tracing';

CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- -----------------------------------------------------------------------------
-- TASKS (Async Workflows)
-- -----------------------------------------------------------------------------
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'ready', 'complete', 'failed')),
  current_step INTEGER DEFAULT 0,
  steps JSONB NOT NULL DEFAULT '[]', -- [{label, status: 'pending'|'running'|'done'}]
  attached_file TEXT,
  rag_request_id TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE tasks IS 'Async research tasks and workflows';
COMMENT ON COLUMN tasks.steps IS 'Array of task steps with their status';

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_started ON tasks(started_at DESC);

-- -----------------------------------------------------------------------------
-- AUDIT LOG
-- -----------------------------------------------------------------------------
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT, -- client, document, thread, query, etc.
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'Audit trail for compliance and debugging';
COMMENT ON COLUMN audit_log.action IS 'Action type: query, view_document, export, login, etc.';

CREATE INDEX idx_audit_org ON audit_log(organization_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);

-- -----------------------------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- HELPER FUNCTION: Create user profile on signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when auth.users row is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
