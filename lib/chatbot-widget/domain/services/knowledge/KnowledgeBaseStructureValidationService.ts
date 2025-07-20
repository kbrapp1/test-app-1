import type { FAQ, WebsiteSource, KnowledgeBaseProps } from '../../value-objects/ai-configuration/KnowledgeBase';
import { FAQStructureValidationService } from './FAQStructureValidationService';
import { WebsiteSourceStructureValidationService } from './WebsiteSourceStructureValidationService';
import { KnowledgeCollectionValidationService } from './KnowledgeCollectionValidationService';

// Knowledge Base Structure Validation Service
//
// AI INSTRUCTIONS:
// - Main orchestration service that coordinates all validation types
// - Delegates to specialized validation services for single responsibility
export class KnowledgeBaseStructureValidationService {
  // Validates complete knowledge base structure and business rules
  static validateKnowledgeBaseStructure(props: KnowledgeBaseProps): void {
    this.validateFAQCollection(props.faqs);
    this.validateWebsiteSourceCollection(props.websiteSources);
    this.validateContentConsistency(props);
  }

  // Validates FAQ collection structure and business constraints
  static validateFAQCollection(faqs: FAQ[]): void {
    FAQStructureValidationService.validateFAQCollection(faqs);
    KnowledgeCollectionValidationService.validateFAQCollectionRules(faqs);
  }

  // Validates website source collection structure and business constraints
  static validateWebsiteSourceCollection(websiteSources: WebsiteSource[]): void {
    WebsiteSourceStructureValidationService.validateWebsiteSourceCollection(websiteSources);
    KnowledgeCollectionValidationService.validateWebsiteSourceCollectionRules(websiteSources);
  }

  /**
   * Validates FAQ uniqueness before adding new FAQ
   */
  static validateFAQUniqueness(existingFAQs: FAQ[], newFAQ: FAQ): void {
    FAQStructureValidationService.validateFAQUniqueness(existingFAQs, newFAQ);
  }

  /**
   * Validates website source uniqueness before adding new source
   */
  static validateWebsiteSourceUniqueness(existingSources: WebsiteSource[], newSource: WebsiteSource): void {
    WebsiteSourceStructureValidationService.validateWebsiteSourceUniqueness(existingSources, newSource);
  }

  /**
   * Validates that FAQ exists for update operations
   */
  static validateFAQExistsForUpdate(faqs: FAQ[], faqId: string): void {
    FAQStructureValidationService.validateFAQExistsForUpdate(faqs, faqId);
  }

  /**
   * Validates that website source exists for update operations
   */
  static validateWebsiteSourceExistsForUpdate(sources: WebsiteSource[], sourceId: string): void {
    WebsiteSourceStructureValidationService.validateWebsiteSourceExistsForUpdate(sources, sourceId);
  }

  /**
   * Validates content consistency across knowledge base
   */
  private static validateContentConsistency(props: KnowledgeBaseProps): void {
    KnowledgeCollectionValidationService.validateContentConsistency(props);
  }
}