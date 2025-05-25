/**
 * Domain service for checking asset types and file properties
 * Follows Single Responsibility Principle - only handles type checking
 */
export class AssetTypeChecker {
  private static readonly DOCUMENT_TYPES = [
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

  private static readonly EDITABLE_TEXT_TYPES = [
    'text/plain',
    'text/markdown',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'text/csv'
  ];

  /**
   * Checks if the asset is an image based on mime type
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Checks if the asset is a video based on mime type
   */
  static isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  /**
   * Checks if the asset is an audio file based on mime type
   */
  static isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }

  /**
   * Checks if the asset is a document based on mime type
   */
  static isDocument(mimeType: string): boolean {
    return this.DOCUMENT_TYPES.includes(mimeType);
  }

  /**
   * Checks if the asset is a text file that can be edited
   */
  static isEditableText(mimeType: string): boolean {
    return this.EDITABLE_TEXT_TYPES.includes(mimeType);
  }

  /**
   * Gets the file extension from a filename
   */
  static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1).toLowerCase() : '';
  }

  /**
   * Gets the display name without extension
   */
  static getNameWithoutExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  }

  /**
   * Gets a human-readable file size
   */
  static getHumanReadableSize(sizeInBytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = sizeInBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
} 
