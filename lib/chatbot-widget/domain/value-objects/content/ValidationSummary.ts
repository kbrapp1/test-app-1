/**
 * ValidationSummary Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object for validation summary data
 * - Support logging, monitoring, and debugging
 * - Keep focused on summary statistics only
 * - Follow @golden-rule value object patterns exactly
 */

import { ContentType } from './ContentType';

export class ValidationSummary {
  constructor(
    public readonly isValid: boolean,
    public readonly contentType: ContentType,
    public readonly contentLength: number,
    public readonly criticalIssues: number,
    public readonly warnings: number,
    public readonly totalIssues: number,
    public readonly validatedAt: Date
  ) {
    Object.freeze(this);
  }

  // AI: Check if content can be used despite having warnings
  get canBeUsed(): boolean {
    return this.isValid;
  }

  // AI: Check if there are any issues at all (errors or warnings)
  get hasAnyIssues(): boolean {
    return this.totalIssues > 0;
  }
} 