import { NextRequest } from 'next/server';
import { ValidationError } from '@/lib/errors/base';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { DamApiRequestDto } from '../dto/DamApiRequestDto';
import { DamFilterParameters, DamSortParameters, LimitOptions } from '../dto/SearchCriteriaDTO';

export class ParseDamApiRequestUseCase {
  async execute(request: NextRequest, userId: string): Promise<DamApiRequestDto> {
    const { searchParams } = new URL(request.url);
    
    // Parse core parameters
    let folderId = searchParams.get('folderId');
    if (folderId === '') {
      folderId = null;
    }
    
    const searchTerm = searchParams.get('q') || '';
    const quickSearch = searchParams.get('quickSearch') === 'true';
    const limitParam = searchParams.get('limit');
    const tagIdsParam = searchParams.get('tagIds');
    const tagIds = tagIdsParam?.split(',').map(id => id.trim()).filter(id => id);

    // Parse and validate limit
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
    if (limitParam && (Number.isNaN(parsedLimit) || (parsedLimit !== undefined && parsedLimit < 0))) {
      throw new ValidationError('Invalid limit parameter. Limit must be a non-negative number.');
    }

    // Parse filter parameters
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

    // Parse sort parameters
    const sortParams: DamSortParameters = {
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | null,
    };

    // Create limit options
    const limitOptions: LimitOptions = { quickSearch, parsedLimit };

    // Get organization context
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      throw new ValidationError('Active organization not found');
    }

    return {
      folderId,
      searchTerm,
      quickSearch,
      limit: parsedLimit,
      tagIds,
      filters,
      sortParams,
      limitOptions,
      organizationId,
      userId,
    };
  }
} 