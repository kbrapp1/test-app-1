/**
 * TextInput Value Object
 * Encapsulates TTS text input with validation and business rules
 */

export class TextInput {
  private readonly _value: string;
  
  // Business constants
  public static readonly MIN_LENGTH = 1;
  public static readonly MAX_LENGTH = 5000;
  
  constructor(text: string) {
    this.validateText(text);
    this._value = this.normalizeText(text);
  }

  get value(): string {
    return this._value;
  }

  /**
   * Get character count for UI display
   */
  get characterCount(): number {
    return this._value.length;
  }

  /**
   * Get word count estimate
   */
  get wordCount(): number {
    return this._value.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Check if text is at or near the length limit
   */
  get isNearLimit(): boolean {
    return this._value.length > TextInput.MAX_LENGTH * 0.9; // 90% of max
  }

  /**
   * Get remaining characters before limit
   */
  get remainingCharacters(): number {
    return Math.max(0, TextInput.MAX_LENGTH - this._value.length);
  }

  /**
   * Check if text contains potentially problematic content for TTS
   */
  get hasSpecialCharacters(): boolean {
    // Check for excessive special chars that might not render well in audio
    const specialCharRatio = (this._value.match(/[^\w\s.,!?;:'"()-]/g) || []).length / this._value.length;
    return specialCharRatio > 0.1; // More than 10% special characters
  }

  /**
   * Get text formatted for TTS (cleaned up)
   */
  get forTts(): string {
    return this._value
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Split text into chunks for providers with length limits
   */
  splitIntoChunks(maxChunkLength: number = 1000): TextInput[] {
    if (this._value.length <= maxChunkLength) {
      return [this];
    }

    const chunks: string[] = [];
    const sentences = this._value.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + sentence.trim();
      
      if (potentialChunk.length <= maxChunkLength) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
          currentChunk = sentence.trim();
        } else {
          // Single sentence is too long, force split
          chunks.push(sentence.trim().substring(0, maxChunkLength));
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }

    return chunks.map(chunk => new TextInput(chunk));
  }

  /**
   * Validate text input according to business rules
   */
  private validateText(text: string): void {
    if (typeof text !== 'string') {
      throw new Error('Text input must be a string');
    }

    const trimmed = text.trim();
    
    if (trimmed.length < TextInput.MIN_LENGTH) {
      throw new Error('Input text cannot be empty.');
    }

    if (text.length > TextInput.MAX_LENGTH) {
      throw new Error(`Input text exceeds maximum length of ${TextInput.MAX_LENGTH} characters.`);
    }

    // Check for null bytes or other problematic characters
    if (text.includes('\0')) {
      throw new Error('Text input contains invalid characters.');
    }

    // Check for excessively long lines that might cause issues
    const lines = text.split('\n');
    const maxLineLength = 1000;
    for (const line of lines) {
      if (line.length > maxLineLength) {
        throw new Error(`Text contains lines that are too long (max ${maxLineLength} characters per line).`);
      }
    }
  }

  /**
   * Normalize text input (clean up formatting)
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')   // Handle old Mac line endings
      .replace(/\t/g, ' ')    // Convert tabs to spaces
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
      .trim();
  }

  /**
   * Convert to string for external use
   */
  toString(): string {
    return this._value;
  }

  /**
   * Check equality with another TextInput or string
   */
  equals(other: TextInput | string): boolean {
    if (typeof other === 'string') {
      try {
        other = new TextInput(other);
      } catch {
        return false;
      }
    }
    return this._value === other._value;
  }

  /**
   * Create TextInput with validation
   */
  static create(text: string): TextInput {
    return new TextInput(text);
  }

  /**
   * Create TextInput for testing (bypasses some validation)
   */
  static createForTest(text: string): TextInput {
    const instance = Object.create(TextInput.prototype);
    instance._value = text;
    return instance;
  }

  /**
   * Check if a string would be valid without creating the object
   */
  static isValid(text: string): boolean {
    try {
      new TextInput(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation error message for a string without throwing
   */
  static getValidationError(text: string): string | null {
    try {
      new TextInput(text);
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  }
} 