import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedHandler } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { NotFoundError } from '@/lib/errors/base';
import { getActiveOrganizationId } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';

import { GetAssetDetailsUseCase, UpdateAssetMetadataUseCase, DeleteAssetUseCase } from '@/lib/dam/application/use-cases/assets';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseStorageService } from '@/lib/dam/infrastructure/storage/SupabaseStorageService';

interface RouteContext {
  params: Promise<{
    assetId?: string; // Make assetId optional to check for its presence
  }>;
}

// Enhanced GET handler with support for detailed asset information
const createAssetDetailsHandler = (assetId: string): AuthenticatedHandler => {
  return async (req: NextRequest, user: User, supabase: SupabaseClient) => {
    const { searchParams } = new URL(req.url);
    const includeDownloadUrl = searchParams.get('download') === 'true';
    const isDetailView = searchParams.get('details') === 'true';

    const assetRepository = new SupabaseAssetRepository(supabase);

    try {
      if (isDetailView) {
        // Use enhanced use case for detailed view
        const storageService = new SupabaseStorageService(supabase);
        const getAssetDetailsUseCase = new GetAssetDetailsUseCase(assetRepository, storageService);
        
        const assetDetails = await getAssetDetailsUseCase.execute({
          assetId,
          includeDownloadUrl,
        });

        return NextResponse.json(assetDetails);
      } else {
        // Simple asset fetch for basic information
        const storageService = new SupabaseStorageService(supabase);
        const getAssetDetailsUseCase = new GetAssetDetailsUseCase(assetRepository, storageService);
        const asset = await getAssetDetailsUseCase.execute({ assetId });

        if (!asset) {
          throw new NotFoundError(`Asset with ID ${assetId} not found.`);
        }

        return NextResponse.json(asset);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      console.error(`Error fetching asset ${assetId}:`, error);
      throw error; // Re-throw for the global error handler
    }
  };
};

// GET route handler
async function routeHandler(request: NextRequest, context: RouteContext) {
  const assetId = (await context.params).assetId;

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  const specificAssetHandler = createAssetDetailsHandler(assetId);
  const authenticatedSpecificAssetHandler = withAuth(specificAssetHandler);
  
  return withErrorHandling(authenticatedSpecificAssetHandler)(request);
}

export { routeHandler as GET };

// PATCH route handler with authentication
const createUpdateAssetHandler = (assetId: string): AuthenticatedHandler => {
  return async (req: NextRequest, user: User, supabase: SupabaseClient) => {
    try {
      const body = await req.json();
      
      const assetRepository = new SupabaseAssetRepository(supabase);
      const useCase = new UpdateAssetMetadataUseCase(assetRepository);
      
      const result = await useCase.execute({
        assetId,
        updates: {
          name: body.name,
          folderId: body.folderId,
        },
      });

      return NextResponse.json({
        success: result.success,
        message: result.message,
        asset: result.asset.toPlainObject(),
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          );
        }
        
        if (error.message.includes('cannot be renamed') || 
            error.message.includes('cannot be moved')) {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const assetId = (await params).assetId;
  
  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  const updateHandler = createUpdateAssetHandler(assetId);
  const authenticatedUpdateHandler = withAuth(updateHandler);
  
  return withErrorHandling(authenticatedUpdateHandler)(request);
}

// DELETE route handler with authentication
const createDeleteAssetHandler = (assetId: string): AuthenticatedHandler => {
  return async (req: NextRequest, user: User, supabase: SupabaseClient) => {
    try {
      // Get user's active organization from JWT custom claims
      const organizationId = await getActiveOrganizationId();
      
      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization context required' },
          { status: 400 }
        );
      }

      const assetRepository = new SupabaseAssetRepository(supabase);
      const storageService = new SupabaseStorageService(supabase);
      const useCase = new DeleteAssetUseCase(assetRepository, storageService);
      
      const result = await useCase.execute({ 
        assetId, 
        organizationId 
      });

      // Comprehensive cache invalidation for asset deletion - removed /dam revalidation for client-side fetching
      // revalidatePath('/dam', 'layout'); // REMOVED - causes unnecessary POST /dam calls
      // revalidatePath('/dam', 'page'); // REMOVED - causes unnecessary POST /dam calls
      if (result.folderId) {
        revalidatePath(`/dam/folders/${result.folderId}`, 'layout');
        revalidatePath(`/dam/folders/${result.folderId}`, 'page');
      }
      // If no folder (root level), no need to revalidate /dam since we use client-side fetching
      
      // Revalidate any gallery or asset list components
      revalidateTag('dam-gallery');
      revalidateTag('dam-assets');
      revalidateTag(`asset-${assetId}`);

      return NextResponse.json({
        success: true,
        message: 'Asset deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          );
        }
        
        if (error.message.includes('cannot be deleted')) {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const assetId = (await params).assetId;
  
  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  const deleteHandler = createDeleteAssetHandler(assetId);
  const authenticatedDeleteHandler = withAuth(deleteHandler);
  
  return withErrorHandling(authenticatedDeleteHandler)(request);
} 