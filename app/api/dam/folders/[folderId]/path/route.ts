import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedHandler } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
// getActiveOrganizationId might not be strictly needed if getPath doesn't require orgId for validation here
// but it's good practice for consistency or if the use case/repo evolves to need it.
import { getActiveOrganizationId } from '@/lib/auth'; 
import { GetFolderPathUseCase } from '@/lib/dam/application/use-cases/folders';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { ValidationError, NotFoundError, AppError } from '@/lib/errors/base';

interface RouteContext {
  params: Promise<{
    folderId?: string;
  }>;
}

const createGetFolderPathHandler = (folderId: string): AuthenticatedHandler => {
  return async (_request: NextRequest, _user: User, supabase: SupabaseClient) => {
    const folderRepository = new SupabaseFolderRepository(supabase);
    const getPathUseCase = new GetFolderPathUseCase(folderRepository);

    try {
      // Get active organization ID for security validation
      const activeOrgId = await getActiveOrganizationId();
      if (!activeOrgId) {
        return NextResponse.json({ message: 'Active organization not found.' }, { status: 400 });
      }

      const path = await getPathUseCase.execute({ folderId, organizationId: activeOrgId });
      return NextResponse.json(path, { status: 200 });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message, code: error.code }, { status: error.statusCode });
      }
      console.error(`Error getting path for folder ${folderId}:`, error);
      return NextResponse.json({ message: 'An unexpected error occurred while getting the folder path.' }, { status: 500 });
    }
  };
};

export const GET = async (request: NextRequest, context: RouteContext) => {
  const { params } = context;
  const folderId = (await params).folderId;

  if (!folderId) {
    return NextResponse.json({ message: 'Folder ID is required in the path.' }, { status: 400 });
  }

  const handler = createGetFolderPathHandler(folderId);
  return withErrorHandling(withAuth(handler))(request, context);
}; 