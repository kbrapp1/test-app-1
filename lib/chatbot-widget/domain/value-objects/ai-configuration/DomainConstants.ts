/**
 * Domain Constants Value Object
 * 
 * Orchestrates domain value objects providing single access point
 * for all chatbot domain constants following DDD principles.
 */

import { LeadScoringEntities } from '../../types/ChatbotTypes';
import { IntentTypes, IntentType, IntentCategory } from './IntentTypes';
import { JourneyStages, JourneyStage } from './JourneyStages';
import { EntityTypes, EntityType } from './EntityTypes';
import { LeadScoringRules } from './LeadScoringRules';
import { ThresholdConfiguration } from './ThresholdConfiguration';

// Re-export types for backward compatibility
export type { IntentType, IntentCategory, JourneyStage, EntityType };

// Re-export constants for backward compatibility
export const INTENT_TYPES = IntentTypes.getAllIntentTypes();
export const JOURNEY_STAGES = JourneyStages.getAllJourneyStages();
export const ALL_ENTITY_TYPES = EntityTypes.getAllEntityTypes();
export const SALES_READY_STAGES = JourneyStages.getSalesReadyStages();
export const ACTIVELY_ENGAGED_STAGES = JourneyStages.getActivelyEngagedStages();
export const DEFAULT_THRESHOLDS = ThresholdConfiguration.getDefaultThresholds();
export const LEAD_SCORING_RULES = LeadScoringRules.getLeadScoringRules();
export const ROLE_AUTHORITY_WEIGHTS = LeadScoringRules.getRoleAuthorityWeights();

// Intent categories for backward compatibility
export const SALES_INTENTS = IntentTypes.getSalesIntents();
export const SUPPORT_INTENTS = IntentTypes.getSupportIntents();
export const QUALIFICATION_INTENTS = IntentTypes.getQualificationIntents();
export const BUSINESS_CONTEXT_INTENTS = IntentTypes.getBusinessContextIntents();
export const GENERAL_INTENTS = IntentTypes.getGeneralIntents();

// Entity constants for backward compatibility
export const CORE_BUSINESS_ENTITIES = EntityTypes.getCoreBusinessEntities();
export const ADVANCED_ENTITIES = EntityTypes.getAdvancedEntities();
export const URGENCY_LEVELS = EntityTypes.getUrgencyLevels();
export const SEVERITY_LEVELS = EntityTypes.getSeverityLevels();
export const CONTACT_METHODS = EntityTypes.getContactMethods();
export const EVENT_TYPES = EntityTypes.getEventTypes();
export const ISSUE_TYPES = EntityTypes.getIssueTypes();

/**
 * DomainConstants Value Object
 * Orchestrates domain value objects and provides unified interface
 */
export class DomainConstants {
  
  // Intent Type Methods - Delegate to IntentTypes
  static getAllIntentTypes(): readonly IntentType[] {
    return IntentTypes.getAllIntentTypes();
  }

  static getSalesIntents(): readonly IntentType[] {
    return IntentTypes.getSalesIntents();
  }

  static getSupportIntents(): readonly IntentType[] {
    return IntentTypes.getSupportIntents();
  }

  static getQualificationIntents(): readonly IntentType[] {
    return IntentTypes.getQualificationIntents();
  }

  static getBusinessContextIntents(): readonly IntentType[] {
    return IntentTypes.getBusinessContextIntents();
  }

  static getGeneralIntents(): readonly IntentType[] {
    return IntentTypes.getGeneralIntents();
  }

  static isValidIntentType(intent: string): intent is IntentType {
    return IntentTypes.isValidIntentType(intent);
  }

  static isBusinessContextIntent(intent: string): boolean {
    return IntentTypes.isBusinessContextIntent(intent);
  }

  static getIntentCategory(intent: IntentType): IntentCategory {
    return IntentTypes.getIntentCategory(intent);
  }

  // Journey Stage Methods - Delegate to JourneyStages
  static getAllJourneyStages(): readonly JourneyStage[] {
    return JourneyStages.getAllJourneyStages();
  }

