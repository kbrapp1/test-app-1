import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedHandler } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { getActiveOrganizationId } from '@/lib/auth';
import { ListFolderChildrenUseCase } from '@/lib/dam/application/use-cases/folders';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { ValidationError, NotFoundError, AppError } from '@/lib/errors/base';

interface RouteContext {
  params: Promise<{
    folderId?: string; // Make optional to check for presence
  }>;
}

// This is the actual handler that withAuth will call
const createListFolderChildrenHandler = (folderId: string, activeOrgId: string): AuthenticatedHandler => {
  return async (_request: NextRequest, _user: User, supabase: SupabaseClient) => {
    const folderRepository = new SupabaseFolderRepository(supabase);
    const listChildrenUseCase = new ListFolderChildrenUseCase(folderRepository);

    try {
      const children = await listChildrenUseCase.execute({
        folderId,
        organizationId: activeOrgId,
      });
      return NextResponse.json(children, { status: 200 });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message, code: error.code }, { status: error.statusCode });
      }
      console.error(`Error listing children for folder ${folderId}:`, error);
      return NextResponse.json({ message: 'An unexpected error occurred while listing folder contents.' }, { status: 500 });
    }
  };
};

// Export the wrapped handler for the GET method
export const GET = async (request: NextRequest, context: RouteContext) => {
  const { params } = context;
  const folderId = (await params).folderId;

  if (!folderId) {
    return NextResponse.json({ message: 'Folder ID is required in the path.' }, { status: 400 });
  }

  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    return NextResponse.json({ message: 'Active organization not found' }, { status: 400 });
  }

  const handler = createListFolderChildrenHandler(folderId, activeOrgId);
  // Apply middleware. withAuth expects (req, user, supabase) after its own processing.
  // The `request` here is passed to withAuth, which then passes its modified version (or original) to the handler.
  return withErrorHandling(withAuth(handler))(request, context); // Pass context if withErrorHandling or withAuth needs it, usually not for the final handler call.
}; 