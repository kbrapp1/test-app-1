import { Asset } from '../../domain/entities';
import { IAssetRepository } from '../../domain/repositories';
import { IStorageService } from '../../domain/repositories/IStorageService';
import type { PlainTag } from '@/lib/actions/dam/tag.actions';

/**
 * GetAssetDetailsUseCase - Fetch Comprehensive Asset Information
 * 
 * This use case demonstrates proper DDD application patterns:
 * - Coordinates between multiple repositories
 * - Returns rich domain entities with computed properties
 * - Handles storage URL generation for previews
 * - Provides comprehensive asset metadata
 */

export interface AssetDetailsDto {
  id: string;
  name: string;
  nameWithoutExtension: string;
  mimeType: string;
  size: number;
  humanReadableSize: string;
  publicUrl?: string;
  downloadUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  folderId?: string | null;
  folderName?: string | null;
  folderPath?: string;
  organizationId: string;
  tags: PlainTag[];
  fileExtension: string;
  preview: {
    thumbnailUrl?: string;
    canPreview: boolean;
    previewType: 'image' | 'video' | 'audio' | 'document' | 'text' | 'none';
  };
  capabilities: {
    canRename: boolean;
    canDelete: boolean;
    canMove: boolean;
    isEditable: boolean;
  };
}

export interface GetAssetDetailsRequest {
  assetId: string;
  includeDownloadUrl?: boolean;
}

export class GetAssetDetailsUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private storageService: IStorageService
  ) {}

  async execute(request: GetAssetDetailsRequest): Promise<AssetDetailsDto> {
    const { assetId, includeDownloadUrl = false } = request;

    // Fetch asset from repository
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new Error(`Asset with ID ${assetId} not found`);
    }

    // Generate download URL if requested
    const downloadUrl = includeDownloadUrl 
      ? await this.storageService.getSignedUrl(asset.storagePath, 3600, true, asset.name)
      : undefined;

    // Generate thumbnail URL for supported types
    const thumbnailUrl = this.generateThumbnailUrl(asset);

    // Determine preview capabilities
    const previewInfo = this.getPreviewInfo(asset);

    // Convert domain Tags to PlainTags for the DTO
    const plainTags: PlainTag[] = asset.tags?.map(tag => tag.toPlainObject()) || [];

    return {
      id: asset.id,
      name: asset.name,
      nameWithoutExtension: asset.getNameWithoutExtension(),
      mimeType: asset.mimeType,
      size: asset.size,
      humanReadableSize: asset.getHumanReadableSize(),
      publicUrl: asset.publicUrl,
      downloadUrl,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      folderId: asset.folderId,
      folderName: asset.folderName,
      folderPath: undefined,
      organizationId: asset.organizationId,
      tags: plainTags,
      fileExtension: asset.getFileExtension(),
      preview: {
        thumbnailUrl,
        canPreview: previewInfo.canPreview,
        previewType: previewInfo.type,
      },
      capabilities: {
        canRename: asset.canBeRenamedTo(asset.name + '_copy'), // Test with a different name
        canDelete: asset.canBeDeleted(),
        canMove: asset.canBeMovedTo(null), // Test move capability
        isEditable: asset.isEditableText(),
      },
    };
  }

  private generateThumbnailUrl(asset: Asset): string | undefined {
    // For images, use the public URL as thumbnail
    if (asset.isImage()) {
      return asset.publicUrl;
    }

    // For other types, we'd need a thumbnail generation service
    // For now, return undefined since we don't have thumbnail generation
    return undefined;
  }

  private getPreviewInfo(asset: Asset): { canPreview: boolean; type: AssetDetailsDto['preview']['previewType'] } {
    if (asset.isImage()) {
      return { canPreview: true, type: 'image' };
    }

    if (asset.isVideo()) {
      return { canPreview: true, type: 'video' };
    }

    if (asset.isAudio()) {
      return { canPreview: true, type: 'audio' };
    }

    if (asset.isDocument()) {
      return { canPreview: true, type: 'document' };
    }

    if (asset.isEditableText()) {
      return { canPreview: true, type: 'text' };
    }

    return { canPreview: false, type: 'none' };
  }

  private async getFolderPath(folderId: string): Promise<string | undefined> {
    try {
      // This would typically use a folder repository to build the full path
      // For now, we'll return a placeholder
      return `Folder ${folderId}`;
    } catch (error) {
      console.warn('Failed to get folder path:', error);
      return undefined;
    }
  }
}

export default GetAssetDetailsUseCase; 