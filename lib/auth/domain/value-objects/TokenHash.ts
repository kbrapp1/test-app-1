/**
 * TokenHash Value Object
 * 
 * AI INSTRUCTIONS:
 * - Ensure immutability and validation
 * - Delegate complex operations to domain services
 * - Include business validation rules
 * - Never expose raw values without validation
 * - Used for security token comparison and validation
 */

import { BusinessRuleViolationError } from '../errors/AuthDomainError';

export class TokenHash {
  private readonly _value: string;

  constructor(value: string) {
    this.validateTokenHash(value);
    this._value = value;
  }

  static create(value: string): TokenHash {
    return new TokenHash(value);
  }

  static fromToken(token: string): TokenHash {
    if (!token || token.length < 20) {
      throw new BusinessRuleViolationError(
        'Token must be at least 20 characters for hashing',
        { tokenLength: token?.length || 0 }
      );
    }

    // Create a simple hash for comparison (not cryptographic)
    const hash = token.substring(0, 10) + token.substring(token.length - 10);
    return new TokenHash(hash);
  }

  static empty(): TokenHash {
    return new TokenHash('');
  }

  get value(): string {
    return this._value;
  }

  equals(other: TokenHash): boolean {
    return this._value === other._value;
  }

  isEmpty(): boolean {
    return this._value === '';
  }

  toString(): string {
    return this._value;
  }

  /**
   * Validates token hash format and security requirements
   */
  private validateTokenHash(value: string): void {
    if (typeof value !== 'string') {
      throw new BusinessRuleViolationError(
        'TokenHash must be a string',
        { value, type: typeof value }
      );
    }

    // Allow empty hash for initialization
    if (value === '') {
      return;
    }

    // Hash should be at least 20 characters (10 + 10 from token ends)
    if (value.length < 20) {
      throw new BusinessRuleViolationError(
        'TokenHash must be at least 20 characters',
        { value, length: value.length }
      );
    }

    // Should only contain alphanumeric characters and common JWT characters
    const validHashPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validHashPattern.test(value)) {
      throw new BusinessRuleViolationError(
        'TokenHash contains invalid characters',
        { value }
      );
    }
  }

  /**
   * Compares token hash with a fresh token
   */
  matchesToken(token: string): boolean {
    try {
      const freshHash = TokenHash.fromToken(token);
      return this.equals(freshHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Creates a masked version for logging (security)
   */
  toMaskedString(): string {
    if (this.isEmpty()) {
      return '[empty]';
    }

    if (this._value.length < 8) {
      return '[masked]';
    }

    return this._value.substring(0, 4) + '***' + this._value.substring(this._value.length - 4);
  }
} 