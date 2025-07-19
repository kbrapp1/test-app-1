/**
 * Entity Accumulation Service
 * 
 * Orchestrates entity accumulation business logic by delegating to specialized services.
 * Maintains single responsibility as the main entry point for entity operations
 * following DDD principles for the chatbot domain.
 */

import { AccumulatedEntities } from '../../value-objects/context/AccumulatedEntities';
import { EntityCorrections } from '../../value-objects/context/EntityCorrections';
import { ExtractedEntities } from '../../value-objects/message-processing/IntentResult';
import { EntityMergeContext } from '../../value-objects/context/EntityMergeContext';
import { EntityMergeResult } from '../../value-objects/context/EntityMergeResult';
import { EntityCorrectionsProcessor } from './EntityCorrectionsProcessor';
import { EntityProcessor } from './EntityProcessor';
import { EntityContextBuilder } from './EntityContextBuilder';

// Re-export types for backward compatibility
export type { EntityMergeContext } from '../../value-objects/context/EntityMergeContext';
export type { EntityMergeResult } from '../../value-objects/context/EntityMergeResult';

export class EntityAccumulationService {
  
  // Merge fresh extracted entities with accumulated entities (including corrections)
  static mergeEntitiesWithCorrections(
    existingEntities: AccumulatedEntities | null,
    freshEntities: ExtractedEntities & { corrections?: EntityCorrections },
    context: EntityMergeContext
  ): EntityMergeResult {
    const accumulated = existingEntities || AccumulatedEntities.create();
    let result = EntityMergeResult.createEmpty(accumulated);
    
    // Process corrections FIRST if present
    if (freshEntities.corrections && !freshEntities.corrections.isEmpty()) {
      const correctionResult = EntityCorrectionsProcessor.processCorrections(
        result.accumulatedEntities, 
        freshEntities.corrections, 
        context
      );
      
      result = result
        .withEntities(correctionResult.updatedEntities)
        .withCorrections(freshEntities.corrections)
        .incrementCorrections(correctionResult.correctionsApplied)
        .incrementRemoved(correctionResult.entitiesRemoved);
    }
    
    // Then process standard entity accumulation
    const accumulationResult = EntityProcessor.processStandardEntities(
      result.accumulatedEntities, 
      freshEntities, 
      context
    );
    
    const totalEntitiesProcessed = EntityProcessor.countExtractedEntities(freshEntities) + result.correctionsApplied;
    
    return result
      .withEntities(accumulationResult.updatedEntities)
      .incrementAdded(accumulationResult.entitiesAdded)
      .withMetadata({ 
        totalEntitiesProcessed,
        processingTimestamp: new Date() 
      });
  }

  // Build entity context for AI prompts - Delegate to specialized service
  static buildEntityContextPrompt(entities: AccumulatedEntities): string {
    return EntityContextBuilder.buildEntityContextPrompt(entities);
  }
  
  // Build context summary - New method leveraging specialized service
  static buildContextSummary(entities: AccumulatedEntities) {
    return EntityContextBuilder.buildContextSummary(entities);
  }
  
  // Count extracted entities - Delegate to specialized service
  static countExtractedEntities(entities: ExtractedEntities): number {
    return EntityProcessor.countExtractedEntities(entities);
  }
  
  // Categorize entities - New method leveraging specialized service
  static categorizeEntities(entities: ExtractedEntities) {
    return EntityProcessor.categorizeEntities(entities);
  }
  
  // Validate corrections - New method leveraging specialized service
  static validateCorrections(corrections: EntityCorrections): boolean {
    return EntityCorrectionsProcessor.validateCorrections(corrections);
  }
} 