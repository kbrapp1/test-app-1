// DAM Integration DTOs - DDD Application Layer
// Single Responsibility: Define data contracts for DAM integration at application boundaries
// Following Golden Rule: Use DTOs for cross-context communication

export interface SaveAssetToDAMDto {
  userId: string;
  organizationId: string;
  name: string;
  storagePath: string;
  mimeType: string;
  size: number;
  folderId?: string | null;
}

export interface DAMAssetDto {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  storagePath: string;
  mimeType: string;
  size: number;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadDto {
  file: File;
  storagePath: string;
}

export interface FileUploadResultDto {
  storagePath: string;
  publicUrl?: string;
  size: number;
} 