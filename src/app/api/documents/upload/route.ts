import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { documentTypeSchema } from '@/types/api';

/**
 * POST /api/documents/upload - Upload a document file
 *
 * Expects multipart/form-data with:
 * - file: The file to upload
 * - clientId: UUID of the client
 * - name: Display name for the document
 * - type: Document type (W2, 1099, Receipt, Prior Return, Other)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const clientId = formData.get('clientId') as string | null;
    const name = formData.get('name') as string | null;
    const type = formData.get('type') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'File is required' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'clientId is required' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'name is required' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'type is required' }, { status: 400 });
    }

    // Validate document type
    const typeResult = documentTypeSchema.safeParse(type);
    if (!typeResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid document type', details: typeResult.error.flatten() },
        { status: 400 }
      );
    }

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Client not found' }, { status: 404 });
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Validate file type
    const ALLOWED_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid file type. Allowed: PDF, JPEG, PNG, GIF, DOC, DOCX' },
        { status: 400 }
      );
    }

    // Generate storage path
    const fileExt = file.name.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    const storagePath = `${clientId}/${timestamp}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'STORAGE_ERROR', message: uploadError.message }, { status: 500 });
    }

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        client_id: clientId,
        name: name,
        type: typeResult.data,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      // Try to clean up uploaded file on DB error
      await supabase.storage.from('documents').remove([storagePath]);
      return NextResponse.json({ error: 'DATABASE_ERROR', message: dbError.message }, { status: 500 });
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
