/**
 * Entity Corrections Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Domain service for centralizing entity correction validation logic
 * - Contains pure business validation rules
 * - Follow @golden-rule patterns exactly
 * - Keep under 100 lines with focused responsibility
 * - Use domain-specific validation and errors
 * - No external dependencies
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export class EntityCorrectionsValidationService {
  static validateSessionId(sessionId: string): void {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Entity corrections must have a valid session ID',
        { sessionId }
      );
    }
  }
  
  static validateTotalCorrections(totalCorrections: number): void {
    if (totalCorrections < 0) {
      throw new BusinessRuleViolationError(
        'Total corrections cannot be negative',
        { totalCorrections }
      );
    }
  }
  
  static validateEntityValue(entityValue: string, context?: string): void {
    if (!entityValue || entityValue.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Entity value cannot be empty',
        { entityValue, context }
      );
    }
  }
  
  static validateMessageId(messageId: string, context?: string): void {
    if (!messageId || messageId.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Message ID is required for entity corrections',
        { messageId, context }
      );
    }
  }
  
  static validateConfidence(confidence: number, context?: string): void {
    if (confidence < 0 || confidence > 1) {
      throw new BusinessRuleViolationError(
        'Confidence must be between 0 and 1',
        { confidence, context }
      );
    }
  }
  
  static validateCorrectionValue(newValue: unknown, context?: string): void {
    if (newValue === null || newValue === undefined) {
      throw new BusinessRuleViolationError(
        'New value for correction cannot be null or undefined',
        { newValue, context }
      );
    }
    
    if (typeof newValue === 'string' && newValue.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'String correction value cannot be empty',
        { newValue, context }
      );
    }
  }
  
  static validateEntityType(
    entityType: string, 
    allowedTypes: readonly string[]
  ): void {
    if (!allowedTypes.includes(entityType)) {
      throw new BusinessRuleViolationError(
        'Invalid entity type for correction',
        { entityType, allowedTypes }
      );
    }
  }
}