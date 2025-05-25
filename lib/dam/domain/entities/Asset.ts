import { Tag } from './Tag';
import { AssetValidation } from './AssetValidation';
import { AssetTypeChecker } from './AssetTypeChecker';

// Domain exceptions for Asset
export class AssetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetValidationError';
  }
}

export interface AssetProps {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  storagePath: string;
  mimeType: string;
  size: number;
  folderId?: string | null;
  organizationId: string;
  tags?: Tag[];
  publicUrl?: string | null;
  folderName?: string | null;
  userFullName?: string | null;
}

export class Asset {
  public readonly id: string;
  public readonly userId: string;
  private _name: string;
  public readonly storagePath: string;
  public readonly mimeType: string;
  private _size: number;
  public readonly createdAt: Date;
  public readonly updatedAt?: Date;
  private _folderId?: string | null;
  public readonly organizationId: string;
  public readonly tags?: Tag[];
  public readonly publicUrl?: string;
  private _folderName?: string | null;
  private _userFullName?: string | null;

  constructor(data: {
    id: string;
    userId: string;
    name: string;
    storagePath: string;
    mimeType: string;
    size: number;
    createdAt: Date;
    updatedAt?: Date;
    folderId?: string | null;
    organizationId: string;
    tags?: Tag[];
    publicUrl?: string;
    folderName?: string | null;
    userFullName?: string | null;
  }) {
    // Validate using domain service
    AssetValidation.validateRequiredFields(data);
    AssetValidation.validateName(data.name);
    AssetValidation.validateSize(data.size);
    AssetValidation.validateMimeType(data.mimeType);
    
    // Assign values
    this.id = data.id;
    this.userId = data.userId;
    this._name = data.name.trim();
    this.storagePath = data.storagePath;
    this.mimeType = data.mimeType;
    this._size = data.size;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this._folderId = data.folderId;
    this.organizationId = data.organizationId;
    this.tags = data.tags;
    this.publicUrl = data.publicUrl;
    this._folderName = data.folderName;
    this._userFullName = data.userFullName;
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get size(): number {
    return this._size;
  }

  get folderId(): string | null | undefined {
    return this._folderId;
  }

  get folderName(): string | null | undefined {
    return this._folderName;
  }

  get userFullName(): string | null | undefined {
    return this._userFullName;
  }

  // Business Methods
  
  /**
   * Validates if the asset can be renamed to the given name
   */
  canBeRenamedTo(newName: string): boolean {
    try {
      AssetValidation.validateName(newName);
      return newName.trim() !== this._name;
    } catch {
      return false;
    }
  }

  /**
   * Validates if the asset can be moved to the target folder
   */
  canBeMovedTo(targetFolderId: string | null): boolean {
    // Asset can be moved if target folder is different from current
    return targetFolderId !== this._folderId;
  }

  /**
   * Checks if the asset can be deleted (business rules can be added here)
   */
  canBeDeleted(): boolean {
    // For now, all assets can be deleted
    // Future: Add business rules like checking if asset is referenced elsewhere
    return true;
  }

  /**
   * Gets the file extension from the asset name
   */
  getFileExtension(): string {
    return AssetTypeChecker.getFileExtension(this._name);
  }

  /**
   * Checks if the asset is an image based on mime type
   */
  isImage(): boolean {
    return AssetTypeChecker.isImage(this.mimeType);
  }

  /**
   * Checks if the asset is a video based on mime type
   */
  isVideo(): boolean {
    return AssetTypeChecker.isVideo(this.mimeType);
  }

  /**
   * Checks if the asset is an audio file based on mime type
   */
  isAudio(): boolean {
    return AssetTypeChecker.isAudio(this.mimeType);
  }

  /**
   * Checks if the asset is a document based on mime type
   */
  isDocument(): boolean {
    return AssetTypeChecker.isDocument(this.mimeType);
  }

  /**
   * Checks if the asset is a text file that can be edited
   */
  isEditableText(): boolean {
    return AssetTypeChecker.isEditableText(this.mimeType);
  }

  /**
   * Gets a human-readable file size
   */
  getHumanReadableSize(): string {
    return AssetTypeChecker.getHumanReadableSize(this._size);
  }

  /**
   * Checks if the asset has a specific tag
   */
  hasTag(tagId: string): boolean {
    return this.tags?.some(tag => tag.id === tagId) ?? false;
  }

  /**
   * Gets the display name without extension (useful for UI)
   */
  getNameWithoutExtension(): string {
    return AssetTypeChecker.getNameWithoutExtension(this._name);
  }



  /**
   * Converts the Asset to a plain object (for serialization)
   */
  toPlainObject(): AssetProps {
    return {
      id: this.id,
      userId: this.userId,
      name: this._name,
      storagePath: this.storagePath,
      mimeType: this.mimeType,
      size: this._size,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      folderId: this._folderId,
      organizationId: this.organizationId,
      tags: this.tags,
      publicUrl: this.publicUrl,
      folderName: this._folderName,
      userFullName: this._userFullName,
    };
  }
} 
