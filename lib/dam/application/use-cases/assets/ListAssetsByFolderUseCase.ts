import { Asset } from '../../../domain/entities/Asset';
import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { DamSortParameters, DamFilterParameters } from '../../../application/dto/SearchCriteriaDTO';

interface ListAssetsByFolderUseCaseParams {
  folderId: string | null; // Null for root-level assets
  organizationId: string;
  sortParams?: DamSortParameters;
  filters?: DamFilterParameters;
  // Future considerations: pagination (limit, offset), sorting, specific filters
}

export class ListAssetsByFolderUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  async execute({
    folderId,
    organizationId,
    sortParams,
    filters,
  }: ListAssetsByFolderUseCaseParams): Promise<Asset[]> {
    // The repository implementation should handle the actual database query
    // including security and filtering by organizationId and folderId.
    const assets = await this.assetRepository.findByFolderId(
      folderId,
      organizationId,
      sortParams,
      filters
    );

    // Further transformations or business logic could be applied here if needed.
    // For example, if assets had a 'status' and we only wanted 'active' ones not handled by the repo.
    return assets;
  }
} 
