/**
 * ContentValidationService Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle for content validation
 * - Never exceed 250 lines - refactor into smaller services if needed
 * - Follow @golden-rule patterns exactly
 * - Always validate inputs using value objects
 * - Handle domain errors with specific error types
 * - Focus on domain rules and business validation only
 * - Delegate complex validation to separate methods
 */

import { ContentValidationError } from '../../errors/ContentValidationError';
import { ContentType } from '../../value-objects/content/ContentType';
import { ContentValidationResult } from '../../value-objects/content/ContentValidationResult';
import { ContentTypeValidationService } from './ContentTypeValidationService';
import { ContentLengthValidationService } from './ContentLengthValidationService';

export class ContentValidationService {
  private readonly typeValidationService: ContentTypeValidationService;
  private readonly lengthValidationService: ContentLengthValidationService;

  constructor() {
    this.typeValidationService = new ContentTypeValidationService();
    this.lengthValidationService = new ContentLengthValidationService();
  }

  // AI: Apply comprehensive validation rules, check formatting conflicts with system prompts
  // Validate content length/structure, provide detailed results for UI feedback
  validateContent(content: string, contentType: ContentType): ContentValidationResult {
    this.validateInput(content, contentType);
    
    const validationIssues: string[] = [];
    const warnings: string[] = [];
    
    // Run validation checks using delegated services
    this.lengthValidationService.validateLength(content, contentType, validationIssues, warnings);
    this.validateFormatting(content, validationIssues, warnings);
    this.typeValidationService.validateContentByType(content, contentType, validationIssues, warnings);
    this.validateContentStructure(content, validationIssues, warnings);
    
    const isValid = validationIssues.length === 0;
    
    return new ContentValidationResult(
      isValid,
      validationIssues,
      warnings,
      contentType,
      content.length
    );
  }

  // AI: Check for markdown headers that conflict with system prompts, identify problematic formatting
  // Validate whitespace consistency, detect potential AI instruction conflicts
  private validateFormatting(content: string, issues: string[], warnings: string[]): void {
    // Check for markdown headers
    const headerMatches = content.match(/^#{1,6}\s+/gm);
    if (headerMatches) {
      issues.push(
        `Found ${headerMatches.length} markdown headers (##, ###). These conflict with system prompt structure and will be removed.`
      );
    }
    
    // Check for excessive whitespace
    if (/\n{4,}/.test(content)) {
      warnings.push('Content contains excessive blank lines. These will be normalized.');
    }
    
    if (/[ \t]{3,}/.test(content)) {
      warnings.push('Content contains excessive spaces/tabs. These will be normalized.');
    }
    
    // Check for potential AI instruction conflicts
    const aiPatterns = [
      /AI INSTRUCTIONS?:/i,
      /\*\*AI:.*?\*\*/i,
      /System:/i,
      /Assistant:/i
    ];
    
    for (const pattern of aiPatterns) {
      if (pattern.test(content)) {
        issues.push(
          'Content contains text that looks like AI instructions. This will be removed to prevent conflicts.'
        );
        break;
      }
    }
  }

  // AI: Check for logical content organization, validate sentence structure and readability
  // Ensure content supports chatbot objectives, identify improvement opportunities
  private validateContentStructure(content: string, issues: string[], warnings: string[]): void {
    // Check for very long sentences that might be hard to process
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.length > 200);
    
    if (longSentences.length > 0) {
      warnings.push(
        `Found ${longSentences.length} very long sentences. Consider breaking them up for better readability.`
      );
    }
    
    // Check for repeated words or phrases
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const repeatedWords = Object.entries(wordCounts)
      .filter(([word, count]) => count > 5 && word.length > 3)
      .map(([word]) => word);
    
    if (repeatedWords.length > 0) {
      warnings.push(
        `Frequently repeated words detected: ${repeatedWords.slice(0, 3).join(', ')}. Consider varying your language.`
      );
    }
  }

  // AI: Validate all required parameters, ensure content is not null, check content type validity
  private validateInput(content: string, contentType: ContentType): void {
    if (!content || typeof content !== 'string') {
      throw new ContentValidationError(
        'Content must be a non-empty string',
        { contentType, providedContent: content }
      );
    }
    
    if (!Object.values(ContentType).includes(contentType)) {
      throw new ContentValidationError(
        'Invalid content type provided',
        { contentType, validTypes: Object.values(ContentType) }
      );
    }
  }
} 