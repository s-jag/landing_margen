import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/[id] - Get a document with signed URL
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Get document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .select('*, clients(name)')
      .eq('id', id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'DATABASE_ERROR', message: dbError.message }, { status: 500 });
    }

    // Generate signed URL for download (valid for 1 hour)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.storage_path, 3600);

    if (urlError) {
      return NextResponse.json({ error: 'STORAGE_ERROR', message: urlError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...document,
      downloadUrl: signedUrl.signedUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id] - Delete a document
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    // Get document to find storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'DATABASE_ERROR', message: fetchError.message }, { status: 500 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with DB deletion even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: dbError.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
