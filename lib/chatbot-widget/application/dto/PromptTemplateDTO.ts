/**
 * PromptTemplateDTO Data Transfer Object
 * 
 * AI INSTRUCTIONS:
 * - Define clean data contracts for prompt assembly
 * - Immutable structures for data transfer
 * - Support API responses and UI display
 * - Never expose domain entities directly
 * - Follow @golden-rule DTO patterns exactly
 */

export interface PromptSectionDTO {
  readonly sectionId: string;
  readonly title: string;
  readonly content: string;
  readonly contentType: string;
  readonly priority: number;
  readonly isRequired: boolean;
  readonly length: number;
  readonly hasValidationErrors: boolean;
  readonly validationWarnings: readonly string[];
}

export interface AssembledPromptDTO {
  readonly sections: readonly PromptSectionDTO[];
  readonly totalLength: number;
  readonly sectionsCount: number;
  readonly hasValidationErrors: boolean;
  readonly validationErrorsCount: number;
  readonly assembledAt: string; // ISO date string
  readonly estimatedTokens: number;
  readonly summary: PromptSummaryDTO;
}

export interface PromptSummaryDTO {
  readonly totalSections: number;
  readonly requiredSections: number;
  readonly optionalSections: number;
  readonly averageSectionLength: number;
  readonly longestSectionLength: number;
  readonly shortestSectionLength: number;
  readonly contentTypes: readonly string[];
  readonly hasErrors: boolean;
  readonly hasWarnings: boolean;
}

export interface PromptEstimationDTO {
  readonly estimatedLength: number;
  readonly sectionsCount: number;
  readonly averageLength: number;
  readonly estimatedTokens: number;
  readonly isWithinLimits: boolean;
  readonly recommendedMaxLength: number;
  readonly estimatedAt: string; // ISO date string
} 