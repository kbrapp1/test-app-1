/**
 * UserId Value Object
 * 
 * AI INSTRUCTIONS:
 * - Ensure immutability and validation
 * - Delegate complex operations to domain services
 * - Include business validation rules
 * - Never expose raw values without validation
 */

import { BusinessRuleViolationError } from '../errors/AuthDomainError';

export class UserId {
  private readonly _value: string;

  constructor(value: string) {
    this.validateUserId(value);
    this._value = value;
  }

  static create(value: string): UserId {
    return new UserId(value);
  }

  static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  private validateUserId(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'UserId cannot be empty',
        { value }
      );
    }

    if (typeof value !== 'string') {
      throw new BusinessRuleViolationError(
        'UserId must be a string',
        { value, type: typeof value }
      );
    }

    // UUID validation for Supabase auth
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new BusinessRuleViolationError(
        'UserId must be a valid UUID',
        { value }
      );
    }
  }
} 