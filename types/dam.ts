import type { Tag as ImportedTag } from '@/lib/actions/dam/tag.actions';

/**
 * Shared type definitions for Digital Asset Management (DAM) module
 */

// Re-export Tag type for wider use
export type Tag = ImportedTag;

// Base type shared by assets and folders
export interface BaseItem {
  id: string;
  name: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  type: 'asset' | 'folder';
  ownerName: string | null;
}

// Asset specific properties
export interface Asset extends BaseItem {
  type: 'asset';
  storage_path: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  publicUrl: string;
  parentFolderName: string | null;
  tags?: Tag[];
}

// Folder specific properties
export interface Folder extends BaseItem {
  type: 'folder';
  parent_folder_id: string | null;
}

// Combined type for components that handle both
export type CombinedItem = Asset | Folder;

// API response types
export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: CombinedItem[];
  error?: string;
}

// Error type for fetch responses
export interface FetchError extends Error {
  status?: number;
  message: string;
}

// Upload form data structure
export interface UploadFormData {
  files: File[];
  userId: string;
  folderId?: string | null;
} 