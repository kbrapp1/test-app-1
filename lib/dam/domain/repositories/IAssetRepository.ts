import { Asset } from '../entities/Asset';
import type { AssetSearchCriteria, SearchSortParams, SearchFilters } from '../value-objects/SearchCriteria';

// Define interfaces for repository input data
export interface CreateAssetData {
  id?: string; // Optional for auto-generation
  userId: string;
  name: string;
  storagePath: string;
  mimeType: string;
  size: number;
  folderId?: string | null;
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateAssetData {
  name?: string;
  folderId?: string | null;
  storagePath?: string;
  mimeType?: string;
  size?: number;
  updatedAt?: Date;
}

export interface IAssetRepository {
  findById(id: string): Promise<Asset | null>;
  findByFolderId(folderId: string | null, organizationId: string, sortParams?: SearchSortParams, filters?: SearchFilters): Promise<Asset[]>;
  findByName(name: string, organizationId: string, folderId?: string | null): Promise<Asset[]>;
  search(criteria: AssetSearchCriteria): Promise<Asset[]>;
  save(assetData: CreateAssetData): Promise<Asset>;
  update(assetId: string, data: UpdateAssetData): Promise<Asset | null>;
  delete(id: string): Promise<boolean>;
  getStoragePath(assetId: string): Promise<string | null>; // Added for direct path retrieval
  // Potentially add methods for batch operations, counting assets, etc.
} 
