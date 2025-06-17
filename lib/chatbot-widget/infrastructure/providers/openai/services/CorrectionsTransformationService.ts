/**
 * Corrections Transformation Service
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure service for transforming OpenAI corrections response to domain objects
 * - Handle malformed or missing corrections data gracefully
 * - Follow @golden-rule patterns exactly
 * - Keep under 200 lines with focused responsibility
 * - Use domain-specific validation and error handling
 * - Pure transformation logic with no business rules
 */

import { EntityCorrections } from '../../../../domain/value-objects/context/EntityCorrections';
import { BusinessRuleViolationError } from '../../../../domain/errors/BusinessRuleViolationError';

/**
 * Raw corrections data from OpenAI function call response
 */
export interface OpenAICorrectionsResponse {
  corrections?: {
    // Removal fields
    removedDecisionMakers?: string[];
    removedPainPoints?: string[];
    removedIntegrationNeeds?: string[];
    removedEvaluationCriteria?: string[];
    
    // Correction fields
    correctedBudget?: string;
    correctedTimeline?: string;
    correctedUrgency?: string;
    correctedContactMethod?: string;
    correctedRole?: string;
    correctedIndustry?: string;
    correctedCompany?: string;
    correctedTeamSize?: string;
  };
}

/**
 * Transformation context for corrections processing
 */
export interface CorrectionsTransformationContext {
  sessionId: string;
  messageId: string;
  extractionMethod: 'ai' | 'explicit' | 'inferred';
  defaultConfidence: number;
  timestamp?: Date;
}

export class CorrectionsTransformationService {
  /**
   * Transform OpenAI corrections response to EntityCorrections domain object
   */
  static transformCorrections(
    response: OpenAICorrectionsResponse,
    context: CorrectionsTransformationContext
  ): EntityCorrections | null {
    try {
      // Return null if no corrections detected
      if (!response.corrections || this.isEmptyCorrections(response.corrections)) {
        return null;
      }

      const { corrections } = response;
      let entityCorrections = EntityCorrections.create(context.sessionId);

      // Process removals first (following domain accumulation rules)
      entityCorrections = this.processRemovals(entityCorrections, corrections, context);

      // Process corrections second
      entityCorrections = this.processCorrections(entityCorrections, corrections, context);

      return entityCorrections;

    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      throw new BusinessRuleViolationError(
        'Failed to transform OpenAI corrections response',
        { 
          sessionId: context.sessionId,
          messageId: context.messageId,
          originalError: error instanceof Error ? error.message : 'Unknown error',
          response 
        }
      );
    }
  }

  /**
   * Process removal operations with correct method signature
   */
  private static processRemovals(
    entityCorrections: EntityCorrections,
    corrections: NonNullable<OpenAICorrectionsResponse['corrections']>,
    context: CorrectionsTransformationContext
  ): EntityCorrections {
    let result = entityCorrections;

    // Process decision makers removals (entityType, entityValue, messageId, confidence?, reason?)
    if (corrections.removedDecisionMakers?.length) {
      corrections.removedDecisionMakers.forEach(person => {
        if (this.isValidStringValue(person)) {
          result = result.withRemovedEntity(
            'decisionMakers',
            person,
            context.messageId,
            context.defaultConfidence,
            'Explicitly stated as not a decision maker'
          );
        }
      });
    }

    // Process pain points removals
    if (corrections.removedPainPoints?.length) {
      corrections.removedPainPoints.forEach(painPoint => {
        if (this.isValidStringValue(painPoint)) {
          result = result.withRemovedEntity(
            'painPoints',
            painPoint,
            context.messageId,
            context.defaultConfidence,
            'Explicitly stated as resolved or not applicable'
          );
        }
      });
    }

    // Process integration needs removals
    if (corrections.removedIntegrationNeeds?.length) {
      corrections.removedIntegrationNeeds.forEach(need => {
        if (this.isValidStringValue(need)) {
          result = result.withRemovedEntity(
            'integrationNeeds',
            need,
            context.messageId,
            context.defaultConfidence,
            'Explicitly stated as not needed'
          );
        }
      });
    }

    // Process evaluation criteria removals
    if (corrections.removedEvaluationCriteria?.length) {
      corrections.removedEvaluationCriteria.forEach(criteria => {
        if (this.isValidStringValue(criteria)) {
          result = result.withRemovedEntity(
            'evaluationCriteria',
            criteria,
            context.messageId,
            context.defaultConfidence,
            'Explicitly stated as not important'
          );
        }
      });
    }

    return result;
  }

