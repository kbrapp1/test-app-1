import { GalleryItemDto } from '../../application/use-cases/folders/ListFolderContentsUseCase';
import { GetDamDataResult } from '../../application/use-cases/search/GetDamDataUseCase';
import { Folder } from '../entities/Folder';
import { Asset } from '../entities/Asset';
import { Tag } from '../entities/Tag';

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
      ...result.folders.map((folder: Folder) => ({
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        createdAt: folder.createdAt,
      })),
      ...result.assets.map((asset: Asset) => ({
        id: asset.id,
        name: asset.name,
        type: 'asset' as const,
        createdAt: asset.createdAt,
        mimeType: asset.mimeType,
        publicUrl: asset.publicUrl,
        size: asset.size,
        userId: asset.userId,
        userFullName: asset.userFullName,
        tags: asset.tags?.map((tag: Tag) => ({ id: tag.id, name: tag.name, color: '#666666' })) || [],
        folderName: asset.folderName,
      })),
    ];
  }

  /**
   * Map folders only to GalleryItemDto format
   */
  static mapFoldersToGalleryItems(folders: GetDamDataResult['folders']): GalleryItemDto[] {
    return folders.map((folder: Folder) => ({
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
    return assets.map((asset: Asset) => ({
      id: asset.id,
      name: asset.name,
      type: 'asset' as const,
      createdAt: asset.createdAt,
      mimeType: asset.mimeType,
      publicUrl: asset.publicUrl,
      size: asset.size,
      userId: asset.userId,
      userFullName: asset.userFullName,
      tags: asset.tags?.map((tag: Tag) => ({ id: tag.id, name: tag.name, color: '#666666' })) || [],
      folderName: asset.folderName,
    }));
  }
} 
