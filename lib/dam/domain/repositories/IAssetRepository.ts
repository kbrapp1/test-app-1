import { Asset } from '../entities/Asset';

export interface IAssetRepository {
  findById(id: string): Promise<Asset | null>;
  findByFolderId(folderId: string | null, organizationId: string): Promise<Asset[]>;
  findByName(name: string, organizationId: string, folderId?: string | null): Promise<Asset[]>;
  search(query: string, organizationId: string, folderId?: string | null, mimeTypes?: string[], tags?: string[]): Promise<Asset[]>;
  save(asset: Asset): Promise<Asset>;
  update(assetId: string, data: Partial<Omit<Asset, 'id' | 'organizationId' | 'userId' | 'createdAt'>>): Promise<Asset | null>;
  delete(id: string): Promise<boolean>;
  getStoragePath(assetId: string): Promise<string | null>; // Added for direct path retrieval
  // Potentially add methods for batch operations, counting assets, etc.
} 