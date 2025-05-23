import type { PlainTag } from '@/lib/actions/dam/tag.actions';

// Component layer types for UI consumption
// These are adapted from domain entities for component use

export interface ComponentAsset {
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
  type: 'asset';
  publicUrl: string | null;
  parentFolderName: string | null;
  ownerName: string;
  tags: PlainTag[];
}

export interface ComponentFolder {
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

// Combined type for components that handle both assets and folders
export type CombinedItem = ComponentAsset | ComponentFolder;

// Filter and sort types for component layer
export interface ComponentFilterParameters {
  type?: string | null;
  creationDateOption?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  ownerId?: string | null;
  sizeOption?: string | null;
  sizeMin?: string | null;
  sizeMax?: string | null;
}

export interface ComponentSortParameters {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
}

// Upload form data type
export interface UploadFormData {
  file: File;
  folderId?: string | null;
  name?: string;
  tags?: string[];
} 