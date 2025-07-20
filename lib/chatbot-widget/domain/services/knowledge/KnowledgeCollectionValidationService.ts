import type { FAQ, WebsiteSource, KnowledgeBaseProps } from '../../value-objects/ai-configuration/KnowledgeBase';
import { ValidationUtilities } from './ValidationUtilities';

/**
 * Knowledge Collection Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for collection-level validation rules
 * - Handles duplicate detection and size constraints across collections
 * - Extracted from KnowledgeBaseStructureValidationService for single responsibility
 * - No external dependencies - pure business logic
 * - Follow @golden-rule patterns exactly
 */
export class KnowledgeCollectionValidationService {
  /**
   * Validates FAQ collection-level business rules
   */
  static validateFAQCollectionRules(faqs: FAQ[]): void {
    ValidationUtilities.validateNoDuplicateIds(faqs, (faq) => faq.id, 'FAQ');
    ValidationUtilities.validateCollectionSize(faqs, 1000, 'FAQ');
  }

  /**
   * Validates website source collection-level business rules
   */
  static validateWebsiteSourceCollectionRules(sources: WebsiteSource[]): void {
    // Check for duplicate URLs
    ValidationUtilities.validateNoDuplicateIds(sources, (source) => source.url, 'Website source URL');
    // Check for duplicate IDs
    ValidationUtilities.validateNoDuplicateIds(sources, (source) => source.id, 'Website source');
    // Check collection size
    ValidationUtilities.validateCollectionSize(sources, 100, 'Website source');
  }

  /**
   * Validates content consistency across knowledge base
   */
  static validateContentConsistency(props: KnowledgeBaseProps): void {
    // Business rule: Monitor empty knowledge base (informational only)
    const _hasContent = props.companyInfo.trim() || 
                       props.productCatalog.trim() || 
                       props.supportDocs.trim() || 
                       props.complianceGuidelines.trim() || 
                       props.faqs.length > 0 || 
                       props.websiteSources.length > 0;

    // Note: Empty knowledge base is allowed but should be monitored
    // Future: Consider domain event for analytics
  }
}