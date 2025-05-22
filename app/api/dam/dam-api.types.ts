import type { Tag } from '@/lib/actions/dam/tag.actions';

// Original types from dam-api.helpers.ts / route.ts

export interface DamFilterParameters {
  type?: string | null;
  creationDateOption?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  ownerId?: string | null;
  sizeOption?: string | null;
  sizeMin?: string | null;
  sizeMax?: string | null;
}

export interface DamSortParameters {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
}

export interface LimitOptions {
  quickSearch: boolean;
  parsedLimit?: number;
}

// Raw data types from Supabase
export interface RawAssetFromApi {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  storage_path: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  asset_tags: Array<{ tags: Tag | null }> | null; // Assuming Tag is imported or defined elsewhere if not global
  organization_id: string;
}

export interface RawFolderFromApi {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  parent_folder_id: string | null;
  organization_id: string;
  has_children_count?: Array<{ count: number }>;
}

// Result structure for data fetching functions
export interface DataFetchingResult {
  foldersData: RawFolderFromApi[] | null;
  assetsData: RawAssetFromApi[] | null;
  foldersError: Error | null;
  assetsError: Error | null;
}

// ### NEW/MODIFIED TYPES for transformed data ###
export interface TransformedAsset {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  storage_path: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  organization_id: string;
  // Added by transformer:
  type: 'asset';
  publicUrl: string | null; // Ensure getPublicUrl can return null
  parentFolderName: string | null;
  ownerName: string;
  tags: Tag[]; // Tag from '@/lib/actions/dam/tag.actions'
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

// Return type for the transformation helper
export interface TransformedDataReturn {
  foldersWithDetails: TransformedFolder[];
  assetsWithDetails: TransformedAsset[];
} 