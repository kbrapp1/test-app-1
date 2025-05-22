import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedHandler } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
// getActiveOrganizationId might not be strictly needed if getPath doesn't require orgId for validation here
// but it's good practice for consistency or if the use case/repo evolves to need it.
import { getActiveOrganizationId } from '@/lib/auth/server-action'; 
import { GetFolderPathUseCase } from '@/lib/dam/application/use-cases/GetFolderPathUseCase';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { ValidationError, NotFoundError, AppError } from '@/lib/errors/base';

interface RouteContext {
  params: {
    folderId?: string;
  };
}

const createGetFolderPathHandler = (folderId: string): AuthenticatedHandler => {
  // activeOrgId is not directly used by GetFolderPathUseCase as per current definition,
  // but could be passed if validation against org was added to use case or repo's getPath.
  return async (_request: NextRequest, _user: User, supabase: SupabaseClient) => {
    const folderRepository = new SupabaseFolderRepository(supabase);
    const getPathUseCase = new GetFolderPathUseCase(folderRepository);

    try {
      const path = await getPathUseCase.execute({ folderId });
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
  const folderId = params.folderId;

  if (!folderId) {
    return NextResponse.json({ message: 'Folder ID is required in the path.' }, { status: 400 });
  }
  
  // Optional: Verify activeOrgId if strict per-org validation is needed before calling use case,
  // even if the use case itself doesn't take it for this specific operation.
  // const activeOrgId = await getActiveOrganizationId();
  // if (!activeOrgId) {
  //   return NextResponse.json({ message: 'Active organization not found.' }, { status: 400 });
  // }

  const handler = createGetFolderPathHandler(folderId);
  return withErrorHandling(withAuth(handler))(request, context);
}; 