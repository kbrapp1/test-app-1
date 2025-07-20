import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import type { FAQ } from '../../value-objects/ai-configuration/KnowledgeBase';
import { ValidationUtilities } from './ValidationUtilities';
import { ContentSimilarityUtilities } from '../../utilities/ContentSimilarityUtilities';

// FAQ Structure Validation Service
//
// AI INSTRUCTIONS:
// - Pure domain service for FAQ validation logic
// - Handles individual FAQ validation and FAQ-specific business rules
export class FAQStructureValidationService {
  // Validates FAQ collection structure and business constraints
  static validateFAQCollection(faqs: FAQ[]): void {
    ValidationUtilities.validateArrayInput(faqs, 'FAQs');

    // Validate individual FAQ structure
    faqs.forEach((faq, index) => {
      this.validateSingleFAQStructure(faq, index);
    });
  }

  // Validates FAQ uniqueness before adding new FAQ
  static validateFAQUniqueness(existingFAQs: FAQ[], newFAQ: FAQ): void {
    const duplicateId = existingFAQs.find(existing => existing.id === newFAQ.id);
    if (duplicateId) {
      throw new BusinessRuleViolationError(
        'FAQ with duplicate ID cannot be added',
        { 
          faqId: newFAQ.id, 
          existingFAQs: existingFAQs.length,
          duplicateFound: true,
          conflictingFAQ: {
            id: duplicateId.id,
            question: duplicateId.question.substring(0, 100) + '...'
          }
        }
      );
    }

    // Business rule: Check for similar questions to prevent near-duplicates
    const similarQuestion = existingFAQs.find(existing => 
      this.areQuestionsSimilar(existing.question, newFAQ.question)
    );
    
    if (similarQuestion) {
      throw new BusinessRuleViolationError(
        'FAQ with similar question already exists',
        { 
          newQuestion: newFAQ.question.substring(0, 100),
          similarExistingQuestion: similarQuestion.question.substring(0, 100),
          existingFAQId: similarQuestion.id
        }
      );
    }
  }

  /**
   * Validates that FAQ exists for update operations
   */
  static validateFAQExistsForUpdate(faqs: FAQ[], faqId: string): void {
    ValidationUtilities.validateItemExistsForUpdate(
      faqs,
      faqId,
      (faq) => faq.id,
      (faq) => ({ id: faq.id, question: faq.question.substring(0, 50) + '...' }),
      'FAQ'
    );
  }

  // Private helper methods
  private static validateSingleFAQStructure(faq: FAQ, index: number): void {
    ValidationUtilities.validateRequiredStringField(faq.id, 'ID', index, faq.id || 'unknown');
    ValidationUtilities.validateRequiredStringField(faq.question, 'question', index, faq.id);
    ValidationUtilities.validateRequiredStringField(faq.answer, 'answer', index, faq.id);
    ValidationUtilities.validateRequiredStringField(faq.category, 'category', index, faq.id);

    // Business rule: Length limits
    ValidationUtilities.validateStringLength(faq.question, 500, 'FAQ question', faq.id, index);
    ValidationUtilities.validateStringLength(faq.answer, 2000, 'FAQ answer', faq.id, index);
  }

  private static areQuestionsSimilar(question1: string, question2: string): boolean {
    // Use domain-specific FAQ similarity algorithm
    return ContentSimilarityUtilities.areContentsSimilar(question1, question2, {
      algorithm: 'normalized',
      threshold: 0.8
    });
  }
}