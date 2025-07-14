/**
 * Note ID Value Object - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object for Note identification
 * - Provides type safety and validation
 * - Follow @golden-rule value object patterns exactly
 * - Keep under 50 lines - simple value object
 */

import { BusinessRuleViolationError } from '../errors/NotesDomainError';

export class NoteId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validateId(value);
    this._value = value;
  }

  public static create(value: string): NoteId {
    return new NoteId(value);
  }

  public static generate(): NoteId {
    return new NoteId(crypto.randomUUID());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: NoteId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }

  private validateId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new BusinessRuleViolationError(
        'Note ID must be a non-empty string',
        { providedValue: value }
      );
    }

    if (value.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Note ID cannot be empty or whitespace',
        { providedValue: value }
      );
    }
  }
} 