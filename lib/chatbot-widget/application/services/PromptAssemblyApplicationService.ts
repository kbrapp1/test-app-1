/**
 * PromptAssemblyApplicationService Application Service
 * 
 * AI INSTRUCTIONS:
 * - Handle workflow coordination only, delegate all business logic
 * - Coordinate multiple domain services for prompt generation
 * - Maintain single responsibility for prompt assembly orchestration
 * - Follow @golden-rule application layer patterns exactly
 * - Never exceed 250 lines - focus on coordination only
 * - Use composition root for dependency injection
 * - Handle domain errors appropriately without wrapping
 * - Publish domain events for cross-aggregate coordination
 */

import { SanitizeUserContentUseCase } from '../use-cases/SanitizeUserContentUseCase';
import { ValidateContentUseCase } from '../use-cases/ValidateContentUseCase';
import { ContentType } from '../../domain/value-objects/content/ContentType';
import { SanitizedContent } from '../../domain/value-objects/content/SanitizedContent';
import { ContentValidationResult } from '../../domain/value-objects/content/ContentValidationResult';

export interface PromptSection {
  readonly sectionId: string;
  readonly title: string;
  readonly content: string;
  readonly contentType: ContentType;
  readonly priority: number;
  readonly isRequired: boolean;
}

export interface AssembledPrompt {
  readonly sections: readonly PromptSection[];
  readonly totalLength: number;
  readonly validationResults: readonly ContentValidationResult[];
  readonly hasValidationErrors: boolean;
  readonly assembledAt: Date;
}

export class PromptAssemblyApplicationService {
  constructor(
    private readonly sanitizeContentUseCase: SanitizeUserContentUseCase,
    private readonly validateContentUseCase: ValidateContentUseCase
  ) {}

  // AI: Orchestrate complete prompt assembly workflow with content processing
  async assemblePrompt(
    rawSections: Array<{
      sectionId: string;
      title: string;
      content: string;
      contentType: ContentType;
      priority: number;
      isRequired: boolean;
    }>
  ): Promise<AssembledPrompt> {
    const processedSections: PromptSection[] = [];
    const validationResults: ContentValidationResult[] = [];
    let hasValidationErrors = false;

    // AI: Process each section through sanitization and validation workflow
    for (const rawSection of rawSections) {
      try {
        const { sanitizedContent, validationResult } = await this.sanitizeContentUseCase.execute(
          rawSection.content,
          rawSection.contentType
        );

        // AI: Create processed section with sanitized content
        const processedSection: PromptSection = {
          sectionId: rawSection.sectionId,
          title: rawSection.title,
          content: sanitizedContent.content,
          contentType: rawSection.contentType,
          priority: rawSection.priority,
          isRequired: rawSection.isRequired
        };

        processedSections.push(processedSection);
        validationResults.push(validationResult);

        if (!validationResult.isValid) {
          hasValidationErrors = true;
        }
      } catch (error) {
        // AI: For critical sections, fail the entire assembly; for optional sections, continue
        if (rawSection.isRequired) {
          throw error;
        }

        // AI: Log optional section failure and continue with assembly
        console.warn(`Failed to process optional section ${rawSection.sectionId}:`, error);
      }
    }

    // AI: Sort sections by priority for optimal prompt structure
    const sortedSections = this.sortSectionsByPriority(processedSections);

    return {
      sections: Object.freeze(sortedSections),
      totalLength: this.calculateTotalLength(sortedSections),
      validationResults: Object.freeze(validationResults),
      hasValidationErrors,
      assembledAt: new Date()
    };
  }

  // AI: Validate prompt sections without full assembly for preview
  async validatePromptSections(
    sections: Array<{ content: string; contentType: ContentType; sectionId: string }>
  ): Promise<Array<{ sectionId: string; validationResult: ContentValidationResult }>> {
    const results: Array<{ sectionId: string; validationResult: ContentValidationResult }> = [];

    for (const section of sections) {
      try {
        const validationResult = await this.validateContentUseCase.execute(
          section.content,
          section.contentType
        );

        results.push({
          sectionId: section.sectionId,
          validationResult
        });
      } catch (error) {
        // AI: Create error validation result for failed sections
        const errorResult = new ContentValidationResult(
          false,
          [error instanceof Error ? error.message : 'Unknown validation error'],
          [],
          section.contentType,
          section.content.length
        );

        results.push({
          sectionId: section.sectionId,
          validationResult: errorResult
        });
      }
    }

    return results;
  }

  // AI: Estimate prompt length before full assembly for optimization
  async estimatePromptLength(
    sections: Array<{ content: string; contentType: ContentType }>
  ): Promise<{ estimatedLength: number; sectionsCount: number; averageLength: number }> {
    let totalEstimatedLength = 0;
    let processedSections = 0;

    for (const section of sections) {
      try {
        const sanitizedContent = await this.sanitizeContentUseCase.sanitizeOnly(
          section.content,
          section.contentType
        );
        
        totalEstimatedLength += sanitizedContent.content.length;
        processedSections++;
      } catch (error) {
        // AI: For estimation, use original length if sanitization fails
        totalEstimatedLength += section.content.length;
        processedSections++;
      }
    }

    return {
      estimatedLength: totalEstimatedLength,
      sectionsCount: processedSections,
      averageLength: processedSections > 0 ? Math.round(totalEstimatedLength / processedSections) : 0
    };
  }

  // AI: Sort sections by priority with business rules for optimal prompt structure
  private sortSectionsByPriority(sections: PromptSection[]): PromptSection[] {
    return [...sections].sort((a, b) => {
      // AI: Required sections always come before optional ones
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      
      // AI: Within same requirement level, sort by priority (lower number = higher priority)
      return a.priority - b.priority;
    });
  }

  // AI: Calculate total character length of all sections
  private calculateTotalLength(sections: PromptSection[]): number {
    return sections.reduce((total, section) => total + section.content.length, 0);
  }
} 