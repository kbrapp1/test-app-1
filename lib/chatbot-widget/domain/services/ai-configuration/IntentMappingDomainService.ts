/**
 * Intent Mapping Domain Service
 * 
 * Pure business logic for mapping intents to conversation phases and engagement levels.
 * Extracted from OpenAIChatbotProcessingService following DDD patterns.
 * Domain Layer: Contains only business rules, no external dependencies.
 */

import { ExtractedEntities } from '../../value-objects/message-processing/IntentResult';

export class IntentMappingDomainService {
  
  /**
   * Maps intent to conversation phase based on business rules
   */
  public mapIntentToPhase(intent: string): string {
    switch (intent) {
      case 'demo':
      case 'pricing': 
        return 'demonstration';
      case 'qualification': 
        return 'qualification';
      case 'objection': 
        return 'objection_handling';
      default: 
        return 'discovery';
    }
  }

  /**
   * Maps intent to engagement level based on business rules
   */
  public mapIntentToEngagement(intent: string): string {
    switch (intent) {
      case 'demo':
      case 'pricing': 
        return 'high';
      case 'qualification': 
        return 'medium';
      default: 
        return 'low';
    }
  }

  /**
   * Maps function call entities to expected format following business rules
   */
  public mapFunctionCallEntitiesToExpectedFormat(leadData: Record<string, unknown>): ExtractedEntities {
    const mappedEntities: Record<string, unknown> = { ...leadData };
    
    // Business rule: Map snake_case to camelCase for array entities
    if (leadData.pain_points) {
      mappedEntities.painPoints = leadData.pain_points;
      delete mappedEntities.pain_points;
    }
    
    // Business rule: Goals already uses correct camelCase name
    // Other fields like name, company, role, budget, timeline, urgency are already correct
    
    return mappedEntities as ExtractedEntities;
  }

  /**
   * Determines next best action based on intent and response data
   */
  public determineNextBestAction(intent: string, shouldCaptureContact: boolean): string {
    if (shouldCaptureContact) {
      return 'capture_contact';
    }
    
    // Business logic for next action based on intent
    switch (intent) {
      case 'demo':
        return 'schedule_demo';
      case 'pricing':
        return 'provide_pricing';
      case 'qualification':
        return 'continue_qualification';
      default:
        return 'continue_conversation';
    }
  }

  /**
   * Validates intent against business rules
   */
  public validateIntent(intent: string): boolean {
    const validIntents = [
      'inquiry', 'demo', 'pricing', 'qualification', 
      'objection', 'support', 'technical', 'unknown'
    ];
    
    return validIntents.includes(intent);
  }

  /**
   * Calculates default confidence based on intent type
   */
  public calculateDefaultConfidence(intent: string): number {
    // Business rule: Higher confidence for specific business intents
    switch (intent) {
      case 'demo':
      case 'pricing':
        return 0.9;
      case 'qualification':
        return 0.8;
      case 'objection':
        return 0.75;
      default:
        return 0.7;
    }
  }
}