  static getSalesReadyStages(): readonly JourneyStage[] {
    return JourneyStages.getSalesReadyStages();
  }

  static getActivelyEngagedStages(): readonly JourneyStage[] {
    return JourneyStages.getActivelyEngagedStages();
  }

  static isValidJourneyStage(stage: string): stage is JourneyStage {
    return JourneyStages.isValidJourneyStage(stage);
  }

  static isSalesReady(stage: JourneyStage): boolean {
    return JourneyStages.isSalesReady(stage);
  }

  static isActivelyEngaged(stage: JourneyStage): boolean {
    return JourneyStages.isActivelyEngaged(stage);
  }

  // Entity Type Methods - Delegate to EntityTypes
  static getAllEntityTypes(): readonly EntityType[] {
    return EntityTypes.getAllEntityTypes();
  }

  static getCoreBusinessEntities(): readonly string[] {
    return EntityTypes.getCoreBusinessEntities();
  }

  static getAdvancedEntities(): readonly string[] {
    return EntityTypes.getAdvancedEntities();
  }

  static isValidEntityType(entity: string): entity is EntityType {
    return EntityTypes.isValidEntityType(entity);
  }

  static getEntityCategory(entity: EntityType): 'core_business' | 'advanced' {
    return EntityTypes.getEntityCategory(entity);
  }

  static getUrgencyLevels(): readonly string[] {
    return EntityTypes.getUrgencyLevels();
  }

  static getSeverityLevels(): readonly string[] {
    return EntityTypes.getSeverityLevels();
  }

  static getContactMethods(): readonly string[] {
    return EntityTypes.getContactMethods();
  }

  static getEventTypes(): readonly string[] {
    return EntityTypes.getEventTypes();
  }

  static getIssueTypes(): readonly string[] {
    return EntityTypes.getIssueTypes();
  }

  // Lead Scoring Methods - Delegate to LeadScoringRules
  static getLeadScoringRules() {
    return LeadScoringRules.getLeadScoringRules();
  }

  static getLeadScoringWeight(entity: keyof typeof LEAD_SCORING_RULES): number {
    return LeadScoringRules.getLeadScoringWeight(entity);
  }

  static getRoleAuthorityScore(role: string): number {
    return LeadScoringRules.getRoleAuthorityScore(role);
  }

  static getRoleAuthorityWeights() {
    return LeadScoringRules.getRoleAuthorityWeights();
  }

  static calculateLeadScore(entities: LeadScoringEntities): number {
    return LeadScoringRules.calculateLeadScore(entities);
  }

  // Threshold Methods - Delegate to ThresholdConfiguration
  static getDefaultThresholds() {
    return ThresholdConfiguration.getDefaultThresholds();
  }

  static getIntentConfidenceThreshold(): number {
    return ThresholdConfiguration.getIntentConfidenceThreshold();
  }

  static getStageTransitionThreshold(): number {
    return ThresholdConfiguration.getStageTransitionThreshold();
  }

  static getPersonaInferenceThreshold(): number {
    return ThresholdConfiguration.getPersonaInferenceThreshold();
  }

  // Validation Methods - Aggregate from all value objects
  static validateBusinessRules(): { isValid: boolean; errors: string[] } {
    const scoringValidation = LeadScoringRules.validateScoringRules();
    const thresholdValidation = ThresholdConfiguration.validateThresholds();
    
    return {
      isValid: scoringValidation.isValid && thresholdValidation.isValid,
      errors: [...scoringValidation.errors, ...thresholdValidation.errors]
    };
  }

  // Summary Methods - Aggregate information
  static getDomainSummary() {
    return {
      intentTypes: IntentTypes.getAllIntentTypes().length,
      journeyStages: JourneyStages.getAllJourneyStages().length,
      entityTypes: EntityTypes.getAllEntityTypes().length,
      businessRules: Object.keys(LeadScoringRules.getLeadScoringRules()).length,
      thresholds: Object.keys(ThresholdConfiguration.getDefaultThresholds()).length,
      validation: this.validateBusinessRules()
    };
  }
} 