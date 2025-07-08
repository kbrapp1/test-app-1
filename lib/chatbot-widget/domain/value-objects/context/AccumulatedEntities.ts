/**
 * Accumulated Entities Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object for accumulated conversation entities
 * - Delegates complex operations to specialized domain services
 * - Maintains state management and provides clean API
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines with focused responsibility
 * - Pure domain logic with no external dependencies
 */

import {
  EntityWithMetadata,
  AccumulatedEntitiesProps,
  AdditiveEntityType,
  ReplaceableEntityType,
  ConfidenceBasedEntityType,
  EntityOperationContext,
  EntityCounts,
  EntitySummary
} from '../../types/AccumulatedEntityTypes';
import { EntityAccumulationStrategies } from '../../services/EntityAccumulationStrategies';
import { EntitySerializationService } from '../../services/EntitySerializationService';
import { EntityUtilityService } from '../../services/EntityUtilityService';

// Re-export types for backward compatibility with tests
export type { EntityWithMetadata } from '../../types/AccumulatedEntityTypes';

export class AccumulatedEntities {
  private constructor(private readonly props: AccumulatedEntitiesProps) {
    this.validateInvariants();
  }

  static create(props?: Partial<AccumulatedEntitiesProps>): AccumulatedEntities {
    const defaultProps = EntitySerializationService.createDefaultProps();
    return new AccumulatedEntities({
      ...defaultProps,
      ...props
    });
  }

  /**
   * Create AccumulatedEntities from stored object (deserialization)
   * AI INSTRUCTIONS:
   * - Delegate deserialization to specialized service
   * - Handle deserialization from SessionContext storage
   * - Provide error recovery for malformed data
   * - Follow @golden-rule error handling patterns
   */
  static fromObject(storedData: any): AccumulatedEntities {
    const props = EntitySerializationService.deserializeAccumulatedEntities(storedData);
    return new AccumulatedEntities(props);
  }

  // Getters for immutable access
  get decisionMakers(): EntityWithMetadata<string>[] { return [...this.props.decisionMakers]; }
  get painPoints(): EntityWithMetadata<string>[] { return [...this.props.painPoints]; }
  get integrationNeeds(): EntityWithMetadata<string>[] { return [...this.props.integrationNeeds]; }
  get evaluationCriteria(): EntityWithMetadata<string>[] { return [...this.props.evaluationCriteria]; }
  get budget(): EntityWithMetadata<string> | null { return this.props.budget; }
  get timeline(): EntityWithMetadata<string> | null { return this.props.timeline; }
  get urgency(): EntityWithMetadata<'low'|'medium'|'high'> | null { return this.props.urgency; }
  get contactMethod(): EntityWithMetadata<'email'|'phone'|'meeting'> | null { return this.props.contactMethod; }
  get visitorName(): EntityWithMetadata<string> | null { return this.props.visitorName; }
  get role(): EntityWithMetadata<string> | null { return this.props.role; }
  get industry(): EntityWithMetadata<string> | null { return this.props.industry; }
  get company(): EntityWithMetadata<string> | null { return this.props.company; }
  get teamSize(): EntityWithMetadata<string> | null { return this.props.teamSize; }
  get lastUpdated(): Date { return this.props.lastUpdated; }
  get totalExtractions(): number { return this.props.totalExtractions; }

  /** Strategy 1: Additive entities - accumulate unique values over time */
  withAdditiveEntity(
    entityType: AdditiveEntityType,
    newValues: string[],
    messageId: string,
    confidence: number = 0.9
  ): AccumulatedEntities {
    const context: EntityOperationContext = {
      messageId,
      confidence,
      extractedAt: new Date()
    };
    
    const existingEntities = this.props[entityType];
    const updatedEntities = EntityAccumulationStrategies.applyAdditiveStrategy(
      existingEntities,
      newValues,
      context
    );
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: updatedEntities,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + newValues.length
    });
  }

  /** Strategy 2: Replaceable entities - keep latest value */
  withReplaceableEntity(
    entityType: ReplaceableEntityType,
    value: string,
    messageId: string,
    confidence: number = 0.9
  ): AccumulatedEntities {
    const context: EntityOperationContext = {
      messageId,
      confidence,
      extractedAt: new Date()
    };
    
    const updatedEntity = EntityAccumulationStrategies.applyReplaceableStrategy(
      value,
      context
    );
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: updatedEntity,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }

  /** Strategy 3: Confidence-based entities - keep highest confidence value */
  withConfidenceBasedEntity(
    entityType: ConfidenceBasedEntityType,
    value: string,
    messageId: string,
    confidence: number = 0.9,
    confidenceThreshold: number = 0.7
  ): AccumulatedEntities {
    const context: EntityOperationContext = {
      messageId,
      confidence,
      extractedAt: new Date()
    };
    
    const existingEntity = this.props[entityType];
    const updatedEntity = EntityAccumulationStrategies.applyConfidenceBasedStrategy(
      existingEntity,
      value,
      context,
      confidenceThreshold
    );
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: updatedEntity,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }

  /** Remove specific values from additive arrays */
  withRemovedEntity(
    entityType: AdditiveEntityType,
    valueToRemove: string,
    messageId: string
  ): AccumulatedEntities {
    const existingEntities = this.props[entityType];
    const updatedEntities = EntityAccumulationStrategies.removeFromAdditiveArray(
      existingEntities,
      valueToRemove
    );
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: updatedEntities,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }

  /** Correct/replace any entity type */
  withCorrectedEntity(
    entityType: ReplaceableEntityType | ConfidenceBasedEntityType,
    value: string,
    messageId: string,
    confidence: number = 0.9
  ): AccumulatedEntities {
    const context: EntityOperationContext = {
      messageId,
      confidence,
      extractedAt: new Date()
    };
    
    const correctedEntity = EntityAccumulationStrategies.applyCorrection(
      value,
      context
    );
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: correctedEntity,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }

  /** Get all entities as a summary object */
  getAllEntitiesSummary(): EntitySummary {
    return EntityUtilityService.generateEntitySummary(this.props);
  }

  /** Check if accumulated entities are empty */
  isEmpty(): boolean {
    return EntityUtilityService.isEntityCollectionEmpty(this.props);
  }

  /** Get entity count by category */
  getEntityCountByCategory(): EntityCounts {
    return EntityUtilityService.countEntitiesByCategory(this.props);
  }

  /**
   * Convert to plain object for serialization
   * AI INSTRUCTIONS:
   * - Delegate serialization to specialized service
   * - Serialize for storage in SessionContext
   * - Maintain all metadata for proper round-trip deserialization
   * - Follow @golden-rule immutability patterns
   */
  toPlainObject(): any {
    return EntitySerializationService.serializeAccumulatedEntities(this.props);
  }

  /** Validate domain invariants */
  private validateInvariants(): void {
    const validation = EntityUtilityService.validateEntityCollection(this.props);
    if (!validation.isValid) {
      throw new Error(`Entity validation failed: ${validation.errors.join(', ')}`);
    }
  }
} 