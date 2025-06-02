import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedHandler } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { MoveAssetUseCase } from '@/lib/dam/application/use-cases/assets/MoveAssetUseCase';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { revalidateTag } from 'next/cache';

interface RouteContext {
  params: {
    assetId: string;
  };
}

// POST route handler for moving assets
const createMoveAssetHandler = (assetId: string): AuthenticatedHandler => {
  return async (req: NextRequest, user: User, supabase: SupabaseClient) => {
    try {
      const body = await req.json();
      const { targetFolderId } = body;

      // Get user's active organization
      const organizationId = await getActiveOrganizationId();
      
      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization context required' },
          { status: 400 }
        );
      }

      // Initialize repositories and use case
      const assetRepository = new SupabaseAssetRepository(supabase);
      const folderRepository = new SupabaseFolderRepository(supabase);
      const moveUseCase = new MoveAssetUseCase(assetRepository, folderRepository);
      
      // Execute the move operation
      await moveUseCase.execute({
        assetId,
        targetFolderId: targetFolderId === null ? null : targetFolderId,
        organizationId,
      });

      // Note: React Query cache invalidation is handled client-side 
      // via the mutation hooks that call this endpoint

      return NextResponse.json({
        success: true,
        message: 'Asset moved successfully',
      });
    } catch (error) {
      console.error('Error moving asset:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: 'Asset or folder not found' },
            { status: 404 }
          );
        }
        
        if (error.message.includes('cannot be moved')) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const assetId = (await context.params).assetId;
  
  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  const moveHandler = createMoveAssetHandler(assetId);
  const authenticatedMoveHandler = withAuth(moveHandler);
  
  return withErrorHandling(authenticatedMoveHandler)(request);
} 