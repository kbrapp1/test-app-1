/**
 * SanitizedContentDTO Data Transfer Object
 * 
 * AI INSTRUCTIONS:
 * - Define clean data contracts for layer boundaries
 * - Immutable structures for data transfer
 * - Never expose domain entities directly
 * - Support serialization and API responses
 * - Follow @golden-rule DTO patterns exactly
 */

export interface SanitizedContentDTO {
  readonly content: string;
  readonly originalLength: number;
  readonly sanitizedLength: number;
  readonly contentType: string;
  readonly changesApplied: readonly string[];
  readonly sanitizedAt: string; // ISO date string
  readonly reductionPercentage: number;
  readonly wasModified: boolean;
}

export interface ContentValidationDTO {
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly warnings: readonly string[];
  readonly contentType: string;
  readonly contentLength: number;
  readonly validatedAt: string; // ISO date string
  readonly totalIssues: number;
  readonly hasWarnings: boolean;
}

export interface ValidationSummaryDTO {
  readonly isValid: boolean;
  readonly contentType: string;
  readonly contentLength: number;
  readonly criticalIssues: number;
  readonly warnings: number;
  readonly totalIssues: number;
  readonly canBeUsed: boolean;
  readonly validatedAt: string; // ISO date string
} 