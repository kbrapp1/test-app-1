/**
 * Entity Processor Service
 * 
 * Domain service responsible for processing standard entity accumulation
 * following DDD principles for the chatbot domain.
 */

import { AccumulatedEntities } from '../../value-objects/context/AccumulatedEntities';
import { ExtractedEntities } from '../../value-objects/message-processing/IntentResult';
import { EntityMergeContext } from '../../value-objects/context/EntityMergeContext';

export interface EntityProcessingResult {
  updatedEntities: AccumulatedEntities;
  entitiesAdded: number;
}

export class EntityProcessor {
  
  static processStandardEntities(
    accumulated: AccumulatedEntities,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): EntityProcessingResult {
    let result = accumulated;
    let entitiesAdded = 0;
    
    // Process replaceable entities
    const replaceableResult = this.processReplaceableEntities(result, freshEntities, context);
    result = replaceableResult.updatedEntities;
    entitiesAdded += replaceableResult.entitiesAdded;
    
    // Process confidence-based entities
    const confidenceResult = this.processConfidenceBasedEntities(result, freshEntities, context);
    result = confidenceResult.updatedEntities;
    entitiesAdded += confidenceResult.entitiesAdded;
    
    // Process new entity types (commented out until AccumulatedEntities supports them)
    const newEntitiesResult = this.processNewEntityTypes(result, freshEntities, context);
    entitiesAdded += newEntitiesResult.entitiesAdded;
    
    return { updatedEntities: result, entitiesAdded };
  }

  private static processReplaceableEntities(
    accumulated: AccumulatedEntities,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): EntityProcessingResult {
    let result = accumulated;
    let entitiesAdded = 0;
    
    if (freshEntities.budget) {
      result = result.withReplaceableEntity('budget', freshEntities.budget, context.messageId, context.defaultConfidence);
      entitiesAdded += 1;
    }
    
    if (freshEntities.timeline) {
      result = result.withReplaceableEntity('timeline', freshEntities.timeline, context.messageId, context.defaultConfidence);
      entitiesAdded += 1;
    }
    
    if (freshEntities.urgency) {
      result = result.withReplaceableEntity('urgency', freshEntities.urgency, context.messageId, context.defaultConfidence);
      entitiesAdded += 1;
    }
    
    if (freshEntities.contactMethod) {
      result = result.withReplaceableEntity('contactMethod', freshEntities.contactMethod, context.messageId, context.defaultConfidence);
      entitiesAdded += 1;
    }
    
    return { updatedEntities: result, entitiesAdded };
  }

  private static processConfidenceBasedEntities(
    accumulated: AccumulatedEntities,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): EntityProcessingResult {
    let result = accumulated;
    let entitiesAdded = 0;
    
    if (freshEntities.visitorName) {
      result = result.withConfidenceBasedEntity('visitorName', freshEntities.visitorName, context.messageId, context.defaultConfidence, context.confidenceThreshold);
      entitiesAdded += 1;
    }
    
    if (freshEntities.industry) {
      result = result.withConfidenceBasedEntity('industry', freshEntities.industry, context.messageId, context.defaultConfidence, context.confidenceThreshold);
      entitiesAdded += 1;
    }
    
    if (freshEntities.company) {
      result = result.withConfidenceBasedEntity('company', freshEntities.company, context.messageId, context.defaultConfidence, context.confidenceThreshold);
      entitiesAdded += 1;
    }
    
    if (freshEntities.teamSize) {
      result = result.withConfidenceBasedEntity('teamSize', freshEntities.teamSize, context.messageId, context.defaultConfidence, context.confidenceThreshold);
      entitiesAdded += 1;
    }
    
    if (freshEntities.role) {
      result = result.withConfidenceBasedEntity('role', freshEntities.role, context.messageId, context.defaultConfidence, context.confidenceThreshold);
      entitiesAdded += 1;
    }
    
    return { updatedEntities: result, entitiesAdded };
  }

