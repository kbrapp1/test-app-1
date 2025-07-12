/**
 * Password Service - Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Focus on basic password validation only
 * - Match current app's form validation needs
 * - Keep business rules simple and clear
 * - No over-engineering - align with existing validation
 */

import { BusinessRuleViolationError } from '../errors/AuthDomainError';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Domain service for password validation and business rules
 * 
 * Handles business logic for:
 * - Password strength validation
 * - Password requirements checking
 * - Basic security rules
 */
export class PasswordService {
  private static readonly DEFAULT_REQUIREMENTS: PasswordRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  };

  /**
   * Validates password against business rules
   */
  static validatePassword(
    password: string, 
    requirements: PasswordRequirements = this.DEFAULT_REQUIREMENTS
  ): PasswordValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    // Check minimum length
    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }

    // Check uppercase requirement
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check lowercase requirement
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check numbers requirement
    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check special characters requirement
    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates password confirmation matches
   */
  static validatePasswordConfirmation(password: string, confirmation: string): boolean {
    if (!password || !confirmation) {
      return false;
    }

    return password === confirmation;
  }

  /**
   * Checks if password meets minimum security requirements
   */
  static meetsMinimumRequirements(password: string): boolean {
    const validation = this.validatePassword(password);
    return validation.isValid;
  }

  /**
   * Gets password requirements for user display
   */
  static getPasswordRequirements(): PasswordRequirements {
    return { ...this.DEFAULT_REQUIREMENTS };
  }

  /**
   * Validates password is not commonly used
   */
  static isCommonPassword(password: string): boolean {
    if (!password) {
      return false;
    }

    // Basic check for very common passwords
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Validates password reset requirements
   */
  static validatePasswordReset(
    newPassword: string, 
    currentPassword?: string
  ): PasswordValidationResult {
    const validation = this.validatePassword(newPassword);

    if (!validation.isValid) {
      return validation;
    }

    // Check if new password is different from current (if provided)
    if (currentPassword && newPassword === currentPassword) {
      return {
        isValid: false,
        errors: ['New password must be different from current password']
      };
    }

    // Check if password is commonly used
    if (this.isCommonPassword(newPassword)) {
      return {
        isValid: false,
        errors: ['Password is too common. Please choose a more secure password.']
      };
    }

    return validation;
  }
} 