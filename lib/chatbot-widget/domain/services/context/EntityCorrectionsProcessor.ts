/**
 * Entity Corrections Processor Service
 * 
 * Domain service responsible for processing entity corrections
 * following DDD principles for the chatbot domain.
 */

import { AccumulatedEntities } from '../../value-objects/context/AccumulatedEntities';
import { EntityCorrections } from '../../value-objects/context/EntityCorrections';
import { EntityMergeContext } from '../../value-objects/context/EntityMergeContext';

export interface CorrectionProcessingResult {
  updatedEntities: AccumulatedEntities;
  correctionsApplied: number;
  entitiesRemoved: number;
}

export class EntityCorrectionsProcessor {
  
  static processCorrections(
    accumulated: AccumulatedEntities,
    corrections: EntityCorrections,
    _context: EntityMergeContext
  ): CorrectionProcessingResult {
    const result = accumulated;
    let correctionsApplied = 0;
    let entitiesRemoved = 0;
    
    if (corrections.isEmpty()) {
      return { updatedEntities: result, correctionsApplied: 0, entitiesRemoved: 0 };
    }

    // Process removals for array entities
    entitiesRemoved += this.processEntityRemovals(corrections);
    
    // Process single entity corrections
    correctionsApplied += this.processSingleEntityCorrections(corrections);
    
    // Note: The actual entity modification logic would be implemented
    // in AccumulatedEntities class methods. For now, we track metrics
    // but don't modify the entities directly.
    
    return { 
      updatedEntities: result, 
      correctionsApplied, 
      entitiesRemoved 
    };
  }

  private static processEntityRemovals(corrections: EntityCorrections): number {
    let removalsCount = 0;
    
    removalsCount += corrections.removedDecisionMakers.length;
    removalsCount += corrections.removedPainPoints.length;
    removalsCount += corrections.removedIntegrationNeeds.length;
    removalsCount += corrections.removedEvaluationCriteria.length;
    
    return removalsCount;
  }

  private static processSingleEntityCorrections(corrections: EntityCorrections): number {
    let correctionsCount = 0;
    
    if (corrections.correctedBudget) correctionsCount++;
    if (corrections.correctedTimeline) correctionsCount++;
    if (corrections.correctedUrgency) correctionsCount++;
    if (corrections.correctedContactMethod) correctionsCount++;
    if (corrections.correctedRole) correctionsCount++;
    if (corrections.correctedIndustry) correctionsCount++;
    if (corrections.correctedCompany) correctionsCount++;
    if (corrections.correctedTeamSize) correctionsCount++;
    
    return correctionsCount;
  }

  static validateCorrections(corrections: EntityCorrections): boolean {
    if (!corrections) {
      return false;
    }

    // Validate that correction operations have valid metadata
    const allCorrections = [
      corrections.correctedBudget,
      corrections.correctedTimeline,
      corrections.correctedUrgency,
      corrections.correctedContactMethod,
      corrections.correctedRole,
      corrections.correctedIndustry,
      corrections.correctedCompany,
      corrections.correctedTeamSize
    ].filter(Boolean);

    return allCorrections.every(correction => {
      return correction && 
             correction.metadata && 
             correction.metadata.sourceMessageId &&
             correction.metadata.confidence >= 0 && 
             correction.metadata.confidence <= 1;
    });
  }

  static calculateCorrectionsImpact(corrections: EntityCorrections): {
    totalOperations: number;
    removalOperations: number;
    updateOperations: number;
  } {
    const removalOperations = this.processEntityRemovals(corrections);
    const updateOperations = this.processSingleEntityCorrections(corrections);
    
    return {
      totalOperations: removalOperations + updateOperations,
      removalOperations,
      updateOperations
    };
  }
}