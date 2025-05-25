import { AssetValidationError } from './Asset';

/**
 * Domain service responsible for Asset validation logic
 * Follows Single Responsibility Principle - only handles validation
 */
export class AssetValidation {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MAX_NAME_LENGTH = 255;

  static validateRequiredFields(data: any): void {
    const requiredFields = ['id', 'userId', 'name', 'storagePath', 'mimeType', 'size', 'createdAt', 'organizationId'];
    
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        throw new AssetValidationError(`${field} is required`);
      }
    }
  }

  static validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new AssetValidationError('Asset name is required');
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new AssetValidationError('Asset name cannot be empty');
    }
    
    if (trimmedName.length > this.MAX_NAME_LENGTH) {
      throw new AssetValidationError(`Asset name cannot exceed ${this.MAX_NAME_LENGTH} characters`);
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(trimmedName)) {
      throw new AssetValidationError('Asset name contains invalid characters. Avoid <, >, :, ", /, \\, |, ?, *, and control characters.');
    }
  }

  static validateSize(size: number): void {
    if (typeof size !== 'number' || size < 0) {
      throw new AssetValidationError('Asset size must be a non-negative number');
    }
    
    if (size > this.MAX_FILE_SIZE) {
      throw new AssetValidationError(`Asset size cannot exceed ${this.formatBytes(this.MAX_FILE_SIZE)}`);
    }
  }

  static validateMimeType(mimeType: string): void {
    if (!mimeType || typeof mimeType !== 'string') {
      throw new AssetValidationError('Asset mime type is required');
    }
    
    if (!mimeType.includes('/')) {
      throw new AssetValidationError('Invalid mime type format. Expected format: type/subtype (e.g., image/jpeg)');
    }
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 
