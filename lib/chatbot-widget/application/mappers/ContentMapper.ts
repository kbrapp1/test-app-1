/**
 * ContentMapper Application Mapper
 * 
 * AI INSTRUCTIONS:
 * - Handle transformation only, no business logic
 * - Map between domain entities and DTOs cleanly
 * - Support bidirectional transformation where needed
 * - Follow @golden-rule mapper patterns exactly
 * - Never exceed 250 lines - focus on transformation only
 * - Maintain data integrity during transformation
 */

import { SanitizedContent } from '../../domain/value-objects/content/SanitizedContent';
import { ContentValidationResult } from '../../domain/value-objects/content/ContentValidationResult';
import { ValidationSummary } from '../../domain/value-objects/content/ValidationSummary';
import { ContentType } from '../../domain/value-objects/content/ContentType';
import { SanitizedContentDTO, ContentValidationDTO, ValidationSummaryDTO } from '../dto/SanitizedContentDTO';
import { PromptSectionDTO, AssembledPromptDTO, PromptSummaryDTO, PromptEstimationDTO } from '../dto/PromptTemplateDTO';
import { PromptSection, AssembledPrompt } from '../services/PromptAssemblyApplicationService';

export class ContentMapper {
  // AI: Transform SanitizedContent domain value object to DTO for API responses
  static toSanitizedContentDTO(sanitizedContent: SanitizedContent): SanitizedContentDTO {
    return {
      content: sanitizedContent.content,
      originalLength: sanitizedContent.originalLength,
      sanitizedLength: sanitizedContent.sanitizedLength,
      contentType: sanitizedContent.contentType.toString(),
      changesApplied: sanitizedContent.wasModified ? ['content-modified'] : [],
      sanitizedAt: sanitizedContent.sanitizedAt.toISOString(),
      reductionPercentage: sanitizedContent.reductionPercentage,
      wasModified: sanitizedContent.wasModified
    };
  }

  // AI: Transform ContentValidationResult domain value object to DTO for UI display
  static toContentValidationDTO(validationResult: ContentValidationResult): ContentValidationDTO {
    return {
      isValid: validationResult.isValid,
      issues: validationResult.validationIssues,
      warnings: validationResult.warnings,
      contentType: validationResult.contentType.toString(),
      contentLength: validationResult.contentLength,
      validatedAt: validationResult.validatedAt.toISOString(),
      totalIssues: validationResult.totalIssueCount,
      hasWarnings: validationResult.warnings.length > 0
    };
  }

  // AI: Transform ValidationSummary domain value object to DTO for monitoring
  static toValidationSummaryDTO(summary: ValidationSummary): ValidationSummaryDTO {
    return {
      isValid: summary.isValid,
      contentType: summary.contentType.toString(),
      contentLength: summary.contentLength,
      criticalIssues: summary.criticalIssues,
      warnings: summary.warnings,
      totalIssues: summary.totalIssues,
      canBeUsed: summary.canBeUsed,
      validatedAt: summary.validatedAt.toISOString()
    };
  }

  // AI: Transform PromptSection application interface to DTO for API responses
  static toPromptSectionDTO(
    section: PromptSection, 
    validationResult?: ContentValidationResult
  ): PromptSectionDTO {
    return {
      sectionId: section.sectionId,
      title: section.title,
      content: section.content,
      contentType: section.contentType.toString(),
      priority: section.priority,
      isRequired: section.isRequired,
      length: section.content.length,
      hasValidationErrors: validationResult ? !validationResult.isValid : false,
      validationWarnings: validationResult ? validationResult.warnings : []
    };
  }

  // AI: Transform AssembledPrompt application interface to DTO for UI display
  static toAssembledPromptDTO(assembledPrompt: AssembledPrompt): AssembledPromptDTO {
    const sectionsDTO = assembledPrompt.sections.map(section => {
      // AI: Find corresponding validation result for this section
      const validationResult = assembledPrompt.validationResults.find(vr => 
        vr.contentType === section.contentType
      );
      return this.toPromptSectionDTO(section, validationResult);
    });

    const summary = this.calculatePromptSummary(assembledPrompt);

    return {
      sections: sectionsDTO,
      totalLength: assembledPrompt.totalLength,
      sectionsCount: assembledPrompt.sections.length,
      hasValidationErrors: assembledPrompt.hasValidationErrors,
      validationErrorsCount: assembledPrompt.validationResults.filter(vr => !vr.isValid).length,
      assembledAt: assembledPrompt.assembledAt.toISOString(),
      estimatedTokens: this.estimateTokenCount(assembledPrompt.totalLength),
      summary
    };
  }

  // AI: Create prompt estimation DTO from calculation results
  static toPromptEstimationDTO(
    estimatedLength: number,
    sectionsCount: number,
    averageLength: number
  ): PromptEstimationDTO {
    const recommendedMaxLength = 8000; // AI: Business rule for recommended prompt length
    
    return {
      estimatedLength,
      sectionsCount,
      averageLength,
      estimatedTokens: this.estimateTokenCount(estimatedLength),
      isWithinLimits: estimatedLength <= recommendedMaxLength,
      recommendedMaxLength,
      estimatedAt: new Date().toISOString()
    };
  }

  // AI: Calculate prompt summary statistics for monitoring and analytics
  private static calculatePromptSummary(assembledPrompt: AssembledPrompt): PromptSummaryDTO {
    const sections = assembledPrompt.sections;
    const lengths = sections.map(s => s.content.length);
    const contentTypes = [...new Set(sections.map(s => s.contentType.toString()))];
    
    return {
      totalSections: sections.length,
      requiredSections: sections.filter(s => s.isRequired).length,
      optionalSections: sections.filter(s => !s.isRequired).length,
      averageSectionLength: lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0,
      longestSectionLength: lengths.length > 0 ? Math.max(...lengths) : 0,
      shortestSectionLength: lengths.length > 0 ? Math.min(...lengths) : 0,
      contentTypes,
      hasErrors: assembledPrompt.hasValidationErrors,
      hasWarnings: assembledPrompt.validationResults.some(vr => vr.warnings.length > 0)
    };
  }

  // AI: Estimate token count from character length using industry standard approximation
  private static estimateTokenCount(characterLength: number): number {
    // AI: Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(characterLength / 4);
  }
} 