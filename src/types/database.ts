/**
 * Database types for Supabase
 *
 * These types are manually defined to match the database schema.
 * In production, you can generate these automatically with:
 * `npx supabase gen types typescript --local > src/types/database.ts`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Extracted financial data from document AI processing
 */
export interface ExtractedDocumentData {
  documentType: 'W2' | '1099' | 'Receipt' | 'Prior Return' | 'Other';
  confidence: number;
  extractedData: {
    grossIncome?: number | null;
    schedCRevenue?: number | null;
    dependents?: number | null;
    wages?: number | null;
    federalWithholding?: number | null;
    stateWithholding?: number | null;
    businessIncome?: number | null;
    businessExpenses?: number | null;
  };
  rawFields: Record<string, string | number | null>;
}

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: 'free' | 'pro' | 'enterprise';
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: 'free' | 'pro' | 'enterprise';
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: 'free' | 'pro' | 'enterprise';
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          organization_id: string | null;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'owner' | 'admin' | 'member';
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'owner' | 'admin' | 'member';
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'owner' | 'admin' | 'member';
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          ssn_encrypted: string | null;
          ssn_last_four: string | null;
          state: string;
          tax_year: number;
          filing_status: 'Single' | 'MFJ' | 'MFS' | 'HoH' | 'QW';
          gross_income: number | null;
          sched_c_revenue: number | null;
          dependents: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          ssn_encrypted?: string | null;
          ssn_last_four?: string | null;
          state: string;
          tax_year: number;
          filing_status: 'Single' | 'MFJ' | 'MFS' | 'HoH' | 'QW';
          gross_income?: number | null;
          sched_c_revenue?: number | null;
          dependents?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          ssn_encrypted?: string | null;
          ssn_last_four?: string | null;
          state?: string;
          tax_year?: number;
          filing_status?: 'Single' | 'MFJ' | 'MFS' | 'HoH' | 'QW';
          gross_income?: number | null;
          sched_c_revenue?: number | null;
          dependents?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          type: 'W2' | '1099' | 'Receipt' | 'Prior Return' | 'Other';
          storage_path: string;
          file_size: number | null;
          mime_type: string | null;
          uploaded_by: string | null;
          created_at: string;
          extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
          extracted_data: ExtractedDocumentData | null;
          extracted_at: string | null;
          extraction_error: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          type: 'W2' | '1099' | 'Receipt' | 'Prior Return' | 'Other';
          storage_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          extraction_status?: 'pending' | 'processing' | 'completed' | 'failed';
          extracted_data?: ExtractedDocumentData | null;
          extracted_at?: string | null;
          extraction_error?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          type?: 'W2' | '1099' | 'Receipt' | 'Prior Return' | 'Other';
          storage_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          extraction_status?: 'pending' | 'processing' | 'completed' | 'failed';
          extracted_data?: ExtractedDocumentData | null;
          extracted_at?: string | null;
          extraction_error?: string | null;
        };
      };
      threads: {
        Row: {
          id: string;
          client_id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          citation: Json | null;
          comparison: Json | null;
          rag_request_id: string | null;
          confidence: number | null;
          processing_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          citation?: Json | null;
          comparison?: Json | null;
          rag_request_id?: string | null;
          confidence?: number | null;
          processing_time_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          citation?: Json | null;
          comparison?: Json | null;
          rag_request_id?: string | null;
          confidence?: number | null;
          processing_time_ms?: number | null;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          thread_id: string | null;
          user_id: string;
          client_id: string | null;
          title: string;
          status: 'in_progress' | 'ready' | 'complete' | 'failed';
          current_step: number;
          steps: Json;
          attached_file: string | null;
          rag_request_id: string | null;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          thread_id?: string | null;
          user_id: string;
          client_id?: string | null;
          title: string;
          status?: 'in_progress' | 'ready' | 'complete' | 'failed';
          current_step?: number;
          steps?: Json;
          attached_file?: string | null;
          rag_request_id?: string | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          thread_id?: string | null;
          user_id?: string;
          client_id?: string | null;
          title?: string;
          status?: 'in_progress' | 'ready' | 'complete' | 'failed';
          current_step?: number;
          steps?: Json;
          attached_file?: string | null;
          rag_request_id?: string | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
      };
      audit_log: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_org_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// =============================================================================
// HELPER TYPES
// =============================================================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Organization = Tables<'organizations'>;
export type User = Tables<'users'>;
export type Client = Tables<'clients'>;
export type Document = Tables<'documents'>;
export type Thread = Tables<'threads'>;
export type Message = Tables<'messages'>;
export type Task = Tables<'tasks'>;
export type AuditLog = Tables<'audit_log'>;

// Insert types
export type InsertOrganization = InsertTables<'organizations'>;
export type InsertUser = InsertTables<'users'>;
export type InsertClient = InsertTables<'clients'>;
export type InsertDocument = InsertTables<'documents'>;
export type InsertThread = InsertTables<'threads'>;
export type InsertMessage = InsertTables<'messages'>;
export type InsertTask = InsertTables<'tasks'>;
export type InsertAuditLog = InsertTables<'audit_log'>;

// Update types
export type UpdateOrganization = UpdateTables<'organizations'>;
export type UpdateUser = UpdateTables<'users'>;
export type UpdateClient = UpdateTables<'clients'>;
export type UpdateDocument = UpdateTables<'documents'>;
export type UpdateThread = UpdateTables<'threads'>;
export type UpdateMessage = UpdateTables<'messages'>;
export type UpdateTask = UpdateTables<'tasks'>;

// =============================================================================
// CITATION & COMPARISON TYPES (for JSONB columns)
// =============================================================================

export interface CitationData {
  source: string;
  excerpt: string;
  fullText?: string;
  doc_id?: string;
  doc_type?: 'statute' | 'rule' | 'case' | 'taa';
}

export interface ComparisonOption {
  title: string;
  formula: string;
  result: string;
  recommended?: boolean;
}

export interface ComparisonData {
  options: ComparisonOption[];
}

export interface TaskStep {
  label: string;
  status: 'pending' | 'running' | 'done';
}
