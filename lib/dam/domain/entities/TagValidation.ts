import { TagValidationError } from './Tag';

/**
 * Domain service responsible for Tag validation logic
 * Follows Single Responsibility Principle - only handles validation
 */
export class TagValidation {
  private static readonly MAX_NAME_LENGTH = 50;
  private static readonly MIN_NAME_LENGTH = 2;

  static validateRequiredFields(data: Record<string, unknown>): void {
    const requiredFields = ['id', 'name', 'userId', 'organizationId', 'createdAt'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new TagValidationError(`${field} is required`);
      }
    }
  }

  static validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new TagValidationError('Tag name is required');
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new TagValidationError('Tag name cannot be empty');
    }
    
    if (trimmedName.length > this.MAX_NAME_LENGTH) {
      throw new TagValidationError(`Tag name cannot exceed ${this.MAX_NAME_LENGTH} characters`);
    }

    if (trimmedName.length < this.MIN_NAME_LENGTH) {
      throw new TagValidationError(`Tag name must be at least ${this.MIN_NAME_LENGTH} characters long`);
    }

    // Check for invalid characters - tags should be more restrictive than files/folders
    const invalidChars = /[<>:"/\\|?*\x00-\x1f@#$%^&()=+[\]{};'.,!~`]/;
    if (invalidChars.test(trimmedName)) {
      throw new TagValidationError('Tag name contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed');
    }

    // Check for consecutive spaces
    if (trimmedName.includes('  ')) {
      throw new TagValidationError('Tag name cannot contain consecutive spaces');
    }

    // Check that tag starts and ends with alphanumeric characters
    if (!/^[a-zA-Z0-9].*[a-zA-Z0-9]$/.test(trimmedName) && trimmedName.length > 1) {
      throw new TagValidationError('Tag name must start and end with letters or numbers');
    }
  }

  /**
   * Checks if the tag name would conflict with reserved tag names
   */
  static hasReservedName(name: string): boolean {
    const reservedNames = [
      'system', 'admin', 'root', 'default', 'null', 'undefined'
    ];
    
    return reservedNames.includes(name.toLowerCase());
  }

  /**
   * Validates tag integrity and returns any issues
   */
  static validateIntegrity(name: string): string[] {
    const errors: string[] = [];
    
    // Check for reserved names
    if (this.hasReservedName(name)) {
      errors.push('Tag name conflicts with system reserved names');
    }
    
    // Check for leading/trailing whitespace
    if (name !== name.trim()) {
      errors.push('Tag name has leading or trailing whitespace');
    }
    
    return errors;
  }
} 
