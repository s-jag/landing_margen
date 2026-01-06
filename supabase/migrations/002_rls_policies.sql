-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies
-- Description: Enables RLS and creates security policies for all tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- HELPER FUNCTION: Get user's organization ID
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- ORGANIZATIONS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their own organization
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = get_user_org_id());

-- Organization owners can update their organization
CREATE POLICY "Owners can update organization"
  ON organizations FOR UPDATE
  USING (id = get_user_org_id())
  WITH CHECK (id = get_user_org_id());

-- Allow insert during signup flow (service role handles this)
CREATE POLICY "Service role can insert organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- USERS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view members of their organization
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (
    organization_id = get_user_org_id()
    OR id = auth.uid()
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow insert during signup (handled by trigger)
CREATE POLICY "Allow insert on signup"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- -----------------------------------------------------------------------------
-- CLIENTS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view clients in their organization
CREATE POLICY "Users can view org clients"
  ON clients FOR SELECT
  USING (organization_id = get_user_org_id());

-- Users can create clients in their organization
CREATE POLICY "Users can create clients"
  ON clients FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

-- Users can update clients in their organization
CREATE POLICY "Users can update org clients"
  ON clients FOR UPDATE
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- Admins and owners can delete clients
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  USING (
    organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- DOCUMENTS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view documents for org clients
CREATE POLICY "Users can view org documents"
  ON documents FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE organization_id = get_user_org_id()
    )
  );

-- Users can upload documents for org clients
CREATE POLICY "Users can upload documents"
  ON documents FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE organization_id = get_user_org_id()
    )
    AND uploaded_by = auth.uid()
  );

-- Users can delete documents they uploaded or if admin
CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
      AND organization_id = get_user_org_id()
    )
  );

-- -----------------------------------------------------------------------------
-- THREADS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view threads they created or in their org
CREATE POLICY "Users can view threads"
  ON threads FOR SELECT
  USING (
    user_id = auth.uid()
    OR client_id IN (
      SELECT id FROM clients WHERE organization_id = get_user_org_id()
    )
  );

-- Users can create threads for org clients
CREATE POLICY "Users can create threads"
  ON threads FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND client_id IN (
      SELECT id FROM clients WHERE organization_id = get_user_org_id()
    )
  );

-- Users can update their own threads
CREATE POLICY "Users can update own threads"
  ON threads FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own threads
CREATE POLICY "Users can delete own threads"
  ON threads FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- MESSAGES POLICIES
-- -----------------------------------------------------------------------------

-- Users can view messages in accessible threads
CREATE POLICY "Users can view thread messages"
  ON messages FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM threads
      WHERE user_id = auth.uid()
      OR client_id IN (
        SELECT id FROM clients WHERE organization_id = get_user_org_id()
      )
    )
  );

-- Users can create messages in their threads
CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT id FROM threads WHERE user_id = auth.uid()
    )
  );

-- Messages are immutable (no update policy)

-- -----------------------------------------------------------------------------
-- TASKS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (user_id = auth.uid());

-- Users can create tasks
CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- AUDIT LOG POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their organization's audit log
CREATE POLICY "Users can view org audit log"
  ON audit_log FOR SELECT
  USING (organization_id = get_user_org_id());

-- Only service role can insert audit logs (bypasses RLS)
-- Regular users cannot insert directly
CREATE POLICY "Service role inserts audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (false); -- Blocks direct inserts, use service role

-- Audit logs are immutable (no update/delete policies)

-- -----------------------------------------------------------------------------
-- STORAGE BUCKET POLICIES (for Supabase Storage)
-- Run these in Supabase Dashboard > Storage > Policies
-- -----------------------------------------------------------------------------

-- Create documents bucket if not exists (run in SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Example storage policies (create via Dashboard):
-- SELECT: organization members can view their org's files
-- INSERT: authenticated users can upload to their org folder
-- DELETE: uploaders can delete their own files
