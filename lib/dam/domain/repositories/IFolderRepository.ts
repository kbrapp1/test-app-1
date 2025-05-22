import { Folder } from '../entities/Folder';
import { Asset } from '../entities/Asset';

// Define the structure for a node in the folder tree
export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[]; // Recursive definition for children
}

export interface IFolderRepository {
  findById(id: string): Promise<Folder | null>;
  findRootFolders(organizationId: string): Promise<Folder[]>;
  findFoldersByParentId(parentId: string | null, organizationId: string): Promise<Folder[]>;
  findChildren(folderId: string, organizationId: string): Promise<(Folder | Asset)[]>; // Can return mixed content
  findByName(name: string, organizationId: string, parentFolderId?: string | null): Promise<Folder | null>;
  getPath(folderId: string): Promise<{ id: string; name: string }[]>; // For breadcrumbs
  save(folder: Pick<Folder, 'name' | 'parentFolderId' | 'organizationId' | 'userId'>): Promise<Folder>;
  update(folderId: string, data: Partial<Pick<Folder, 'name' | 'parentFolderId'>>): Promise<Folder | null>;
  delete(id: string): Promise<boolean>;
  getFolderTree(organizationId: string, parentFolderId?: string | null): Promise<FolderTreeNode[]>; // Added method
  findFolderPath(folderId: string, organizationId: string): Promise<Folder[]>; // Path to root
  findAllByOrganizationId(organizationId: string): Promise<Folder[]>; // New method
  create(folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder>;
  update(id: string, data: Partial<Omit<Folder, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'userId'>>): Promise<Folder | null>;
  // Potentially: move(folderId: string, newParentFolderId: string | null)
} 