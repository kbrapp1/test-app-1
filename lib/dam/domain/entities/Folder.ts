import { FolderValidation, FolderValidationError } from './folder/FolderValidation';
import { FolderOperations } from './folder/FolderOperations';

/**
 * Core Folder domain entity
 * 
 * Single Responsibility: Entity data and essential behavior
 * Follows DDD principles with clear separation of concerns
 * Delegates complex operations to specialized domain services
 */
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
    // Validate using dedicated validation service
    FolderValidation.validateRequiredFields(data);
    FolderValidation.validateName(data.name);
    FolderValidation.validateParentFolder(data.parentFolderId);
    
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

  // Essential getters
  get name(): string {
    return this._name;
  }

  get parentFolderId(): string | null | undefined {
    return this._parentFolderId;
  }

  // Delegated business operations using domain services
  
  /**
   * Validates if the folder can be renamed to the given name
   */
  canBeRenamedTo(newName: string): boolean {
    return FolderOperations.canBeRenamedTo(this._name, newName);
  }

  /**
   * Validates if the folder can be moved to the target parent folder
   */
  canBeMovedTo(
    targetParentFolderId: string | null,
    folderHierarchy?: Map<string, { parentFolderId?: string | null }>
  ): boolean {
    return FolderOperations.canBeMovedTo(
      this.id, 
      this._parentFolderId, 
      targetParentFolderId, 
      folderHierarchy
    );
  }

  /**
   * Checks if the folder can be deleted
   */
  canBeDeleted(): boolean {
    return FolderOperations.canBeDeleted(this.has_children);
  }

  /**
   * Checks if this folder is a root folder (has no parent)
   */
  isRootFolder(): boolean {
    return FolderOperations.isRootFolder(this._parentFolderId);
  }

  /**
   * Checks if this folder is a child of the specified parent folder
   */
  isChildOf(parentFolderId: string): boolean {
    return FolderOperations.isChildOf(this._parentFolderId, parentFolderId);
  }

  /**
   * Gets the folder depth level (0 for root, 1 for first level, etc.)
   */
  getDepthLevel(folderHierarchy?: Map<string, { parentFolderId?: string | null }>): number {
    return FolderOperations.getDepthLevel(this.id, this._parentFolderId, folderHierarchy);
  }

  /**
   * Validates if a folder can be created as a child of this folder
   */
  canCreateChildFolder(childName: string): boolean {
    return FolderOperations.canCreateChildFolder(childName);
  }

  /**
   * Gets a display path for the folder (useful for breadcrumbs)
   */
  getDisplayPath(folderHierarchy?: Map<string, { name: string; parentFolderId?: string | null }>): string {
    return FolderOperations.getDisplayPath(this._name, this._parentFolderId, folderHierarchy);
  }

  /**
   * Checks if the folder name would conflict with system reserved names
   */
  hasReservedName(): boolean {
    return FolderValidation.isReservedName(this._name);
  }

  /**
   * Validates folder structure integrity
   */
  validateStructuralIntegrity(
    folderHierarchy?: Map<string, { name: string; parentFolderId?: string | null }>
  ): string[] {
    return FolderOperations.validateStructuralIntegrity(
      this.id, 
      this._name, 
      this._parentFolderId, 
      folderHierarchy
    );
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

// Re-export the validation error for backward compatibility
export { FolderValidationError }; 