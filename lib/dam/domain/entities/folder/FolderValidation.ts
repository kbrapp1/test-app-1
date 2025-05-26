// Domain exceptions for Folder validation
export class FolderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FolderValidationError';
  }
}

/**
 * Domain service for Folder validation logic
 * 
 * Single Responsibility: All folder validation rules and constraints
 * Follows DDD principles with clear domain modeling
 */
export class FolderValidation {
  private static readonly RESERVED_NAMES = [
    'con', 'prn', 'aux', 'nul',
    'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
  ];

  private static readonly MAX_NAME_LENGTH = 255;
  private static readonly INVALID_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1f]/;

  /**
   * Validates required fields for folder creation
   */
  static validateRequiredFields(data: any): void {
    const requiredFields = ['id', 'name', 'userId', 'createdAt', 'organizationId'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new FolderValidationError(`${field} is required`);
      }
    }
  }

  /**
   * Validates folder name according to business rules
   */
  static validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new FolderValidationError('Folder name is required');
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new FolderValidationError('Folder name cannot be empty');
    }
    
    if (trimmedName.length > this.MAX_NAME_LENGTH) {
      throw new FolderValidationError(`Folder name cannot exceed ${this.MAX_NAME_LENGTH} characters`);
    }

    // Check for invalid characters (file system restrictions)
    if (this.INVALID_CHARS_REGEX.test(trimmedName)) {
      throw new FolderValidationError('Folder name contains invalid characters');
    }

    // Check for names that start or end with spaces or dots
    if (trimmedName.startsWith('.') || trimmedName.endsWith('.') || 
        trimmedName.startsWith(' ') || trimmedName.endsWith(' ')) {
      throw new FolderValidationError('Folder name cannot start or end with spaces or dots');
    }

    // Check for reserved names
    if (this.isReservedName(trimmedName)) {
      throw new FolderValidationError('Folder name conflicts with system reserved names');
    }
  }

  /**
   * Validates parent folder ID format
   */
  static validateParentFolder(parentFolderId?: string | null): void {
    // Parent folder can be null (root folder) or a valid UUID string
    if (parentFolderId !== null && parentFolderId !== undefined) {
      if (typeof parentFolderId !== 'string' || parentFolderId.trim().length === 0) {
        throw new FolderValidationError('Parent folder ID must be a valid string or null');
      }
    }
  }

  /**
   * Checks if folder name is reserved by the system
   */
  static isReservedName(name: string): boolean {
    return this.RESERVED_NAMES.includes(name.toLowerCase());
  }

  /**
   * Validates if a folder can be renamed to the given name
   */
  static canBeRenamedTo(currentName: string, newName: string): boolean {
    try {
      this.validateName(newName);
      return newName.trim() !== currentName;
    } catch {
      return false;
    }
  }

  /**
   * Validates if a folder can be created as a child folder
   */
  static canCreateChildFolder(childName: string): boolean {
    try {
      this.validateName(childName);
      return true;
    } catch {
      return false;
    }
  }
} 