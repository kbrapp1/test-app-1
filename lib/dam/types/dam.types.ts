/**
 * Shared type definitions for Digital Asset Management (DAM) module
 * 
 * This file contains only general utility types and re-exports.
 * Domain-specific types should be in their respective modules:
 * - Domain entities: lib/dam/domain/entities/
 * - DTOs: lib/dam/application/dto/
 * - Infrastructure types: lib/dam/infrastructure/
 */

// DAM Domain Layer Re-exports
export type { Asset } from '../domain/entities/Asset';
export type { Folder } from '../domain/entities/Folder';
export type { Tag } from '../domain/entities/Tag';

// Repository Interfaces - organized by layer separation
export type { IAssetRepository, CreateAssetData, UpdateAssetData } from '../domain/repositories/IAssetRepository';
export type { IFolderRepository, CreateFolderData, UpdateFolderData, FolderTreeNode } from '../domain/repositories/IFolderRepository';
export type { ITagRepository, CreateTagData, UpdateTagData } from '../domain/repositories/ITagRepository';

// Application Layer DTOs - clean search/filter criteria
export type {
  AssetSearchCriteria,
  FolderSearchCriteria,
  DamFilterParameters,
  DamSortParameters,
  LimitOptions,
} from '../application/dto/SearchCriteriaDTO';

// Application Layer DTOs - upload functionality  
export type {
  UploadAssetDTO,
} from '../application/dto/UploadAssetDTO';

// General utility types that don't belong in specific layers
export interface FetchError extends Error {
  status?: number;
  message: string;
}

// Legacy upload form data - consider moving to DTO if still needed
export interface UploadFormData {
  files: File[];
  userId: string;
  folderId?: string | null;
}

// Plain object types for server-client component serialization
export interface PlainFolder {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  parentFolderId?: string | null;
  organizationId: string;
  has_children?: boolean;
} 