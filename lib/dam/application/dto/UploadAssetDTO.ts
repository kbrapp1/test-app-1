// DTO for uploading assets in UploadAssetUseCase
export interface UploadAssetDTO {
  /** The file object to upload */
  file: File;
  /** Parent folder ID or null for root */
  folderId?: string | null;
  /** Authenticated user ID */
  userId: string;
  /** Active organization ID */
  organizationId: string;
} 
