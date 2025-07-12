/**
 * OrganizationId Value Object
 * 
 * AI INSTRUCTIONS:
 * - Ensure immutability and validation
 * - Delegate complex operations to domain services
 * - Include business validation rules
 * - Never expose raw values without validation
 */

import { BusinessRuleViolationError } from '../errors/AuthDomainError';

export class OrganizationId {
  private readonly _value: string;

  constructor(value: string) {
    this.validateOrganizationId(value);
    this._value = value;
  }

  static create(value: string): OrganizationId {
    return new OrganizationId(value);
  }

  static generate(): OrganizationId {
    return new OrganizationId(crypto.randomUUID());
  }

  get value(): string {
    return this._value;
  }

  equals(other: OrganizationId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  private validateOrganizationId(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'OrganizationId cannot be empty',
        { value }
      );
    }

    if (typeof value !== 'string') {
      throw new BusinessRuleViolationError(
        'OrganizationId must be a string',
        { value, type: typeof value }
      );
    }

    // UUID validation for Supabase
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new BusinessRuleViolationError(
        'OrganizationId must be a valid UUID',
        { value }
      );
    }
  }
} 