import { type FolderNode } from '../folderStore';
import { type Folder as DomainFolder, Folder } from '@/lib/dam/domain/entities/Folder';
import {
  findAndUpdateNode,
  findAndRemoveNode,
  addNodeToParent,
  buildNodeMap
} from '../folderStoreUtils';

/**
 * Domain Service: Folder Tree Operations
 * 
 * Single Responsibility: Tree structure manipulation business logic
 * Handles folder hierarchy operations following DDD principles
 */
export class FolderTreeService {
  /**
   * Converts domain folders to folder nodes with UI state
   */
  static createFolderNodes(
    folders: DomainFolder[], 
    existingNodes?: FolderNode[]
  ): FolderNode[] {
    const existingNodeMap = existingNodes ? buildNodeMap(existingNodes) : new Map();
    
    return folders.map(folder => {
      const existingNode = existingNodeMap.get(folder.id);
      
      return Object.assign(folder, {
        children: existingNode?.children ?? null,
        isExpanded: existingNode?.isExpanded ?? false,
        isLoading: existingNode?.isLoading ?? false,
        hasError: existingNode?.hasError ?? false,
      }) as FolderNode;
    });
  }

  /**
   * Filters and sorts root folders
   */
  static getRootFolders(folderNodes: FolderNode[]): FolderNode[] {
    return folderNodes
      .filter(folder => folder.parentFolderId === null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Expands parent folders up to a specific folder
   */
  static expandParentsToFolder(
    rootFolders: FolderNode[], 
    targetFolderId: string
  ): FolderNode[] {
    let updatedFolders = [...rootFolders];
    const nodeMap = buildNodeMap(updatedFolders);
    
    const targetNode = nodeMap.get(targetFolderId);
    if (!targetNode) return updatedFolders;

    let parentId = targetNode.parentFolderId;
    while (parentId) {
      const parentNode = nodeMap.get(parentId);
      if (parentNode) {
        updatedFolders = findAndUpdateNode(
          updatedFolders,
          parentId,
          (node) => ({ ...node, isExpanded: true })
        );
        parentId = parentNode.parentFolderId;
      } else {
        parentId = null;
      }
    }
    
    return updatedFolders;
  }

  /**
   * Adds a new folder to the tree structure
   */
  static addFolderToTree(
    rootFolders: FolderNode[], 
    newFolder: DomainFolder
  ): FolderNode[] {
    const newNode = Object.assign(newFolder, {
      children: null,
      isExpanded: false,
      isLoading: false,
      hasError: false,
    }) as FolderNode;

    const expandedFolders = this.expandParentsToFolder(rootFolders, newFolder.id);
    return addNodeToParent(expandedFolders, newNode);
  }

  /**
   * Moves a folder from one location to another
   */
  static moveFolderInTree(
    rootFolders: FolderNode[], 
    folderId: string, 
    newParentFolderId: string | null
  ): FolderNode[] {
    const nodeMap = buildNodeMap(rootFolders);
    const folderToMove = nodeMap.get(folderId);
    
    if (!folderToMove) {
      console.warn(`Folder with ID ${folderId} not found in tree`);
      return rootFolders;
    }

    // Remove folder from current location
    const rootFoldersWithoutMovedFolder = findAndRemoveNode(rootFolders, folderId);
    
    // Create updated folder with new parent
    const updatedFolder = this.createMovedFolder(folderToMove, newParentFolderId);
    
    // Add folder to new location
    return addNodeToParent(rootFoldersWithoutMovedFolder, updatedFolder);
  }

  /**
   * Creates a moved folder with updated parent relationship
   */
  private static createMovedFolder(
    folderToMove: FolderNode, 
    newParentFolderId: string | null
  ): FolderNode {
    const updatedDomainFolder = new Folder({
      id: folderToMove.id,
      name: folderToMove.name,
      userId: folderToMove.userId,
      createdAt: folderToMove.createdAt,
      updatedAt: folderToMove.updatedAt,
      parentFolderId: newParentFolderId,
      organizationId: folderToMove.organizationId,
      has_children: folderToMove.has_children,
    });
    
    return Object.assign(updatedDomainFolder, {
      children: folderToMove.children,
      isExpanded: folderToMove.isExpanded,
      isLoading: folderToMove.isLoading,
      hasError: folderToMove.hasError,
      type: folderToMove.type,
      ownerName: folderToMove.ownerName,
    }) as FolderNode;
  }

  /**
   * Updates folder children with loading states
   */
  static setFolderChildren(
    rootFolders: FolderNode[], 
    parentFolderId: string, 
    children: DomainFolder[]
  ): FolderNode[] {
    const childrenNodes = this.createFolderNodes(children);
    
    return findAndUpdateNode(rootFolders, parentFolderId, (parentNode) => ({
      ...parentNode,
      children: childrenNodes.sort((a, b) => a.name.localeCompare(b.name)),
      isLoading: false,
      hasError: false,
    }));
  }

  /**
   * Sets folder loading state
   */
  static setFolderLoading(
    rootFolders: FolderNode[], 
    folderId: string, 
    isLoading: boolean
  ): FolderNode[] {
    return findAndUpdateNode(rootFolders, folderId, (node) => ({
      ...node,
      isLoading,
      hasError: false,
    }));
  }

  /**
   * Sets folder error state
   */
  static setFolderError(
    rootFolders: FolderNode[], 
    folderId: string
  ): FolderNode[] {
    return findAndUpdateNode(rootFolders, folderId, (node) => ({
      ...node,
      isLoading: false,
      hasError: true,
      children: [],
    }));
  }
} 