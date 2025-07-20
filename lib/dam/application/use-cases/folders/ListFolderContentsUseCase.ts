import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IFolderRepository } from '../../../domain/repositories/IFolderRepository';
import { Asset } from '../../../domain/entities/Asset';
import { Folder } from '../../../domain/entities/Folder';
import { GalleryItemDto } from '../../../domain/value-objects/GalleryItem';
import { AppError, ValidationError, DatabaseError } from '@/lib/errors/base';


interface ListFolderContentsUseCaseRequest {
  organizationId: string;
  currentFolderId: string | null;
  forceRefresh?: boolean;
}

interface ListFolderContentsUseCaseResponse {
  items: GalleryItemDto[];
}

export class ListFolderContentsUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private folderRepository: IFolderRepository
  ) {}

  public async execute(
    request: ListFolderContentsUseCaseRequest
  ): Promise<ListFolderContentsUseCaseResponse> {
    const { organizationId, currentFolderId, forceRefresh: _forceRefresh } = request;

    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }
    // currentFolderId can be null for root

    try {
      const folders: Folder[] = await this.folderRepository.findFoldersByParentId(
        currentFolderId,
        organizationId
      );

      const assets: Asset[] = await this.assetRepository.findByFolderId(
        currentFolderId,
        organizationId
      );

      const galleryFolders: GalleryItemDto[] = folders.map((folder: Folder) => ({
        type: 'folder',
        id: folder.id.toString(),
        name: folder.name,
        createdAt: folder.createdAt,
      }));

      const galleryAssets: GalleryItemDto[] = assets.map(asset => {
        return {
          type: 'asset',
          id: asset.id.toString(),
          name: asset.name,
          createdAt: asset.createdAt,
          mimeType: asset.mimeType,
          publicUrl: asset.publicUrl, // This should now be populated by the repository
          size: asset.size,
          userId: asset.userId,
          userFullName: asset.userFullName,
          tags: asset.tags?.map(tag => ({ id: tag.id, name: tag.name, color: tag.colorName })) || [],
          folderName: asset.folderName,
        };
      });

      // Combine and sort: folders first (by name), then assets (by creation date descending - already handled by repo)
      // For simplicity here, just concatenating. Client might do more complex sorting or backend can.
      // The old usecase ordered folders by name and assets by created_at desc.
      // findByParentId for folders might need an order option, or sort here.
      // Assuming findByParentId also returns folders sorted by name (or we sort here).
      galleryFolders.sort((a, b) => a.name.localeCompare(b.name));
      // Assets are already sorted by createdAt desc by repository

      const combinedItems: GalleryItemDto[] = [
        ...galleryFolders,
        ...galleryAssets,
      ];

      return { items: combinedItems };
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(
        `An unexpected error occurred while listing folder contents: ${errorMessage}`,
        'LIST_FOLDER_CONTENTS_FAILED'
      );
    }
  }
} 
