/**
 * API Response DTOs for DAM endpoints
 * 
 * These DTOs define the structure of data returned by API routes.
 * They are separate from domain entities to handle serialization concerns.
 */

export interface PlainTag {
  id: string;
  name: string;
  color: string;
  userId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TransformedAsset {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  storage_path: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  organization_id: string;
  // Added by transformer:
  type: 'asset';
  publicUrl: string | null;
  parentFolderName: string | null;
  ownerName: string;
  tags: PlainTag[];
}

export interface TransformedFolder {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  parentFolderId: string | null | undefined;
  organizationId: string;
  has_children: boolean;
  type: 'folder';
  ownerName: string;
}

export type CombinedDamItem = TransformedAsset | TransformedFolder;

export interface DamGalleryApiResponse {
  data: CombinedDamItem[];
  totalItems: number;
  metadata?: {
    searchTerm?: string;
    currentFolder?: string;
    appliedFilters?: Record<string, unknown>;
  };
}

export interface UploadApiResponse {
  success: boolean;
  data: TransformedAsset[];
  message?: string;
}

export interface FolderApiResponse {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  parentFolderId: string | null;
  organizationId: string;
  has_children: boolean;
}

export interface AssetApiResponse {
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
