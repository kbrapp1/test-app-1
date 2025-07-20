import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import type { WebsiteSource } from '../../value-objects/ai-configuration/KnowledgeBase';
import { ValidationUtilities } from './ValidationUtilities';

/**
 * Website Source Structure Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for website source validation logic
 * - Handles individual website source validation and source-specific business rules
 * - Extracted from KnowledgeBaseStructureValidationService for single responsibility
 * - No external dependencies - pure business logic
 * - Follow @golden-rule patterns exactly
 */
export class WebsiteSourceStructureValidationService {
  /**
   * Validates website source collection structure and business constraints
   */
  static validateWebsiteSourceCollection(websiteSources: WebsiteSource[]): void {
    ValidationUtilities.validateArrayInput(websiteSources, 'Website sources');

    // Validate individual website source structure
    websiteSources.forEach((source, index) => {
      this.validateSingleWebsiteSourceStructure(source, index);
    });
  }

  /**
   * Validates website source uniqueness before adding new source
   */
  static validateWebsiteSourceUniqueness(existingSources: WebsiteSource[], newSource: WebsiteSource): void {
    const duplicateUrl = existingSources.find(existing => existing.url === newSource.url);
    if (duplicateUrl) {
      throw new BusinessRuleViolationError(
        'Website source with duplicate URL cannot be added',
        { 
          url: newSource.url, 
          existingSources: existingSources.length,
          duplicateFound: true,
          conflictingSource: {
            id: duplicateUrl.id,
            name: duplicateUrl.name,
            url: duplicateUrl.url
          }
        }
      );
    }
  }

  /**
   * Validates that website source exists for update operations
   */
  static validateWebsiteSourceExistsForUpdate(sources: WebsiteSource[], sourceId: string): void {
    ValidationUtilities.validateItemExistsForUpdate(
      sources,
      sourceId,
      (source) => source.id,
      (source) => ({ id: source.id, url: source.url, name: source.name }),
      'Website source'
    );
  }

  // Private helper methods
  private static validateSingleWebsiteSourceStructure(source: WebsiteSource, index: number): void {
    ValidationUtilities.validateRequiredStringField(source.id, 'ID', index, source.id || 'unknown');
    ValidationUtilities.validateRequiredStringField(source.url, 'URL', index, source.id);
    ValidationUtilities.validateRequiredStringField(source.name, 'name', index, source.id);
    
    // Validate URL format
    try {
      const url = new URL(source.url);
      // Business rule: Only allow HTTP/HTTPS protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new BusinessRuleViolationError(
          `Website source at index ${index} must use HTTP or HTTPS protocol`,
          { index, source: { id: source.id, url: source.url, protocol: url.protocol } }
        );
      }
    } catch {
      throw new BusinessRuleViolationError(
        `Website source at index ${index} has invalid URL format`,
        { index, source: { id: source.id, url: source.url } }
      );
    }

    // Validate crawl settings
    this.validateCrawlSettings(source.crawlSettings, source.id, index);
  }

  private static validateCrawlSettings(settings: unknown, sourceId: string, index: number): void {
    if (!settings || typeof settings !== 'object') {
      throw new BusinessRuleViolationError(
        `Website source at index ${index} must have valid crawl settings`,
        { index, sourceId, settings }
      );
    }

    // Type guard for settings object
    const settingsObj = settings as Record<string, unknown>;

    // Business rule: Crawl limits validation
    if (typeof settingsObj.maxPages !== 'number' || settingsObj.maxPages < 1 || settingsObj.maxPages > 1000) {
      throw new BusinessRuleViolationError(
        `Website source crawl settings maxPages must be between 1 and 1000`,
        { index, sourceId, maxPages: settingsObj.maxPages }
      );
    }

    if (typeof settingsObj.maxDepth !== 'number' || settingsObj.maxDepth < 1 || settingsObj.maxDepth > 10) {
      throw new BusinessRuleViolationError(
        `Website source crawl settings maxDepth must be between 1 and 10`,
        { index, sourceId, maxDepth: settingsObj.maxDepth }
      );
    }
  }
}