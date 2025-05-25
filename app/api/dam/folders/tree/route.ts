import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedHandler } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { ListFoldersUseCase } from '@/lib/dam/application/use-cases/folders';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { ValidationError, AppError } from '@/lib/errors/base';

// This is the actual handler that withAuth will call
const listFoldersForTreeHandler = (parentId: string | null, activeOrgId: string): AuthenticatedHandler => {
  return async (_request: NextRequest, _user: User, supabase: SupabaseClient) => {
    const folderRepository = new SupabaseFolderRepository(supabase);
    const listFoldersUseCase = new ListFoldersUseCase(folderRepository);

    try {
      const folders = await listFoldersUseCase.execute({
        parentId,
        organizationId: activeOrgId,
      });
      
      // Convert domain entities to plain objects for proper JSON serialization
      const plainFolders = folders.map(folder => folder.toPlainObject());
      
      return NextResponse.json(plainFolders, { status: 200 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message, code: error.code }, { status: error.statusCode });
      }
      console.error(`Error listing folders for tree (parentId: ${parentId}):`, error);
      return NextResponse.json({ message: 'An unexpected error occurred while listing folders.' }, { status: 500 });
    }
  };
};

// Export the wrapped handler for the GET method
export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  // parentId query param. If not present, parentId will be null (for root folders).
  const parentId = searchParams.get('parentId') || null; 
  
  // Validate parentId format if it's not null
  if (parentId !== null && typeof parentId !== 'string') {
    // This check is basic; UUID validation could be added if IDs are UUIDs
    return NextResponse.json({ message: 'Invalid parentId format.' }, { status: 400 });
  }

  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    return NextResponse.json({ message: 'Active organization not found' }, { status: 400 });
  }

  const handler = listFoldersForTreeHandler(parentId, activeOrgId);
  // The `context` argument is not needed here as `parentId` comes from searchParams
  return withErrorHandling(withAuth(handler))(request);
}; 