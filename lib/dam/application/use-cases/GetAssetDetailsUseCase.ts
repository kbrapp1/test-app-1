import { Asset } from '../../domain/entities/Asset';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';

interface GetAssetDetailsUseCaseParams {
  assetId: string;
  // We might not need organizationId here if the repository handles RLS transparently based on the authenticated user
  // However, if explicit org context is needed for other reasons, it can be passed.
}

export class GetAssetDetailsUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  async execute({ assetId }: GetAssetDetailsUseCaseParams): Promise<Asset | null> {
    // The repository implementation (e.g., SupabaseAssetRepository) 
    // should internally handle organization-level security (RLS) 
    // or receive organizationId if strictly necessary for the query.
    // For findById, the assetId should be globally unique enough usually.
    
    const asset = await this.assetRepository.findById(assetId);
    
    if (!asset) {
      // Handle asset not found, e.g., throw a specific error or return null
      // For now, returning null is consistent with IAssetRepository.findById
      return null;
    }
    
    // Potentially, further enrichment or transformation could happen here if needed,
    // beyond what the repository or mapper does. For now, it's direct.
    return asset;
  }
} 