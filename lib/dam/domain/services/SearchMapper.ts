import { GalleryItemDto } from '../../application/use-cases/folders/ListFolderContentsUseCase';
import { GetDamDataResult } from '../../application/use-cases/search/GetDamDataUseCase';

/**
 * Domain service for mapping search results to DTOs
 * Follows Single Responsibility Principle - only handles search result mapping
 */
export class SearchMapper {
  /**
   * Convert domain entities to GalleryItemDto format
   */
  static mapDomainResultToGalleryItems(result: GetDamDataResult): GalleryItemDto[] {
    return [
      ...result.folders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        createdAt: folder.createdAt,
      })),
      ...result.assets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        type: 'asset' as const,
        createdAt: asset.createdAt,
        mimeType: asset.mimeType,
        publicUrl: asset.publicUrl,
        size: asset.size,
        userId: asset.userId,
        userFullName: asset.userFullName,
        tags: asset.tags?.map((tag: any) => ({ id: tag.id, name: tag.name })) || [],
      })),
    ];
  }

  /**
   * Map folders only to GalleryItemDto format
   */
  static mapFoldersToGalleryItems(folders: GetDamDataResult['folders']): GalleryItemDto[] {
    return folders.map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      type: 'folder' as const,
      createdAt: folder.createdAt,
    }));
  }

  /**
   * Map assets only to GalleryItemDto format
   */
  static mapAssetsToGalleryItems(assets: GetDamDataResult['assets']): GalleryItemDto[] {
    return assets.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      type: 'asset' as const,
      createdAt: asset.createdAt,
      mimeType: asset.mimeType,
      publicUrl: asset.publicUrl,
      size: asset.size,
      userId: asset.userId,
      userFullName: asset.userFullName,
      tags: asset.tags?.map((tag: any) => ({ id: tag.id, name: tag.name })) || [],
    }));
  }
} 