  /**
   * Process correction operations with correct method signature
   */
  private static processCorrections(
    entityCorrections: EntityCorrections,
    corrections: NonNullable<OpenAICorrectionsResponse['corrections']>,
    context: CorrectionsTransformationContext
  ): EntityCorrections {
    let result = entityCorrections;

    // Process corrections (entityType, newValue, messageId, previousValue?, confidence?, reason?)
    if (corrections.correctedBudget && this.isValidStringValue(corrections.correctedBudget)) {
      result = result.withCorrectedEntity(
        'budget',
        corrections.correctedBudget,
        context.messageId,
        undefined, // previousValue
        context.defaultConfidence,
        'Budget explicitly corrected'
      );
    }

    if (corrections.correctedTimeline && this.isValidStringValue(corrections.correctedTimeline)) {
      result = result.withCorrectedEntity(
        'timeline',
        corrections.correctedTimeline,
        context.messageId,
        undefined, // previousValue
        context.defaultConfidence,
        'Timeline explicitly corrected'
      );
    }

    if (corrections.correctedUrgency && this.isValidStringValue(corrections.correctedUrgency)) {
      result = result.withCorrectedEntity(
        'urgency',
        corrections.correctedUrgency as 'low'|'medium'|'high',
        context.messageId,
        undefined, // previousValue
        context.defaultConfidence,
        'Urgency level explicitly corrected'
      );
    }

    if (corrections.correctedContactMethod && this.isValidStringValue(corrections.correctedContactMethod)) {
      result = result.withCorrectedEntity(
        'contactMethod',
        corrections.correctedContactMethod as 'email'|'phone'|'meeting',
        context.messageId,
        undefined, // previousValue
        context.defaultConfidence,
        'Contact method explicitly corrected'
      );
    }

    if (corrections.correctedRole && this.isValidStringValue(corrections.correctedRole)) {
      result = result.withCorrectedEntity(
        'role',
        corrections.correctedRole,
        context.messageId,
        undefined, // previousValue
        context.defaultConfidence,
        'Role explicitly corrected'
      );
    }

    if (corrections.correctedIndustry && this.isValidStringValue(corrections.correctedIndustry)) {
      result = result.withCorrectedEntity(
        'industry',
        corrections.correctedIndustry,
        context.messageId,
        undefined, // previousValue
        context.defaultConfidence,
        'Industry explicitly corrected'
      );
    }

    if (corrections.correctedCompany && this.isValidStringValue(corrections.correctedCompany)) {
      result = result.withCorrectedEntity(
        'company',
        corrections.correctedCompany,
        context.messageId,
        undefined, // previousValue
        context.defaultConfidence,
        'Company name explicitly corrected'
      );
    }

    if (corrections.correctedTeamSize && this.isValidStringValue(corrections.correctedTeamSize)) {
      result = result.withCorrectedEntity(
        'teamSize',
        corrections.correctedTeamSize,
        context.messageId,
        undefined, // previousValue
        context.defaultConfidence,
        'Team size explicitly corrected'
      );
    }

    return result;
  }

  /**
   * Check if corrections object is effectively empty
   */
  private static isEmptyCorrections(corrections: NonNullable<OpenAICorrectionsResponse['corrections']>): boolean {
    const hasRemovals = (
      corrections.removedDecisionMakers?.length ||
      corrections.removedPainPoints?.length ||
      corrections.removedIntegrationNeeds?.length ||
      corrections.removedEvaluationCriteria?.length
    );

    const hasCorrections = (
      corrections.correctedBudget ||
      corrections.correctedTimeline ||
      corrections.correctedUrgency ||
      corrections.correctedContactMethod ||
      corrections.correctedRole ||
      corrections.correctedIndustry ||
      corrections.correctedCompany ||
      corrections.correctedTeamSize
    );

    return !hasRemovals && !hasCorrections;
  }

  /**
   * Validate string value for processing
   */
  private static isValidStringValue(value: string | undefined | null): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
} 