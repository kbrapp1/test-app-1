/**
 * Domain service for Folder hierarchy operations
 * 
 * Single Responsibility: Tree structure operations and hierarchy logic
 * Follows DDD principles with clear domain modeling
 */
export class FolderHierarchy {
  private static readonly MAX_DEPTH_SAFETY_LIMIT = 100;

  /**
   * Calculates the depth level of a folder in the hierarchy
   * @param folderId - The folder ID to calculate depth for
   * @param parentFolderId - The parent folder ID (null for root)
   * @param folderHierarchy - Map of all folders for hierarchy traversal
   * @returns Depth level (0 for root, 1 for first level, etc.)
   */
  static getDepthLevel(
    folderId: string,
    parentFolderId: string | null | undefined,
    folderHierarchy?: Map<string, { parentFolderId?: string | null }>
  ): number {
    if (!parentFolderId) {
      return 0; // Root folder
    }
    
    if (!folderHierarchy) {
      // If we don't have hierarchy info, estimate based on parent existence
      return parentFolderId ? 1 : 0;
    }
    
    let depth = 0;
    let currentFolderId: string | null = parentFolderId;
    
    while (currentFolderId && depth < this.MAX_DEPTH_SAFETY_LIMIT) {
      const parentFolder = folderHierarchy.get(currentFolderId);
      if (!parentFolder) break;
      
      depth++;
      currentFolderId = parentFolder.parentFolderId || null;
    }
    
    return depth;
  }

  /**
   * Builds a display path for the folder (useful for breadcrumbs)
   * @param folderName - Current folder name
   * @param parentFolderId - Parent folder ID
   * @param folderHierarchy - Map of all folders for path building
   * @returns Display path string (e.g., "Root / Parent / Current")
   */
  static getDisplayPath(
    folderName: string,
    parentFolderId: string | null | undefined,
    folderHierarchy?: Map<string, { name: string; parentFolderId?: string | null }>
  ): string {
    if (!parentFolderId) {
      return folderName; // Root folder
    }
    
    if (!folderHierarchy) {
      return folderName;
    }
    
    const pathParts: string[] = [];
    let currentFolder: { name: string; parentFolderId?: string | null } | null = { name: folderName, parentFolderId };
    
    while (currentFolder && pathParts.length < this.MAX_DEPTH_SAFETY_LIMIT) {
      pathParts.unshift(currentFolder.name);
      
      if (!currentFolder.parentFolderId) {
        break; // Reached root
      }
      
      currentFolder = folderHierarchy.get(currentFolder.parentFolderId) || null;
    }
    
    return pathParts.join(' / ');
  }

  /**
   * Checks for circular references in folder hierarchy
   * @param folderId - The current folder ID
   * @param parentFolderId - The parent folder ID to check
   * @param folderHierarchy - Map of all folders for hierarchy traversal
   * @returns True if circular reference exists
   */
  static hasCircularReference(
    folderId: string,
    parentFolderId: string | null | undefined,
    folderHierarchy?: Map<string, { parentFolderId?: string | null }>
  ): boolean {
    if (!folderHierarchy || !parentFolderId) {
      return false;
    }
    
    const visitedIds = new Set<string>();
    let currentFolderId: string | null = parentFolderId;
    
    while (currentFolderId) {
      if (visitedIds.has(currentFolderId) || currentFolderId === folderId) {
        return true; // Circular reference found
      }
      
      visitedIds.add(currentFolderId);
      const parentFolder = folderHierarchy.get(currentFolderId);
      currentFolderId = parentFolder?.parentFolderId || null;
      
      // Safety check to prevent infinite loops
      if (visitedIds.size > this.MAX_DEPTH_SAFETY_LIMIT) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validates if a folder can be moved to a target parent
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
    // Folder can be moved if target parent is different from current
    if (targetParentId === currentParentId) {
      return false;
    }
    
    // Cannot move folder to itself
    if (targetParentId === folderId) {
      return false;
    }
    
    // Check for circular references with the new parent
    if (targetParentId && folderHierarchy) {
      return !this.hasCircularReference(folderId, targetParentId, folderHierarchy);
    }
    
    return true;
  }

  /**
   * Validates structural integrity of folder hierarchy
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
    const errors: string[] = [];
    
    // Check for circular references
    if (this.hasCircularReference(folderId, parentFolderId, folderHierarchy)) {
      errors.push('Circular reference detected in folder hierarchy');
    }
    
    return errors;
  }
} 