/**
 * Content Categorization Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 250 lines - refactor into smaller services
 * - Follow @golden-rule patterns exactly
 * - Abstract AI provider dependencies via interfaces
 * - Handle domain errors with specific error types
 * - Focus on business rules for categorization
 * - Provide fallback categorization strategies
 */

import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';
import { ContentCategorizationError } from '../errors/ChatbotWidgetDomainErrors';
import { CategoryRules, CategoryRule } from '../value-objects/CategoryRule';
import { IAiCategorizationProvider } from './interfaces/IAiCategorizationProvider';
import { ContentCategorizationValidationService } from './ContentCategorizationValidationService';

/**
 * Content Categorization Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for content categorization
 * - No external dependencies on AI providers
 * - Focus on domain rules and fallback strategies
 * - Use domain-specific error handling
 */
export class ContentCategorizationService {

  /** Categorize content using domain rules and AI fallback */
  async categorizeContent(
    content: string,
    title: string,
    aiProvider?: IAiCategorizationProvider
  ): Promise<KnowledgeItem['category']> {
    try {
      // Domain rule: Validate input parameters
      ContentCategorizationValidationService.validateCategorizationInput(content, title);
      
      // Domain rule: First apply rule-based categorization
      const ruleBasedCategory = this.applyRuleBasedCategorization(content, title);
      if (ruleBasedCategory) {
        return ruleBasedCategory;
      }
      
      // Domain rule: Use AI categorization as fallback if available
      if (aiProvider) {
        try {
          const aiCategory = await this.categorizeWithAi(content, title, aiProvider);
          if (CategoryRules.isValidCategory(aiCategory)) {
            return aiCategory as KnowledgeItem['category'];
          }
        } catch {
          // Continue to fallback categorization
        }
      }
      
      // Domain rule: Use fallback categorization
      return this.getFallbackCategory(content, title);
      
    } catch (error) {
      if (error instanceof ContentCategorizationError) {
        throw error;
      }
      
      // Domain rule: Never fail categorization - use safe fallback
      return 'general';
    }
  }

  /** Apply rule-based categorization using domain knowledge */
  private applyRuleBasedCategorization(
    content: string,
    title: string
  ): KnowledgeItem['category'] | null {
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Get sorted rules by priority (higher first)
    const sortedRules = CategoryRules.getAllRules();

    for (const rule of sortedRules) {
      // Check title patterns
      const titleMatch = rule.titlePatterns.some(pattern => pattern.test(lowerTitle));
      
      // Check content patterns
      const contentMatch = rule.contentPatterns.some(pattern => pattern.test(lowerContent));
      
      // Domain rule: Title match has higher weight than content match
      if (titleMatch || (contentMatch && this.hasStrongContentIndicators(lowerContent, rule))) {
        return rule.category;
      }
    }

    return null;
  }

  /** Check for strong content indicators beyond simple pattern matching */
  private hasStrongContentIndicators(content: string, rule: CategoryRule): boolean {
    // Domain rule: Content must have multiple indicators for non-title matches
    const matchCount = rule.contentPatterns.reduce((count, pattern) => {
      return count + (pattern.test(content) ? 1 : 0);
    }, 0);

    // Domain rule: Require at least 2 pattern matches for content-based categorization
    return matchCount >= 2;
  }

  /** Categorize content using AI provider */
  private async categorizeWithAi(
    content: string,
    title: string,
    aiProvider: IAiCategorizationProvider
  ): Promise<string> {
    try {
      // Domain rule: Limit content length for AI processing
      const truncatedContent = ContentCategorizationValidationService.truncateContentForAi(content);
      
      const category = await aiProvider.categorizeContent(truncatedContent, title);
      
      if (!category || typeof category !== 'string') {
        throw new ContentCategorizationError(
          'AI provider returned invalid category',
          { category, title: title.substring(0, 100) }
        );
      }
      
      return category.toLowerCase().trim();
      
    } catch (error) {
      throw new ContentCategorizationError(
        'AI categorization failed',
        { 
          title: title.substring(0, 100),
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * Get fallback category based on content characteristics
   */
  private getFallbackCategory(content: string, _title: string): KnowledgeItem['category'] {
    // Domain rule: Use content length and structure for fallback categorization
    const wordCount = content.split(/\s+/).length;
    const hasQuestions = /\?/.test(content);
    const hasPricing = /\$|price|cost|pricing|fee/i.test(content);
    
    if (hasQuestions && wordCount < 500) {
      return 'faq';
    } else if (hasPricing) {
      return 'pricing';
    } else if (wordCount > 1000) {
      return 'product_info';
    } else {
      return 'general';
    }
  }
}