import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedHandler } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { NotFoundError } from '@/lib/errors/base';

import { GetAssetDetailsUseCase } from '@/lib/dam/application/use-cases/GetAssetDetailsUseCase';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';

interface RouteContext {
  params: {
    assetId?: string; // Make assetId optional to check for its presence
  };
}

// This is the actual handler that withAuth will call
const createAssetDetailsHandler = (assetId: string): AuthenticatedHandler => {
  return async (req: NextRequest, user: User, supabase: SupabaseClient) => {
    const assetRepository = new SupabaseAssetRepository(supabase);
    const getAssetDetailsUseCase = new GetAssetDetailsUseCase(assetRepository);

    try {
      const asset = await getAssetDetailsUseCase.execute({ assetId });

      if (!asset) {
        throw new NotFoundError(`Asset with ID ${assetId} not found.`);
      }

      // TODO: Later, ensure the fetched asset's organizationId matches the user's activeOrgId
      // This check might be better placed within the use case or repository for security if not handled by RLS alone.
      // Example: if (!isUserMemberOfOrg(user, asset.organizationId, supabase)) throw new ForbiddenError();

      return NextResponse.json(asset);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      console.error(`Error fetching asset ${assetId}:`, error);
      throw error; // Re-throw for the global error handler
    }
  };
};

// This is the function Next.js will call for the route
async function routeHandler(request: NextRequest, context: RouteContext) {
  const assetId = context.params.assetId;

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  const specificAssetHandler = createAssetDetailsHandler(assetId);
  const authenticatedSpecificAssetHandler = withAuth(specificAssetHandler);
  
  return withErrorHandling(authenticatedSpecificAssetHandler)(request);
}

export { routeHandler as GET }; 