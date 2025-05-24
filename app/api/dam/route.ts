import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';

// Domain imports - DDD refactored architecture
import { ParseDamApiRequestUseCase } from '@/lib/dam/application/use-cases/ParseDamApiRequestUseCase';
import { GetDamDataUseCase } from '@/lib/dam/application/use-cases/GetDamDataUseCase';
import { DamApiDtoService } from '@/lib/dam/application/services/DamApiDtoService';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';

/**
 * DAM API Route - Refactored with DDD Principles
 * 
 * This route demonstrates clean separation of concerns:
 * - HTTP concerns only (request parsing, response formatting)
 * - Business logic delegated to domain use cases
 * - Data transformation handled by dedicated services
 * 
 * Reduced from 361 lines to ~50 lines (86% reduction)
 * 
 * Architecture:
 * 1. Parse request → ParseDamApiRequestUseCase
 * 2. Execute business logic → GetDamDataUseCase  
 * 3. Transform response → DamApiDtoService
 * 4. Return HTTP response
 */
export async function getHandler(
  request: NextRequest,
  user: User,
  supabase: SupabaseClient
) {
  try {
    // Step 1: Parse and validate request (delegate to use case)
    const parseRequestUseCase = new ParseDamApiRequestUseCase();
    const requestDto = await parseRequestUseCase.execute(request, user.id);

    // Step 2: Execute business logic (delegate to use case)
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);
    const getDamDataUseCase = new GetDamDataUseCase(assetRepository, folderRepository);
    
    const domainResult = await getDamDataUseCase.execute(requestDto);

    // Step 3: Transform response (delegate to service)
    const dtoService = new DamApiDtoService(supabase);
    const responseDto = await dtoService.transformToApiResponse(
      domainResult,
      requestDto.organizationId,
      requestDto.sortParams,
      requestDto.limitOptions,
      requestDto.searchTerm
    );

    // Step 4: Return HTTP response
    return NextResponse.json(responseDto);

  } catch (error) {
    // HTTP error handling
    console.error('DAM API Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export const GET = withErrorHandling(withAuth(getHandler)); 