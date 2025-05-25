// Domain exceptions for Folder
export class FolderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FolderValidationError';
  }
}

export class Folder {
  public readonly id: string;
  private _name: string;
  public readonly userId: string;
  public readonly createdAt: Date;
  public readonly updatedAt?: Date;
  private _parentFolderId?: string | null;
  public readonly organizationId: string;
  public readonly has_children?: boolean;

  constructor(data: {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
    updatedAt?: Date;
    parentFolderId?: string | null;
    organizationId: string;
    has_children?: boolean;
  }) {
    // Validate required fields
    this.validateRequiredFields(data);
    
    // Validate business rules
    this.validateName(data.name);
    this.validateParentFolder(data.parentFolderId);
    
    // Assign values
    this.id = data.id;
    this._name = data.name.trim();
    this.userId = data.userId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this._parentFolderId = data.parentFolderId;
    this.organizationId = data.organizationId;
    this.has_children = data.has_children;
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get parentFolderId(): string | null | undefined {
    return this._parentFolderId;
  }

  // Business Methods
  
  /**
   * Validates if the folder can be renamed to the given name
   */
  canBeRenamedTo(newName: string): boolean {
    try {
      this.validateName(newName);
      return newName.trim() !== this._name;
    } catch {
      return false;
    }
  }

  /**
   * Validates if the folder can be moved to the target parent folder
   */
  canBeMovedTo(targetParentFolderId: string | null): boolean {
    // Folder can be moved if target parent is different from current
    if (targetParentFolderId === this._parentFolderId) {
      return false;
    }
    
    // Cannot move folder to itself or its descendants (circular reference check)
    if (targetParentFolderId === this.id) {
      return false;
    }
    
    return true;
  }

  /**
   * Checks if the folder can be deleted
   */
  canBeDeleted(): boolean {
    // Folder can be deleted if it has no children
    // Note: This should ideally be checked against actual database state
    return !this.has_children;
  }

  /**
   * Checks if this folder is a root folder (has no parent)
   */
  isRootFolder(): boolean {
    return !this._parentFolderId;
  }

  /**
   * Checks if this folder is a child of the specified parent folder
   */
  isChildOf(parentFolderId: string): boolean {
    return this._parentFolderId === parentFolderId;
  }

  /**
   * Gets the folder depth level (0 for root, 1 for first level, etc.)
   * Note: This requires the full folder hierarchy to calculate accurately
   */
  getDepthLevel(folderHierarchy?: Map<string, Folder>): number {
    if (this.isRootFolder()) {
      return 0;
    }
    
    if (!folderHierarchy || !this._parentFolderId) {
      // If we don't have hierarchy info, estimate based on parent existence
      return this._parentFolderId ? 1 : 0;
    }
    
    let depth = 0;
    let currentFolderId: string | null = this._parentFolderId;
    
    while (currentFolderId && depth < 100) { // Safety limit to prevent infinite loops
      const parentFolder = folderHierarchy.get(currentFolderId);
      if (!parentFolder) break;
      
      depth++;
      currentFolderId = parentFolder.parentFolderId || null;
    }
    
    return depth;
  }

  /**
   * Validates if a folder can be created as a child of this folder
   */
  canCreateChildFolder(childName: string): boolean {
    try {
      this.validateName(childName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets a display path for the folder (useful for breadcrumbs)
   * Note: This requires the full folder hierarchy to build the complete path
   */
  getDisplayPath(folderHierarchy?: Map<string, Folder>): string {
    if (this.isRootFolder()) {
      return this._name;
    }
    
    if (!folderHierarchy || !this._parentFolderId) {
      return this._name;
    }
    
    const pathParts: string[] = [];
    let currentFolder: Folder | undefined = this;
    
    while (currentFolder && pathParts.length < 100) { // Safety limit
      pathParts.unshift(currentFolder.name);
      
      if (currentFolder.isRootFolder()) {
        break;
      }
      
      currentFolder = currentFolder._parentFolderId ? 
        folderHierarchy.get(currentFolder._parentFolderId) : 
        undefined;
    }
    
    return pathParts.join(' / ');
  }

  /**
   * Checks if the folder name would conflict with system reserved names
   */
  hasReservedName(): boolean {
    const reservedNames = [
      'con', 'prn', 'aux', 'nul',
      'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
      'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
    ];
    
    return reservedNames.includes(this._name.toLowerCase());
  }

  /**
   * Validates folder structure integrity
   */
  validateStructuralIntegrity(folderHierarchy?: Map<string, Folder>): string[] {
    const errors: string[] = [];
    
    // Check for circular references
    if (this.hasCircularReference(folderHierarchy)) {
      errors.push('Circular reference detected in folder hierarchy');
    }
    
    // Check for reserved names
    if (this.hasReservedName()) {
      errors.push('Folder name conflicts with system reserved names');
    }
    
    return errors;
  }

  // Validation Methods (Private)
  
  private validateRequiredFields(data: any): void {
    const requiredFields = ['id', 'name', 'userId', 'createdAt', 'organizationId'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new FolderValidationError(`${field} is required`);
      }
    }
  }

  private validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new FolderValidationError('Folder name is required');
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new FolderValidationError('Folder name cannot be empty');
    }
    
    if (trimmedName.length > 255) {
      throw new FolderValidationError('Folder name cannot exceed 255 characters');
    }

    // Check for invalid characters (same as file system restrictions)
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(trimmedName)) {
      throw new FolderValidationError('Folder name contains invalid characters');
    }

    // Check for names that start or end with spaces or dots
    if (trimmedName.startsWith('.') || trimmedName.endsWith('.') || 
        trimmedName.startsWith(' ') || trimmedName.endsWith(' ')) {
      throw new FolderValidationError('Folder name cannot start or end with spaces or dots');
    }
  }

