/**
 * Entity Accumulation Strategies Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle entity accumulation strategies and logic
 * - Domain service focused on entity accumulation patterns
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Support three accumulation strategies: additive, replaceable, confidence-based
 * - Handle deduplication and normalization for entity values
 * - Provide validation and error handling for entity operations
 */

import {
  EntityWithMetadata,
  AccumulatedEntitiesProps,
  AdditiveEntityType,
  ReplaceableEntityType,
  ConfidenceBasedEntityType,
  EntityOperationContext,
  EntityNormalizationConfig
} from '../types/AccumulatedEntityTypes';

// Specialized Service for Entity Accumulation Strategies
export class EntityAccumulationStrategies {
  
  private static readonly DEFAULT_NORMALIZATION_CONFIG: EntityNormalizationConfig = {
    removeSpecialCharacters: true,
    toLowerCase: true,
    trimWhitespace: true
  };

  // Strategy 1: Additive entities - accumulate unique values over time
  static applyAdditiveStrategy(
    existingEntities: EntityWithMetadata<string>[],
    newValues: string[],
    context: EntityOperationContext
  ): EntityWithMetadata<string>[] {
    const newEntities = newValues.map(value => ({
      value,
      extractedAt: context.extractedAt,
      confidence: context.confidence,
      sourceMessageId: context.messageId
    }));
    
    const mergedEntities = [...existingEntities, ...newEntities];
    return this.deduplicateEntityArray(mergedEntities);
  }

  // Strategy 2: Replaceable entities - keep latest value
  static applyReplaceableStrategy<T>(
    value: T,
    context: EntityOperationContext
  ): EntityWithMetadata<T> {
    return {
      value,
      extractedAt: context.extractedAt,
      confidence: context.confidence,
      sourceMessageId: context.messageId
    };
  }

  // Strategy 3: Confidence-based entities - keep highest confidence value
  static applyConfidenceBasedStrategy<T>(
    existingEntity: EntityWithMetadata<T> | null,
    newValue: T,
    context: EntityOperationContext,
    confidenceThreshold: number = 0.7
  ): EntityWithMetadata<T> {
    const newEntity: EntityWithMetadata<T> = {
      value: newValue,
      extractedAt: context.extractedAt,
      confidence: context.confidence,
      sourceMessageId: context.messageId
    };
    
    // If no existing entity, use new entity
    if (!existingEntity) {
      return newEntity;
    }
    
    // Keep existing if it has higher confidence and exceeds threshold
    if (existingEntity.confidence > context.confidence && 
        existingEntity.confidence > confidenceThreshold) {
      return existingEntity;
    }
    
    // Use new entity if it has higher confidence or existing doesn't meet threshold
    return newEntity;
  }

  // Remove specific values from additive entity arrays
  static removeFromAdditiveArray(
    existingEntities: EntityWithMetadata<string>[],
    valueToRemove: string
  ): EntityWithMetadata<string>[] {
    const normalizedRemoval = this.normalizeEntityValue(valueToRemove);
    
    return existingEntities.filter(entity => {
      const normalizedExisting = this.normalizeEntityValue(entity.value);
      return normalizedExisting !== normalizedRemoval;
    });
  }

  // Correct/replace any entity with new value
  static applyCorrection<T>(
    value: T,
    context: EntityOperationContext
  ): EntityWithMetadata<T> {
    return {
      value,
      extractedAt: context.extractedAt,
      confidence: context.confidence,
      sourceMessageId: context.messageId
    };
  }

  // Deduplicate array entities by normalized value
  static deduplicateEntityArray(
    entities: EntityWithMetadata<string>[]
  ): EntityWithMetadata<string>[] {
    const seen = new Set<string>();
    
    return entities.filter(entity => {
      const normalized = this.normalizeEntityValue(entity.value);
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  // Normalize entity values for comparison
  static normalizeEntityValue(
    value: string,
    config: EntityNormalizationConfig = EntityAccumulationStrategies.DEFAULT_NORMALIZATION_CONFIG
  ): string {
    let normalized = value;
    
    if (config.trimWhitespace) {
      normalized = normalized.trim();
    }
    
    if (config.toLowerCase) {
      normalized = normalized.toLowerCase();
    }
    
    if (config.removeSpecialCharacters) {
      normalized = normalized.replace(/[^a-z0-9]/g, '');
    }
    
    return normalized;
  }

  // Validate entity confidence scores
  static validateEntityConfidence(entities: EntityWithMetadata<any>[]): boolean {
    return entities.every(entity => 
      entity.confidence >= 0 && 
      entity.confidence <= 1 &&
      !isNaN(entity.confidence)
    );
  }

  // Get strategy type for entity type
  static getStrategyForEntityType(
    entityType: AdditiveEntityType | ReplaceableEntityType | ConfidenceBasedEntityType
  ): 'additive' | 'replaceable' | 'confidence-based' {
    const additiveTypes: AdditiveEntityType[] = ['goals', 'decisionMakers', 'painPoints', 'integrationNeeds', 'evaluationCriteria'];
    const replaceableTypes: ReplaceableEntityType[] = ['budget', 'timeline', 'urgency', 'contactMethod'];
    const confidenceBasedTypes: ConfidenceBasedEntityType[] = ['visitorName', 'role', 'industry', 'company', 'teamSize'];
    
    if (additiveTypes.includes(entityType as AdditiveEntityType)) {
      return 'additive';
    }
    
    if (replaceableTypes.includes(entityType as ReplaceableEntityType)) {
      return 'replaceable';
    }
    
    if (confidenceBasedTypes.includes(entityType as ConfidenceBasedEntityType)) {
      return 'confidence-based';
    }
    
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  // Calculate entity quality score
  static calculateEntityQuality(
    entity: EntityWithMetadata<any>,
    currentTime: Date = new Date()
  ): number {
    const ageInDays = (currentTime.getTime() - entity.extractedAt.getTime()) / (1000 * 60 * 60 * 24);
    const ageFactor = Math.max(0, 1 - (ageInDays / 30)); // Decay over 30 days
    
    // Combine confidence (70%) and recency (30%)
    return (entity.confidence * 0.7) + (ageFactor * 0.3);
  }
} 