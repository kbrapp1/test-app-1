import type { Folder } from '../entities/Folder';
import { Asset } from '../entities/Asset';
import type { SearchSortParams, SearchFilters, FolderSearchCriteria } from '../value-objects/SearchCriteria';

// Define interfaces for repository input data
export interface CreateFolderData {
  name: string;
  parentFolderId?: string | null;
  organizationId: string;
  userId: string;
}

export interface UpdateFolderData {
  name?: string;
  parentFolderId?: string | null;
}

// Define the structure for a node in the folder tree
export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[]; // Recursive definition for children
}

export interface IFolderRepository {
  findById(id: string, organizationId: string): Promise<Folder | null>;
  findRootFolders(organizationId: string): Promise<Folder[]>;
  findFoldersByParentId(
    parentId: string | null, 
    organizationId: string,
    sortParams?: SearchSortParams,
    filters?: SearchFilters
  ): Promise<Folder[]>;
  findChildren(folderId: string, organizationId: string): Promise<(Folder | Asset)[]>; // Can return mixed content
  findByName(name: string, organizationId: string, parentFolderId?: string | null): Promise<Folder | null>;
  getPath(folderId: string, organizationId: string): Promise<string>;
  update(id: string, updates: UpdateFolderData, organizationId: string): Promise<Folder>;
  delete(id: string, organizationId: string): Promise<void>;
  getFolderTree(organizationId: string, parentFolderId?: string | null): Promise<FolderTreeNode[]>;
  findAllByOrganizationId(organizationId: string): Promise<Folder[]>;
  create(folder: CreateFolderData): Promise<Folder>;
  save(folder: CreateFolderData): Promise<Folder>;
  search(
    organizationId: string, 
    searchQuery: string, 
    currentFolderIdForContext?: string | null, 
    limitOptions?: { offset?: number; limit?: number }, 
    sortParams?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<Folder[]>;
  // Potentially: move(folderId: string, newParentFolderId: string | null)
} 
