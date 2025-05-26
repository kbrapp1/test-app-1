/**
 * Domain types for bulk download operations
 * 
 * Single Responsibility: Type definitions and domain modeling
 * Following DDD principles with clear value objects
 */

// Value Objects
export interface AssetInfo {
  readonly id: string;
  readonly storagePath: string;
  readonly name: string;
  readonly folderPath?: string;
}

export interface DownloadRequest {
  readonly assetIds: string[];
  readonly folderIds: string[];
  readonly organizationId: string;
  readonly userId: string;
  readonly format: 'zip' | 'individual';
  readonly includeMetadata: boolean;
}

export interface DownloadResult {
  readonly downloadUrls: string[];
  readonly zipBlob?: Blob;
  readonly zipFileName?: string;
  readonly failedAssetIds: string[];
  readonly failedFolderIds: string[];
  readonly errors: string[];
}

export interface ZipOptions {
  readonly folderNames?: string[];
  readonly selectionType?: 'assets' | 'folders' | 'mixed';
}

export interface ZipCreationResult {
  readonly zipBlob?: Blob;
  readonly zipFileName?: string;
}

// Input/Output DTOs
export interface BulkDownloadAssetsUseCaseRequest {
  assetIds: string[];
  folderIds: string[];
  organizationId: string;
  userId: string;
  format?: 'zip' | 'individual';
  includeMetadata?: boolean;
}

export interface BulkDownloadAssetsUseCaseResponse {
  downloadUrls: string[];
  zipBlob?: Blob;
  zipFileName?: string;
  failedAssetIds: string[];
  failedFolderIds: string[];
  errors: string[];
} 