  private static processNewEntityTypes(
    accumulated: AccumulatedEntities,
    freshEntities: ExtractedEntities,
    _context: EntityMergeContext
  ): EntityProcessingResult {
    let entitiesAdded = 0;
    
    // Count new entities that would be processed
    // Implementation would be added when AccumulatedEntities supports these entity types
    
    if (freshEntities.currentSolution) entitiesAdded += 1;
    if (freshEntities.preferredTime) entitiesAdded += 1;
    if (freshEntities.sentiment) entitiesAdded += 1;
    if (freshEntities.emotionalTone) entitiesAdded += 1;
    if (freshEntities.conversationPhase) entitiesAdded += 1;
    if (freshEntities.engagementLevel) entitiesAdded += 1;
    if (freshEntities.nextBestAction) entitiesAdded += 1;
    if (freshEntities.responseStyle) entitiesAdded += 1;
    if (freshEntities.callToAction) entitiesAdded += 1;
    if (typeof freshEntities.leadCaptureReadiness === 'boolean') entitiesAdded += 1;
    if (typeof freshEntities.shouldEscalateToHuman === 'boolean') entitiesAdded += 1;
    if (typeof freshEntities.shouldAskQualificationQuestions === 'boolean') entitiesAdded += 1;
    
    return { updatedEntities: accumulated, entitiesAdded };
  }

  static countExtractedEntities(entities: ExtractedEntities): number {
    let count = 0;
    
    // Core Business Entities
    count += entities.visitorName ? 1 : 0;
    count += entities.location ? 1 : 0;
    count += entities.budget ? 1 : 0;
    count += entities.timeline ? 1 : 0;
    count += entities.company ? 1 : 0;
    count += entities.industry ? 1 : 0;
    count += entities.teamSize ? 1 : 0;
    count += entities.role ? 1 : 0;
    count += entities.urgency ? 1 : 0;
    count += entities.contactMethod ? 1 : 0;
    
    // New Entity Types (2025 Best Practice)
    count += entities.currentSolution ? 1 : 0;
    count += entities.preferredTime ? 1 : 0;
    count += entities.sentiment ? 1 : 0;
    count += entities.emotionalTone ? 1 : 0;
    count += entities.conversationPhase ? 1 : 0;
    count += entities.engagementLevel ? 1 : 0;
    count += entities.nextBestAction ? 1 : 0;
    count += entities.responseStyle ? 1 : 0;
    count += entities.callToAction ? 1 : 0;
    count += typeof entities.leadCaptureReadiness === 'boolean' ? 1 : 0;
    count += typeof entities.shouldEscalateToHuman === 'boolean' ? 1 : 0;
    count += typeof entities.shouldAskQualificationQuestions === 'boolean' ? 1 : 0;
    
    return count;
  }

  static categorizeEntities(entities: ExtractedEntities): {
    replaceableEntities: string[];
    confidenceBasedEntities: string[];
    newEntityTypes: string[];
    booleanEntities: string[];
  } {
    const replaceableEntities: string[] = [];
    const confidenceBasedEntities: string[] = [];
    const newEntityTypes: string[] = [];
    const booleanEntities: string[] = [];

    // Categorize replaceable entities
    if (entities.budget) replaceableEntities.push('budget');
    if (entities.timeline) replaceableEntities.push('timeline');
    if (entities.urgency) replaceableEntities.push('urgency');
    if (entities.contactMethod) replaceableEntities.push('contactMethod');

    // Categorize confidence-based entities
    if (entities.visitorName) confidenceBasedEntities.push('visitorName');
    if (entities.industry) confidenceBasedEntities.push('industry');
    if (entities.company) confidenceBasedEntities.push('company');
    if (entities.teamSize) confidenceBasedEntities.push('teamSize');
    if (entities.role) confidenceBasedEntities.push('role');

    // Categorize new entity types
    if (entities.currentSolution) newEntityTypes.push('currentSolution');
    if (entities.preferredTime) newEntityTypes.push('preferredTime');
    if (entities.sentiment) newEntityTypes.push('sentiment');
    if (entities.emotionalTone) newEntityTypes.push('emotionalTone');
    if (entities.conversationPhase) newEntityTypes.push('conversationPhase');
    if (entities.engagementLevel) newEntityTypes.push('engagementLevel');
    if (entities.nextBestAction) newEntityTypes.push('nextBestAction');
    if (entities.responseStyle) newEntityTypes.push('responseStyle');
    if (entities.callToAction) newEntityTypes.push('callToAction');

    // Categorize boolean entities
    if (typeof entities.leadCaptureReadiness === 'boolean') booleanEntities.push('leadCaptureReadiness');
    if (typeof entities.shouldEscalateToHuman === 'boolean') booleanEntities.push('shouldEscalateToHuman');
    if (typeof entities.shouldAskQualificationQuestions === 'boolean') booleanEntities.push('shouldAskQualificationQuestions');

    return {
      replaceableEntities,
      confidenceBasedEntities,
      newEntityTypes,
      booleanEntities
    };
  }
}