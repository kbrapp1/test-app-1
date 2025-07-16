import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedHandler } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { getActiveOrganizationId } from '@/lib/auth';
import { DeleteFolderUseCase, UpdateFolderUseCase } from '@/lib/dam/application/use-cases/folders';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { ValidationError, NotFoundError, ConflictError, AppError } from '@/lib/errors/base';

interface PatchRequestBody {
  name?: string;
  parentFolderId?: string | null;
}

interface RouteContext {
  params: Promise<{
    folderId?: string;
  }>;
}

const createUpdateFolderHandler = (folderId: string, activeOrgId: string, updates: PatchRequestBody): AuthenticatedHandler => {
  return async (_request: NextRequest, _user: User, supabase: SupabaseClient) => {
    const folderRepository = new SupabaseFolderRepository(supabase);
    const updateUseCase = new UpdateFolderUseCase(folderRepository);

    try {
      const updatedFolder = await updateUseCase.execute({
        folderId,
        organizationId: activeOrgId,
        name: updates.name,
        parentFolderId: updates.parentFolderId,
      });
      return NextResponse.json(updatedFolder, { status: 200 });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message, code: error.code }, { status: error.statusCode });
      }
      console.error(`Error updating folder ${folderId}:`, error);
      return NextResponse.json({ message: 'An unexpected error occurred while updating the folder.' }, { status: 500 });
    }
  };
};

export const PATCH = async (request: NextRequest, context: RouteContext) => {
  const { params } = context;
  const folderId = (await params).folderId;

  if (!folderId) {
    return NextResponse.json({ message: 'Folder ID is required in the path.' }, { status: 400 });
  }

  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    return NextResponse.json({ message: 'Active organization not found.' }, { status: 400 });
  }

  let body: PatchRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body: Must be valid JSON.' }, { status: 400 });
  }

  if (Object.keys(body).length === 0 || (body.name === undefined && body.parentFolderId === undefined)) {
    return NextResponse.json({ message: 'No update data provided. Provide at least name or parentFolderId.' }, { status: 400 });
  }
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      return NextResponse.json({ message: 'Folder name, if provided, must be a non-empty string.'}, { status: 400 });
  }
  if (body.parentFolderId !== undefined && body.parentFolderId !== null && typeof body.parentFolderId !== 'string') {
      return NextResponse.json({ message: 'Invalid parentFolderId format.'}, { status: 400 });
  }


  const handler = createUpdateFolderHandler(folderId, activeOrgId, body);
  return withErrorHandling(withAuth(handler) as (...args: unknown[]) => Promise<NextResponse>)(request, context);
};

const createDeleteFolderHandler = (folderId: string, activeOrgId: string): AuthenticatedHandler => {
  return async (_request: NextRequest, _user: User, supabase: SupabaseClient) => {
    const folderRepository = new SupabaseFolderRepository(supabase);
    const deleteUseCase = new DeleteFolderUseCase(folderRepository);
    try {
      await deleteUseCase.execute({ folderId, organizationId: activeOrgId });
      return new NextResponse(null, { status: 204 }); // 204 No Content
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        // ConflictError could be if folder is not empty, as per repository logic
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message, code: error.code }, { status: error.statusCode });
      }
      console.error(`Error deleting folder ${folderId}:`, error);
      return NextResponse.json({ message: 'An unexpected error occurred while deleting the folder.' }, { status: 500 });
    }
  };
};

export const DELETE = async (request: NextRequest, context: RouteContext) => {
  const { params } = context;
  const folderId = (await params).folderId;
  if (!folderId) {
    return NextResponse.json({ message: 'Folder ID is required in the path.' }, { status: 400 });
  }
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    return NextResponse.json({ message: 'Active organization not found.' }, { status: 400 });
  }
  const handler = createDeleteFolderHandler(folderId, activeOrgId);
  return withErrorHandling(withAuth(handler) as (...args: unknown[]) => Promise<NextResponse>)(request, context);
}; 