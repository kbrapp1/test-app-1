export interface Result<T, E> {
  isSuccess(): boolean;
  getValue(): T;
  getError(): E;
}

export class SuccessResult<T, E> implements Result<T, E> {
  constructor(private value: T) {}
  
  isSuccess(): boolean {
    return true;
  }
  
  getValue(): T {
    return this.value;
  }
  
  getError(): E {
    throw new Error('Cannot get error from success result');
  }
}

export class ErrorResult<T, E> implements Result<T, E> {
  constructor(private error: E) {}
  
  isSuccess(): boolean {
    return false;
  }
  
  getValue(): T {
    throw new Error('Cannot get value from error result');
  }
  
  getError(): E {
    return this.error;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Prompt {
  private constructor(
    private readonly _text: string,
    private readonly _length: number,
    private readonly _wordCount: number,
    private readonly _hasSpecialCharacters: boolean
  ) {}

  get text(): string {
    return this._text;
  }

  get length(): number {
    return this._length;
  }

  get wordCount(): number {
    return this._wordCount;
  }

  get hasSpecialCharacters(): boolean {
    return this._hasSpecialCharacters;
  }

  static create(text: string): Result<Prompt, ValidationError> {
    const validation = this.validatePrompt(text);
    if (validation.length > 0) {
      return new ErrorResult(new ValidationError(validation.join(', ')));
    }

    const cleanText = text.trim();
    const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
    const hasSpecialCharacters = /[<>{}[\]\\|`~]/.test(cleanText);

    const prompt = new Prompt(cleanText, cleanText.length, wordCount, hasSpecialCharacters);
    return new SuccessResult(prompt);
  }

  static isValid(text: string): boolean {
    return this.validatePrompt(text).length === 0;
  }

  private static validatePrompt(text: string): string[] {
    const errors: string[] = [];
    
    if (!text || typeof text !== 'string') {
      errors.push('Prompt must be a non-empty string');
      return errors;
    }

    const trimmed = text.trim();
    
    if (trimmed.length === 0) {
      errors.push('Prompt cannot be only whitespace');
    }

    if (trimmed.length < 3) {
      errors.push('Prompt must be at least 3 characters long');
    }

    if (trimmed.length > 2000) {
      errors.push('Prompt cannot exceed 2000 characters');
    }

    // Check for harmful content keywords (basic implementation)
    const harmfulKeywords = [
      'violence', 'explicit', 'nsfw', 'gore', 'hate', 'illegal', 
      'dangerous', 'weapon', 'drug', 'suicide', 'self-harm'
    ];
    
    const lowerText = trimmed.toLowerCase();
    const foundHarmful = harmfulKeywords.filter(keyword => lowerText.includes(keyword));
    
    if (foundHarmful.length > 0) {
      errors.push(`Prompt contains prohibited content: ${foundHarmful.join(', ')}`);
    }

    return errors;
  }

  toString(): string {
    return this._text;
  }

  truncate(maxLength: number): Prompt {
    if (this._length <= maxLength) {
      return this;
    }

    const truncated = this._text.substring(0, maxLength).trim();
    const result = Prompt.create(truncated);
    
    if (!result.isSuccess()) {
      // If truncation creates invalid prompt, return current prompt
      return this;
    }
    
    return result.getValue();
  }

  clean(): Prompt {
    // Remove potentially problematic characters
    const cleaned = this._text
      .replace(/[<>{}[\]\\|`~]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const result = Prompt.create(cleaned);
    
    if (!result.isSuccess()) {
      // If cleaning creates invalid prompt, return current prompt
      return this;
    }
    
    return result.getValue();
  }

  getValidationErrors(): string[] {
    return Prompt.validatePrompt(this._text);
  }

  // Additional utility methods
  containsKeywords(keywords: string[]): boolean {
    const lowerText = this._text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  extractKeywords(): string[] {
    // Simple keyword extraction - split by common separators and filter
    return this._text
      .toLowerCase()
      .split(/[,;.!?\s]+/)
      .filter(word => word.length > 2)
      .filter(word => !/^(the|and|or|but|in|on|at|to|for|of|with|by)$/.test(word))
      .slice(0, 10); // Limit to 10 keywords
  }

  getComplexity(): 'simple' | 'moderate' | 'complex' {
    if (this._wordCount <= 5) return 'simple';
    if (this._wordCount <= 15) return 'moderate';
    return 'complex';
  }
}

// Factory functions for easier usage
export const success = <T, E>(value: T): Result<T, E> => new SuccessResult(value);
export const error = <T, E>(err: E): Result<T, E> => new ErrorResult(err);

// Type guard functions
export const isSuccess = <T, E>(result: Result<T, E>): result is SuccessResult<T, E> => 
  result.isSuccess();

export const isError = <T, E>(result: Result<T, E>): result is ErrorResult<T, E> => 
  !result.isSuccess(); 