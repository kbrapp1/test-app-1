/**
 * AI Instructions: Validation status computation utilities
 * - Pure functions for validation state calculation
 * - Handle validation message generation and status determination
 * - Focus on presentation logic only
 * - Keep under 200 lines following single responsibility
 */

import { ContentValidationResult } from './useValidationQueryHelpers';

export type ValidationStatus = 'pending' | 'valid' | 'warning' | 'error' | 'critical';

export interface ContentValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContentValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// AI: Determine validation status from validation result
export function getValidationStatus(result: ContentValidationResult | undefined): ValidationStatus {
  if (!result) return 'pending';
  
  if (result.errors.length > 0) {
    const hasCritical = result.errors.some((e: ContentValidationError) => e.severity === 'critical');
    const hasHigh = result.errors.some((e: ContentValidationError) => e.severity === 'high');
    if (hasCritical) return 'critical';
    if (hasHigh) return 'error';
    return 'warning';
  }
  
  if (result.warnings.length > 0) return 'warning';
  return 'valid';
}

// AI: Get user-friendly validation message from result
export function getValidationMessage(result: ContentValidationResult | undefined): string {
  if (!result) return '';

  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter((e: ContentValidationError) => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      return criticalErrors[0].message;
    }
    
    const highErrors = result.errors.filter((e: ContentValidationError) => e.severity === 'high');
    if (highErrors.length > 0) {
      return highErrors[0].message;
    }
    
    return result.errors[0].message;
  }

  if (result.warnings.length > 0) {
    return result.warnings[0].message;
  }

  return 'Content looks good!';
}

// AI: Get content improvement suggestions from result
export function getContentSuggestions(result: ContentValidationResult | undefined): string[] {
  if (!result) return [];
  return result.suggestions || [];
}

// AI: Compute overall validation status from multiple field validations
export function getOverallValidationStatus(
  validations: Record<string, { validationStatus: ValidationStatus }>
): ValidationStatus {
  const statuses = Object.values(validations).map(v => v.validationStatus);
  
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('warning')) return 'warning';
  if (statuses.some(s => s === 'pending')) return 'pending';
  return 'valid';
}

// AI: Get all errors across multiple field validations
export function getAllErrors(
  validations: Record<string, { validation: ContentValidationResult }>
): Array<ContentValidationError & { field: string }> {
  return Object.entries(validations).flatMap(([fieldName, validation]) =>
    validation.validation.errors.map((error: ContentValidationError) => ({
      ...error,
      field: fieldName
    }))
  );
}

// AI: Get all warnings across multiple field validations
export function getAllWarnings(
  validations: Record<string, { validation: ContentValidationResult }>
): Array<ContentValidationWarning & { field: string }> {
  return Object.entries(validations).flatMap(([fieldName, validation]) =>
    validation.validation.warnings.map((warning: ContentValidationWarning) => ({
      ...warning,
      field: fieldName
    }))
  );
}