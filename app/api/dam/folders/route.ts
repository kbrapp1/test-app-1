import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedHandler } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { CreateFolderUseCase } from '@/lib/dam/application/use-cases/folders';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { ValidationError, ConflictError, AppError } from '@/lib/errors/base';

interface PostRequestBody {
  name: string;
  parentFolderId?: string | null; // Optional, defaults to null (root)
}

// This is the actual handler that withAuth will call
const createFolderHandler: AuthenticatedHandler = async (
  request: NextRequest,
  user: User,
  supabase: SupabaseClient // Injected by withAuth
) => {
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    // This scenario should ideally be caught by withAuth or a higher-level middleware
    // if an active organization is mandatory for all authenticated routes.
    // However, as a safeguard:
    return NextResponse.json({ message: 'Active organization not found' }, { status: 400 });
  }

  let body: PostRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body: Must be valid JSON' }, { status: 400 });
  }

  const { name, parentFolderId = null } = body; // Default parentFolderId to null if not provided

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ message: 'Folder name is required and must be a non-empty string.' }, { status: 400 });
  }
  if (parentFolderId !== null && typeof parentFolderId !== 'string') {
      return NextResponse.json({ message: 'Invalid parentFolderId format.'}, { status: 400 });
  }

  // Note: SupabaseClient from withAuth might not be the one used by the repository if it creates its own.
  // Pass it to the repository if you want to use the request-scoped client.
  const folderRepository = new SupabaseFolderRepository(supabase); // Pass request-scoped client
  const createFolderUseCase = new CreateFolderUseCase(folderRepository);

  try {
    const newFolder = await createFolderUseCase.execute({
      name: name.trim(),
      parentFolderId,
      organizationId: activeOrgId,
      userId: user.id,
    });
    return NextResponse.json(newFolder, { status: 201 }); // 201 Created
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    if (error instanceof AppError) {
        return NextResponse.json({ message: error.message, code: error.code }, { status: error.statusCode });
    }
    console.error('Error creating folder:', error);
    return NextResponse.json({ message: 'An unexpected error occurred while creating the folder.' }, { status: 500 });
  }
};

// Export the wrapped handler for the POST method
export const POST = withErrorHandling(withAuth(createFolderHandler)); 