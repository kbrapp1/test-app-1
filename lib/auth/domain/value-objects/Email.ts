/**
 * Email Value Object
 * 
 * AI INSTRUCTIONS:
 * - Ensure immutability and validation
 * - Delegate complex operations to domain services
 * - Include business validation rules
 * - Never expose raw values without validation
 */

import { BusinessRuleViolationError } from '../errors/AuthDomainError';

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    this.validateEmail(value);
    this._value = value.toLowerCase().trim();
  }

  static create(value: string): Email {
    return new Email(value);
  }

  get value(): string {
    return this._value;
  }

  get domain(): string {
    return this._value.split('@')[1];
  }

  get localPart(): string {
    return this._value.split('@')[0];
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  isDisposable(): boolean {
    // Common disposable email domains
    const disposableDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'tempmail.org',
      'yopmail.com'
    ];
    
    return disposableDomains.includes(this.domain);
  }

  private validateEmail(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Email cannot be empty',
        { value }
      );
    }

    if (typeof value !== 'string') {
      throw new BusinessRuleViolationError(
        'Email must be a string',
        { value, type: typeof value }
      );
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length > 254) {
      throw new BusinessRuleViolationError(
        'Email address is too long',
        { value: trimmedValue, length: trimmedValue.length }
      );
    }

    // RFC 5322 compliant email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmedValue)) {
      throw new BusinessRuleViolationError(
        'Email address format is invalid',
        { value: trimmedValue }
      );
    }

    // Check for consecutive dots
    if (trimmedValue.includes('..')) {
      throw new BusinessRuleViolationError(
        'Email address cannot contain consecutive dots',
        { value: trimmedValue }
      );
    }

    // Check for leading/trailing dots in local part
    const localPart = trimmedValue.split('@')[0];
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      throw new BusinessRuleViolationError(
        'Email local part cannot start or end with a dot',
        { value: trimmedValue, localPart }
      );
    }
  }
} 