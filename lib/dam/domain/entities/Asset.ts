import { Tag } from './Tag';

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
  }) {
    // Validate required fields
    this.validateRequiredFields(data);
    
    // Validate business rules
    this.validateName(data.name);
    this.validateSize(data.size);
    this.validateMimeType(data.mimeType);
    
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

  // Business Methods
  
  /**
   * Validates if the asset can be renamed to the given name
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
    const lastDotIndex = this._name.lastIndexOf('.');
    return lastDotIndex > 0 ? this._name.substring(lastDotIndex + 1).toLowerCase() : '';
  }

  /**
   * Checks if the asset is an image based on mime type
   */
  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  /**
   * Checks if the asset is a video based on mime type
   */
  isVideo(): boolean {
    return this.mimeType.startsWith('video/');
  }

  /**
   * Checks if the asset is an audio file based on mime type
   */
  isAudio(): boolean {
    return this.mimeType.startsWith('audio/');
  }

  /**
   * Checks if the asset is a document based on mime type
   */
  isDocument(): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf'
    ];
    return documentTypes.includes(this.mimeType);
  }

  /**
   * Checks if the asset is a text file that can be edited
   */
  isEditableText(): boolean {
    const editableTypes = [
      'text/plain',
      'text/markdown',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'text/csv'
    ];
    return editableTypes.includes(this.mimeType);
  }

  /**
   * Gets a human-readable file size
   */
  getHumanReadableSize(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this._size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
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
    const lastDotIndex = this._name.lastIndexOf('.');
    return lastDotIndex > 0 ? this._name.substring(0, lastDotIndex) : this._name;
  }

  // Validation Methods (Private)
  
  private validateRequiredFields(data: any): void {
    const requiredFields = ['id', 'userId', 'name', 'storagePath', 'mimeType', 'size', 'createdAt', 'organizationId'];
    
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        throw new AssetValidationError(`${field} is required`);
      }
    }
  }

  private validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new AssetValidationError('Asset name is required');
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new AssetValidationError('Asset name cannot be empty');
    }
    
    if (trimmedName.length > 255) {
      throw new AssetValidationError('Asset name cannot exceed 255 characters');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(trimmedName)) {
      throw new AssetValidationError('Asset name contains invalid characters. Avoid <, >, :, ", /, \, |, ?, *, and control characters.');
    }
  }

  private validateSize(size: number): void {
    if (typeof size !== 'number' || size < 0) {
      throw new AssetValidationError('Asset size must be a non-negative number');
    }
    
    // Max file size: 100MB (can be configurable)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (size > maxSize) {
      throw new AssetValidationError(`Asset size cannot exceed ${this.formatBytes(maxSize)}`);
    }
  }

  private validateMimeType(mimeType: string): void {
    if (!mimeType || typeof mimeType !== 'string') {
      throw new AssetValidationError('Asset mime type is required');
    }
    
    if (!mimeType.includes('/')) {
      throw new AssetValidationError('Invalid mime type format. Expected format: type/subtype (e.g., image/jpeg)');
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Factory Methods
  
  /**
   * Creates an Asset instance from database data
   */
  static fromDatabaseRow(row: any): Asset {
    if (!row) {
      throw new AssetValidationError('Database row cannot be null or undefined.');
    }
    return new Asset({
      id: row.id,
      userId: row.user_id || row.userId,
      name: row.name,
      storagePath: row.storage_path || row.storagePath,
      mimeType: row.mime_type || row.mimeType,
      size: row.size,
      createdAt: new Date(row.created_at || row.createdAt),
      updatedAt: row.updated_at ? new Date(row.updated_at || row.updatedAt) : undefined,
      folderId: row.folder_id || row.folderId,
      organizationId: row.organization_id || row.organizationId,
      tags: row.tags,
      publicUrl: row.public_url || row.publicUrl,
      folderName: row.folder_name || row.folderName,
    });
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
    };
  }
} 