  private validateParentFolder(parentFolderId?: string | null): void {
    // Parent folder can be null (root folder) or a valid UUID string
    if (parentFolderId !== null && parentFolderId !== undefined) {
      if (typeof parentFolderId !== 'string' || parentFolderId.trim().length === 0) {
        throw new FolderValidationError('Parent folder ID must be a valid string or null');
      }
    }
  }

  private hasCircularReference(folderHierarchy?: Map<string, Folder>): boolean {
    if (!folderHierarchy || !this._parentFolderId) {
      return false;
    }
    
    const visitedIds = new Set<string>();
    let currentFolderId: string | null = this._parentFolderId;
    
    while (currentFolderId) {
      if (visitedIds.has(currentFolderId) || currentFolderId === this.id) {
        return true; // Circular reference found
      }
      
      visitedIds.add(currentFolderId);
      const parentFolder = folderHierarchy.get(currentFolderId);
      currentFolderId = parentFolder?.parentFolderId || null;
      
      // Safety check to prevent infinite loops
      if (visitedIds.size > 100) {
        return true;
      }
    }
    
    return false;
  }

  // Factory Methods
  
  /**
   * Creates a Folder instance from database data
   */
  static fromDatabaseRow(row: any): Folder {
    return new Folder({
      id: row.id,
      name: row.name,
      userId: row.user_id || row.userId,
      createdAt: new Date(row.created_at || row.createdAt),
      updatedAt: row.updated_at || row.updatedAt ? new Date(row.updated_at || row.updatedAt) : undefined,
      parentFolderId: row.parent_folder_id || row.parentFolderId,
      organizationId: row.organization_id || row.organizationId,
      has_children: row.has_children
    });
  }

  /**
   * Creates a root folder
   */
  static createRoot(data: {
    id: string;
    name: string;
    userId: string;
    organizationId: string;
    createdAt?: Date;
  }): Folder {
    return new Folder({
      id: data.id,
      name: data.name,
      userId: data.userId,
      organizationId: data.organizationId,
      createdAt: data.createdAt || new Date(),
      parentFolderId: null,
      has_children: false
    });
  }

  /**
   * Converts the Folder to a plain object (for serialization)
   */
  toPlainObject(): {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
    updatedAt?: Date;
    parentFolderId?: string | null;
    organizationId: string;
    has_children?: boolean;
  } {
    return {
      id: this.id,
      name: this._name,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      parentFolderId: this._parentFolderId,
      organizationId: this.organizationId,
      has_children: this.has_children
    };
  }
} 
