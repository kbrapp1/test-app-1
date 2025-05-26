import { FolderValidation } from './FolderValidation';
import { FolderHierarchy } from './FolderHierarchy';

/**
 * Domain service for Folder business operations
 * 
 * Single Responsibility: Business logic and operational rules
 * Follows DDD principles with clear domain modeling
 */
export class FolderOperations {
  
  /**
   * Checks if the folder can be deleted
   * @param hasChildren - Whether the folder has child items
   * @returns True if folder can be deleted
   */
  static canBeDeleted(hasChildren?: boolean): boolean {
    // Folder can be deleted if it has no children
    return !hasChildren;
  }

  /**
   * Checks if this folder is a root folder (has no parent)
   * @param parentFolderId - The parent folder ID
   * @returns True if this is a root folder
   */
  static isRootFolder(parentFolderId?: string | null): boolean {
    return !parentFolderId;
  }

  /**
   * Checks if this folder is a child of the specified parent folder
   * @param parentFolderId - Current parent folder ID
   * @param targetParentId - Target parent folder ID to check against
   * @returns True if this folder is a child of target parent
   */
  static isChildOf(parentFolderId?: string | null, targetParentId?: string): boolean {
    return parentFolderId === targetParentId;
  }

  /**
   * Validates if the folder can be renamed to the given name
   * @param currentName - Current folder name
   * @param newName - New name to validate
   * @returns True if rename is valid
   */
  static canBeRenamedTo(currentName: string, newName: string): boolean {
    return FolderValidation.canBeRenamedTo(currentName, newName);
  }

  /**
   * Validates if the folder can be moved to the target parent folder
   * @param folderId - The folder ID to move
   * @param currentParentId - Current parent folder ID
   * @param targetParentId - Target parent folder ID
   * @param folderHierarchy - Map of all folders for validation
   * @returns True if move is valid
   */
  static canBeMovedTo(
    folderId: string,
    currentParentId: string | null | undefined,
    targetParentId: string | null,
    folderHierarchy?: Map<string, { parentFolderId?: string | null }>
  ): boolean {
    return FolderHierarchy.canBeMovedTo(folderId, currentParentId, targetParentId, folderHierarchy);
  }

  /**
   * Validates if a folder can be created as a child of this folder
   * @param childName - Name of the child folder to validate
   * @returns True if child can be created
   */
  static canCreateChildFolder(childName: string): boolean {
    return FolderValidation.canCreateChildFolder(childName);
  }

  /**
   * Gets the folder depth level (0 for root, 1 for first level, etc.)
   * @param folderId - The folder ID
   * @param parentFolderId - The parent folder ID (null for root)
   * @param folderHierarchy - Map of all folders for hierarchy traversal
   * @returns Depth level
   */
  static getDepthLevel(
    folderId: string,
    parentFolderId: string | null | undefined,
    folderHierarchy?: Map<string, { parentFolderId?: string | null }>
  ): number {
    return FolderHierarchy.getDepthLevel(folderId, parentFolderId, folderHierarchy);
  }

  /**
   * Gets a display path for the folder (useful for breadcrumbs)
   * @param folderName - Current folder name
   * @param parentFolderId - Parent folder ID
   * @param folderHierarchy - Map of all folders for path building
   * @returns Display path string
   */
  static getDisplayPath(
    folderName: string,
    parentFolderId: string | null | undefined,
    folderHierarchy?: Map<string, { name: string; parentFolderId?: string | null }>
  ): string {
    return FolderHierarchy.getDisplayPath(folderName, parentFolderId, folderHierarchy);
  }

  /**
   * Validates folder structure integrity
   * @param folderId - The folder ID to validate
   * @param folderName - The folder name
   * @param parentFolderId - The parent folder ID
   * @param folderHierarchy - Map of all folders for validation
   * @returns Array of validation error messages
   */
  static validateStructuralIntegrity(
    folderId: string,
    folderName: string,
    parentFolderId: string | null | undefined,
    folderHierarchy?: Map<string, { name: string; parentFolderId?: string | null }>
  ): string[] {
    const errors = FolderHierarchy.validateStructuralIntegrity(
      folderId, 
      folderName, 
      parentFolderId, 
      folderHierarchy
    );
    
    // Add additional business rule validations
    if (FolderValidation.isReservedName(folderName)) {
      errors.push('Folder name conflicts with system reserved names');
    }
    
    return errors;
  }
} 