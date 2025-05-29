import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { DatabaseError, ValidationError } from '@/lib/errors/base';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// DDD imports - delegate to use cases
import { GetDamDataUseCase } from '@/lib/dam/application/use-cases/search';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import type { 
  DamFilterParameters, 
  DamSortParameters, 
  LimitOptions 
} from '@/lib/dam/application/dto/SearchCriteriaDTO';

/**
 * DAM API Route - Thin Wrapper Following DDD Principles
 * 
 * This route is a thin adapter that:
 * 1. Handles HTTP concerns (request/response)
 * 2. Validates and parses input parameters  
 * 3. Delegates business logic to GetDamDataUseCase
 * 4. Transforms domain results to API response format
 * 
 * Business logic is handled by: GetDamDataUseCase
 */

function parseRequestParameters(searchParams: URLSearchParams) {
  const searchTerm = searchParams.get('q') || '';
  const quickSearch = searchParams.get('quickSearch') === 'true';
  const limitParam = searchParams.get('limit');
  const tagIdsParam = searchParams.get('tagIds');
  
  let currentFolderId = searchParams.get('folderId');
  if (currentFolderId === '') {
    currentFolderId = null;
  }

  const tagIdsArray = tagIdsParam?.split(',').map(id => id.trim()).filter(id => id);

  const filters: DamFilterParameters = {
    type: searchParams.get('type'),
    creationDateOption: searchParams.get('creationDateOption'),
    dateStart: searchParams.get('dateStart'),
    dateEnd: searchParams.get('dateEnd'),
    ownerId: searchParams.get('ownerId'),
    sizeOption: searchParams.get('sizeOption'),
    sizeMin: searchParams.get('sizeMin'),
    sizeMax: searchParams.get('sizeMax'),
  };

  const sortParams: DamSortParameters = {
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | null,
  };

  const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
  
  // Validate limit parameter
  if (limitParam && (Number.isNaN(parsedLimit) || (parsedLimit !== undefined && parsedLimit < 0))) {
    throw new ValidationError('Invalid limit parameter. Limit must be a non-negative number.');
  }

  const limitOptions: LimitOptions = { quickSearch, parsedLimit };

  return {
    folderId: currentFolderId,
    searchTerm: searchTerm || undefined,
    tagIds: tagIdsArray,
    filters,
    sortParams,
    limitOptions,
  };
}

export async function getHandler(
  request: NextRequest,
  user: User,
  supabase: SupabaseClient
) {
  console.log('\n🚀 === DAM API REQUEST START ===');
  console.log('👤 User ID:', user.id);
  console.log('📧 User Email:', user.email);
  
  // 1. Parse and validate HTTP request parameters
  const { searchParams } = new URL(request.url);
  const params = parseRequestParameters(searchParams);
  console.log('📋 Request params:', params);

  // 2. Get organization context with refresh logic
  console.log('🔍 Attempting to get active organization ID...');
  let organizationId = await getActiveOrganizationId();
  console.log('🏢 Initial organization lookup result:', organizationId);
  
  // If no organization found, try forcing a session refresh
  if (!organizationId) {
    console.log('🔄 DAM API: No organization found, checking for recent switch...');
    
    // Check if this is a recent organization switch by looking at headers or trying refresh
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🎫 Current session exists:', !!session);
      console.log('🎫 Session access_token exists:', !!session?.access_token);
      
      if (session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          console.log('✅ DAM API: Session refreshed, retrying organization lookup...');
          organizationId = await getActiveOrganizationId();
          console.log('🏢 Organization after refresh:', organizationId);
        } else {
          console.log('❌ DAM API: Session refresh failed:', refreshError);
        }
      }
    } catch (refreshError) {
      console.warn('⚠️ DAM API: Session refresh failed:', refreshError);
    }
  }
  
  if (!organizationId) {
    console.log('❌ No organization found after all attempts');
    throw new DatabaseError('Active organization not found');
  }

  console.log(`🏢 DAM API: Final organization ID: ${organizationId}`);

  // 3. Set up dependencies and use case
  const assetRepository = new SupabaseAssetRepository(supabase);
  const folderRepository = new SupabaseFolderRepository(supabase);
  const getDamDataUseCase = new GetDamDataUseCase(assetRepository, folderRepository);

  // 4. Build proper DamApiRequestDto
  const requestDto = {
    organizationId,
    userId: user.id,
    searchTerm: params.searchTerm || '',
    quickSearch: params.limitOptions.quickSearch,
    limit: params.limitOptions.parsedLimit,
    folderId: params.folderId,
    tagIds: params.tagIds,
    filters: params.filters,
    sortParams: params.sortParams,
    limitOptions: params.limitOptions,
  };

  // 5. Delegate business logic to use case
  const result = await getDamDataUseCase.execute(requestDto);
  console.log('📊 Use case result summary:');
  console.log(`   - Folders: ${result.folders.length}`);
  console.log(`   - Assets: ${result.assets.length}`);
  
  // Log first few assets for debugging
  if (result.assets.length > 0) {
    console.log('🖼️ Sample assets:');
    result.assets.slice(0, 3).forEach((asset, i) => {
      console.log(`   ${i + 1}. ${asset.name} (ID: ${asset.id})`);
    });
  }

  // 6. Transform domain result to API response format
  // Transform domain entities to GalleryItemDto format
  const transformedFolders = result.folders.map(folder => ({
    type: 'folder' as const,
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt,
  }));

  const transformedAssets = result.assets.map(asset => ({
    type: 'asset' as const,
    id: asset.id,
    name: asset.name,
    createdAt: asset.createdAt,
    mimeType: asset.mimeType,
    publicUrl: asset.publicUrl,
    size: asset.size,
    userId: asset.userId,
    userFullName: asset.userFullName,
    tags: asset.tags?.map((tag: { id: string; name: string }) => ({ id: tag.id, name: tag.name })) || [],
    folderName: asset.folderName,
  }));

  // Combine transformed items
  const combinedItems = [...transformedFolders, ...transformedAssets];
  
  const responseData = {
    data: combinedItems,
    totalItems: combinedItems.length,
  };

  console.log(`📤 Returning ${responseData.totalItems} items for organization ${organizationId}`);
  console.log('🚀 === DAM API REQUEST END ===\n');

  // 7. Return HTTP response
  return NextResponse.json(responseData, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Organization-ID': organizationId, // For debugging
      'Vary': 'Authorization, Cookie', // Ensure different caching per auth state
    },
  });
}

export const GET = withErrorHandling(withAuth(getHandler)); 