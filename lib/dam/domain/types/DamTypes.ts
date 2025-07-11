/**
 * DAM (Digital Asset Management) Domain Types
 * 
 * AI INSTRUCTIONS:
 * - Replace all 'any' types in DAM domain with proper interfaces
 * - Follow @golden-rule DDD patterns exactly
 * - Security-critical: organizationId fields must be preserved
 * - Single responsibility: DAM type definitions only
 * - Keep under 250 lines - focused on data contracts
 */

/**
 * Asset metadata interface
 * Replaces any types in asset processing
 */
export interface AssetMetadata {
  readonly fileName: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly dimensions?: {
    readonly width: number;
    readonly height: number;
  };
  readonly duration?: number; // For video/audio assets
  readonly checksum: string;
  readonly uploadedAt: Date;
  readonly lastModified: Date;
  readonly customProperties?: Record<string, unknown>;
}

/**
 * Asset processing configuration
 * Replaces any types in asset processing services
 */
export interface AssetProcessingConfig {
  readonly enableCompression: boolean;
  readonly compressionQuality: number;
  readonly generateThumbnails: boolean;
  readonly thumbnailSizes: Array<{
    readonly width: number;
    readonly height: number;
    readonly format: 'jpeg' | 'png' | 'webp';
  }>;
  readonly enableMetadataExtraction: boolean;
  readonly allowedMimeTypes: string[];
  readonly maxFileSize: number;
  readonly processingTimeout: number;
}

/**
 * Asset upload data interface
 * Replaces any types in asset upload operations
 */
export interface AssetUploadData {
  readonly file: File | Buffer;
  readonly fileName: string;
  readonly mimeType: string;
  readonly folderId?: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly userId: string;
  readonly tags?: string[];
  readonly description?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Asset processing result interface
 * Replaces any types in asset processing results
 */
export interface AssetProcessingResult {
  readonly success: boolean;
  readonly assetId?: string;
  readonly publicUrl?: string;
  readonly thumbnails?: Array<{
    readonly size: string;
    readonly url: string;
    readonly width: number;
    readonly height: number;
  }>;
  readonly metadata?: AssetMetadata;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
  readonly processingTime?: number;
}

/**
 * Asset search criteria interface
 * Replaces any types in asset search operations
 */
export interface AssetSearchCriteria {
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly query?: string;
  readonly mimeTypes?: string[];
  readonly tags?: string[];
  readonly folderId?: string;
  readonly uploadedAfter?: Date;
  readonly uploadedBefore?: Date;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly sortBy?: 'name' | 'size' | 'uploadedAt' | 'lastModified';
  readonly sortOrder?: 'asc' | 'desc';
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Asset database row interface
 * Replaces any types in database operations
 */
export interface AssetDatabaseRow {
  readonly id: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly userId: string;
  readonly fileName: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly publicUrl: string;
  readonly storageKey: string;
  readonly folderId: string | null;
  readonly tags: string[];
  readonly description: string | null;
  readonly metadata: Record<string, unknown>;
  readonly checksum: string;
  readonly createdAt: string; // ISO timestamp
  readonly updatedAt: string; // ISO timestamp
  readonly deletedAt: string | null; // ISO timestamp
}

/**
 * Folder structure interface
 * Replaces any types in folder operations
 */
export interface FolderData {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly userId: string;
  readonly path: string;
  readonly level: number;
  readonly assetCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Asset permissions interface
 * Replaces any types in permission checks
 */
export interface AssetPermissions {
  readonly canView: boolean;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
  readonly canShare: boolean;
  readonly canMove: boolean;
  readonly canDownload: boolean;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly userId: string;
  readonly assetId: string;
}

/**
 * Asset sharing configuration
 * Replaces any types in sharing operations
 */
export interface AssetSharingConfig {
  readonly assetId: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly shareType: 'public' | 'private' | 'organization';
  readonly expiresAt?: Date;
  readonly allowDownload: boolean;
  readonly requireAuth: boolean;
  readonly sharedBy: string;
  readonly sharedWith?: string[];
  readonly customPermissions?: Record<string, boolean>;
}

/**
 * Asset analytics data interface
 * Replaces any types in analytics operations
 */
export interface AssetAnalyticsData {
  readonly assetId: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly viewCount: number;
  readonly downloadCount: number;
  readonly shareCount: number;
  readonly lastViewedAt: Date;
  readonly lastDownloadedAt: Date;
  readonly popularityScore: number;
  readonly accessLog: Array<{
    readonly userId: string;
    readonly action: 'view' | 'download' | 'share';
    readonly timestamp: Date;
    readonly ipAddress?: string;
    readonly userAgent?: string;
  }>;
}

/**
 * DAM service response interface
 * Standardized response format for all DAM operations
 */
export interface DamServiceResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly context?: Record<string, unknown>;
  };
  readonly metadata?: {
    readonly processingTime?: number;
    readonly assetCount?: number;
    readonly organizationId?: string; // SECURITY-CRITICAL: Organization isolation
  };
}

/**
 * File validation result interface
 * Replaces any types in file validation
 */
export interface FileValidationResult {
  readonly isValid: boolean;
  readonly errors: Array<{
    readonly code: string;
    readonly message: string;
    readonly field?: string;
  }>;
  readonly warnings: Array<{
    readonly code: string;
    readonly message: string;
    readonly field?: string;
  }>;
  readonly metadata?: {
    readonly fileSize: number;
    readonly mimeType: string;
    readonly dimensions?: {
      readonly width: number;
      readonly height: number;
    };
  };
}

/**
 * Storage provider interface
 * Replaces any types in storage operations
 */
export interface StorageProviderConfig {
  readonly provider: 'supabase' | 'aws' | 'gcp' | 'azure';
  readonly bucket: string;
  readonly region?: string;
  readonly credentials?: Record<string, string>;
  readonly publicBaseUrl?: string;
  readonly enableCdn: boolean;
  readonly cdnUrl?: string;
  readonly uploadTimeout: number;
  readonly retryAttempts: number;
}

/**
 * Asset transformation options
 * Replaces any types in asset transformation
 */
export interface AssetTransformationOptions {
  readonly resize?: {
    readonly width: number;
    readonly height: number;
    readonly fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  readonly format?: 'jpeg' | 'png' | 'webp' | 'avif';
  readonly quality?: number;
  readonly progressive?: boolean;
  readonly optimize?: boolean;
  readonly watermark?: {
    readonly text?: string;
    readonly image?: string;
    readonly position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    readonly opacity: number;
  };
} 