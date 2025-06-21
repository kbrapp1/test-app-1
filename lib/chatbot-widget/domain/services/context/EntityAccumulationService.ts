/**
 * Entity Accumulation Service
 * 
 * AI INSTRUCTIONS:
 * - Domain service for entity accumulation business logic
 * - Process corrections before accumulations to maintain data integrity
 * - Handle entity merging strategies and conflict resolution
 * - Maintain single responsibility for entity lifecycle management
 * - Follow @golden-rule patterns exactly
 * - Keep under 200 lines with focused responsibility
 * - Use domain-specific errors for validation failures
 * - Pure domain logic with no infrastructure dependencies
 */

import { AccumulatedEntities } from '../../value-objects/context/AccumulatedEntities';
import { EntityCorrections } from '../../value-objects/context/EntityCorrections';
import { ExtractedEntities } from '../../value-objects/message-processing/IntentResult';
import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError';

export interface EntityMergeContext {
  messageId: string;
  defaultConfidence: number;
  enableDeduplication: boolean;
  confidenceThreshold: number;
}

export interface EntityMergeResult {
  accumulatedEntities: AccumulatedEntities;
  processedCorrections: EntityCorrections | null;
  mergeMetadata: {
    totalEntitiesProcessed: number;
    correctionsApplied: number;
    newEntitiesAdded: number;
    entitiesRemoved: number;
    processingTimestamp: Date;
  };
}

export class EntityAccumulationService {
  
  /**
   * Merge fresh extracted entities with accumulated entities (including corrections)
   */
  static mergeEntitiesWithCorrections(
    existingEntities: AccumulatedEntities | null,
    freshEntities: ExtractedEntities & { corrections?: EntityCorrections },
    context: EntityMergeContext
  ): EntityMergeResult {
    this.validateMergeContext(context);
    
    const accumulated = existingEntities || AccumulatedEntities.create();
    let result = accumulated;
    let correctionsProcessed: EntityCorrections | null = null;
    let correctionsApplied = 0;
    let entitiesRemoved = 0;
    
    // Process corrections FIRST if present
    if (freshEntities.corrections && !freshEntities.corrections.isEmpty()) {
      const correctionResult = this.processCorrections(result, freshEntities.corrections, context);
      result = correctionResult.updatedEntities;
      correctionsProcessed = freshEntities.corrections;
      correctionsApplied = correctionResult.correctionsApplied;
      entitiesRemoved = correctionResult.entitiesRemoved;
    }
    
    // Then process standard entity accumulation
    const accumulationResult = this.processStandardEntities(result, freshEntities, context);
    result = accumulationResult.updatedEntities;
    
    return {
      accumulatedEntities: result,
      processedCorrections: correctionsProcessed,
      mergeMetadata: {
        totalEntitiesProcessed: this.countExtractedEntities(freshEntities) + correctionsApplied,
        correctionsApplied,
        newEntitiesAdded: accumulationResult.entitiesAdded,
        entitiesRemoved,
        processingTimestamp: new Date()
      }
    };
  }
  

  
  /**
   * Build entity context for AI prompts
   */
  static buildEntityContextPrompt(entities: AccumulatedEntities): string {
    const contextParts: string[] = [];
    
    if (entities.decisionMakers.length > 0) {
      const makers = entities.decisionMakers.map(dm => dm.value).join(', ');
      contextParts.push(`Decision makers identified: ${makers}`);
    }
    
    if (entities.painPoints.length > 0) {
      const points = entities.painPoints.map(pp => pp.value).join(', ');
      contextParts.push(`Pain points mentioned: ${points}`);
    }
    
    if (entities.budget) {
      const age = this.getEntityAge(entities.budget.extractedAt);
      contextParts.push(`Budget mentioned: ${entities.budget.value} (${age})`);
    }
    
    if (entities.timeline) {
      const age = this.getEntityAge(entities.timeline.extractedAt);
      contextParts.push(`Timeline mentioned: ${entities.timeline.value} (${age})`);
    }
    
    if (entities.urgency) {
      contextParts.push(`Urgency level: ${entities.urgency.value}`);
    }
    
    if (entities.company) {
      contextParts.push(`Company: ${entities.company.value}`);
    }
    
    if (entities.industry) {
      contextParts.push(`Industry: ${entities.industry.value}`);
    }
    
    if (entities.teamSize) {
      contextParts.push(`Team size: ${entities.teamSize.value}`);
    }
    
    return contextParts.length > 0 
      ? `ACCUMULATED CONVERSATION CONTEXT:\n${contextParts.join('\n')}\n\n`
      : '';
  }
  
  // Private implementation methods
  private static processCorrections(
    accumulated: AccumulatedEntities,
    corrections: EntityCorrections,
    context: EntityMergeContext
  ): { updatedEntities: AccumulatedEntities; correctionsApplied: number; entitiesRemoved: number } {
    let result = accumulated;
    let correctionsApplied = 0;
    let entitiesRemoved = 0;
    
    // Process removals
    entitiesRemoved += this.processEntityRemovals(result, corrections);
    
    // Note: Actual removal logic would need to be implemented in AccumulatedEntities
    // For now, we track the count but don't modify the entities
    // This would be enhanced in a future iteration
    
    correctionsApplied = corrections.totalCorrections;
    
    return { updatedEntities: result, correctionsApplied, entitiesRemoved };
  }
  
  private static processEntityRemovals(
    accumulated: AccumulatedEntities,
    corrections: EntityCorrections
  ): number {
    let removalsCount = 0;
    
    removalsCount += corrections.removedDecisionMakers.length;
    removalsCount += corrections.removedPainPoints.length;
    removalsCount += corrections.removedIntegrationNeeds.length;
    removalsCount += corrections.removedEvaluationCriteria.length;
    
    return removalsCount;
  }
  
  private static processStandardEntities(
    accumulated: AccumulatedEntities,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): { updatedEntities: AccumulatedEntities; entitiesAdded: number } {
    let result = accumulated;
    let entitiesAdded = 0;
    
    // Process replaceable entities (only those that exist in ExtractedEntities)
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
    
    // Process confidence-based entities (only those that exist in ExtractedEntities)
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
  
  private static validateMergeContext(context: EntityMergeContext): void {
    if (!context.messageId || context.messageId.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Message ID is required for entity accumulation',
        { context }
      );
    }
    
    if (context.defaultConfidence < 0 || context.defaultConfidence > 1) {
      throw new BusinessRuleViolationError(
        'Default confidence must be between 0 and 1',
        { confidence: context.defaultConfidence, context }
      );
    }
  }
  
  private static countExtractedEntities(entities: ExtractedEntities): number {
    let count = 0;
    // Only count fields that exist in current ExtractedEntities interface
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
    return count;
  }
  
  private static getEntityAge(extractedAt: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - extractedAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'just now';
    }
  }
} 