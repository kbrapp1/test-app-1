/**
 * ContentValidationResult Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing validation results
 * - Contains validation status, issues, and warnings
 * - Supports UI feedback and error handling
 * - Follow @golden-rule value object patterns exactly
 * - Keep under 250 lines - focus on essential functionality only
 */

import { ContentType } from './ContentType';
import { ValidationSummary } from './ValidationSummary';

export class ContentValidationResult {
  private readonly _isValid: boolean;
  private readonly _validationIssues: readonly string[];
  private readonly _warnings: readonly string[];
  private readonly _contentType: ContentType;
  private readonly _contentLength: number;
  private readonly _validatedAt: Date;

  // AI: Create a new ContentValidationResult instance
  constructor(
    isValid: boolean,
    validationIssues: string[],
    warnings: string[],
    contentType: ContentType,
    contentLength: number
  ) {
    this.validateInputs(isValid, validationIssues, warnings, contentType, contentLength);
    
    this._isValid = isValid;
    this._validationIssues = Object.freeze([...validationIssues]);
    this._warnings = Object.freeze([...warnings]);
    this._contentType = contentType;
    this._contentLength = contentLength;
    this._validatedAt = new Date();
    
    // Freeze the object to ensure immutability
    Object.freeze(this);
  }

  // AI: Get validation status
  get isValid(): boolean {
    return this._isValid;
  }

  // AI: Get validation issues that prevent content from being used
  get validationIssues(): readonly string[] {
    return this._validationIssues;
  }

  // AI: Get warnings that don't prevent usage but suggest improvements
  get warnings(): readonly string[] {
    return this._warnings;
  }

  // AI: Get the content type that was validated
  get contentType(): ContentType {
    return this._contentType;
  }

  // AI: Get the length of content that was validated
  get contentLength(): number {
    return this._contentLength;
  }

  // AI: Get the timestamp when validation was performed
  get validatedAt(): Date {
    return new Date(this._validatedAt);
  }

  // AI: Check if there are any issues (errors or warnings)
  get hasAnyIssues(): boolean {
    return this._validationIssues.length > 0 || this._warnings.length > 0;
  }

  // AI: Get total count of all issues and warnings
  get totalIssueCount(): number {
    return this._validationIssues.length + this._warnings.length;
  }

  // AI: Combine issues and warnings in priority order for UI display
  getAllIssues(): Array<{ type: 'error' | 'warning'; message: string }> {
    const allIssues: Array<{ type: 'error' | 'warning'; message: string }> = [];
    
    // Add errors first (higher priority)
    this._validationIssues.forEach(issue => {
      allIssues.push({ type: 'error', message: issue });
    });
    
    // Add warnings second
    this._warnings.forEach(warning => {
      allIssues.push({ type: 'warning', message: warning });
    });
    
    return allIssues;
  }

  // AI: Get validation summary for logging and monitoring
  getSummary(): ValidationSummary {
    return new ValidationSummary(
      this._isValid,
      this._contentType,
      this._contentLength,
      this._validationIssues.length,
      this._warnings.length,
      this.totalIssueCount,
      this.validatedAt
    );
  }

  // AI: Get first critical issue for quick display
  getFirstCriticalIssue(): string | null {
    return this._validationIssues.length > 0 ? this._validationIssues[0] : null;
  }

  // AI: Get first warning for quick display
  getFirstWarning(): string | null {
    return this._warnings.length > 0 ? this._warnings[0] : null;
  }

  // AI: Check if content can be used despite warnings
  canBeUsed(): boolean {
    return this._isValid; // Only critical issues prevent usage
  }

  // AI: Compare based on validation results, not timestamps, support value object equality
  equals(other: ContentValidationResult): boolean {
    if (!(other instanceof ContentValidationResult)) {
      return false;
    }
    
    return (
      this._isValid === other._isValid &&
      this._contentType === other._contentType &&
      this._contentLength === other._contentLength &&
      this.arraysEqual(this._validationIssues, other._validationIssues) &&
      this.arraysEqual(this._warnings, other._warnings)
    );
  }

  // AI: Create a string representation for debugging
  toString(): string {
    const status = this._isValid ? 'Valid' : 'Invalid';
    const issueCount = this.totalIssueCount;
    return `ContentValidationResult(${status}, ${this._contentType}, ${issueCount} issues)`;
  }

  // AI: Provide JSON representation for serialization and API responses
  toJSON(): {
    isValid: boolean;
    validationIssues: string[];
    warnings: string[];
    contentType: ContentType;
    contentLength: number;
    summary: {
      criticalIssues: number;
      warnings: number;
      totalIssues: number;
      canBeUsed: boolean;
    };
  } {
    return {
      isValid: this._isValid,
      validationIssues: [...this._validationIssues],
      warnings: [...this._warnings],
      contentType: this._contentType,
      contentLength: this._contentLength,
      summary: {
        criticalIssues: this._validationIssues.length,
        warnings: this._warnings.length,
        totalIssues: this.totalIssueCount,
        canBeUsed: this._isValid
      }
    };
  }

  // AI: Helper method for array equality comparison
  private arraysEqual(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
  }

  // AI: Validate all required parameters, ensure arrays are not null, check content type validity
  private validateInputs(
    isValid: boolean,
    validationIssues: string[],
    warnings: string[],
    contentType: ContentType,
    contentLength: number
  ): void {
    if (typeof isValid !== 'boolean') {
      throw new Error('isValid must be a boolean');
    }
    
    if (!Array.isArray(validationIssues)) {
      throw new Error('validationIssues must be an array');
    }
    
    if (!Array.isArray(warnings)) {
      throw new Error('warnings must be an array');
    }
    
    if (!Object.values(ContentType).includes(contentType)) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    if (typeof contentLength !== 'number' || contentLength < 0) {
      throw new Error('contentLength must be a non-negative number');
    }
    
    // Validate that all issues and warnings are strings
    if (!validationIssues.every(issue => typeof issue === 'string')) {
      throw new Error('All validation issues must be strings');
    }
    
    if (!warnings.every(warning => typeof warning === 'string')) {
      throw new Error('All warnings must be strings');
    }
  }
} 