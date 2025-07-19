/**
 * Entity Merge Result Value Object
 * 
 * Encapsulates the result of an entity merge operation
 * following DDD principles for the chatbot domain.
 */

import { AccumulatedEntities } from './AccumulatedEntities';
import { EntityCorrections } from './EntityCorrections';

export interface EntityMergeMetadata {
  totalEntitiesProcessed: number;
  correctionsApplied: number;
  newEntitiesAdded: number;
  entitiesRemoved: number;
  processingTimestamp: Date;
}

export interface EntityMergeResultProps {
  accumulatedEntities: AccumulatedEntities;
  processedCorrections: EntityCorrections | null;
  mergeMetadata: EntityMergeMetadata;
}

export class EntityMergeResult {
  private constructor(private readonly props: EntityMergeResultProps) {}

  static create(props: EntityMergeResultProps): EntityMergeResult {
    return new EntityMergeResult(props);
  }

  static createEmpty(entities: AccumulatedEntities): EntityMergeResult {
    return new EntityMergeResult({
      accumulatedEntities: entities,
      processedCorrections: null,
      mergeMetadata: {
        totalEntitiesProcessed: 0,
        correctionsApplied: 0,
        newEntitiesAdded: 0,
        entitiesRemoved: 0,
        processingTimestamp: new Date()
      }
    });
  }

  get accumulatedEntities(): AccumulatedEntities {
    return this.props.accumulatedEntities;
  }

  get processedCorrections(): EntityCorrections | null {
    return this.props.processedCorrections;
  }

  get mergeMetadata(): EntityMergeMetadata {
    return { ...this.props.mergeMetadata };
  }

  get hasCorrections(): boolean {
    return this.props.processedCorrections !== null;
  }

  get totalProcessed(): number {
    return this.props.mergeMetadata.totalEntitiesProcessed;
  }

  get correctionsApplied(): number {
    return this.props.mergeMetadata.correctionsApplied;
  }

  get entitiesAdded(): number {
    return this.props.mergeMetadata.newEntitiesAdded;
  }

  get entitiesRemoved(): number {
    return this.props.mergeMetadata.entitiesRemoved;
  }

  get processingTimestamp(): Date {
    return this.props.mergeMetadata.processingTimestamp;
  }

  withEntities(entities: AccumulatedEntities): EntityMergeResult {
    return EntityMergeResult.create({
      ...this.props,
      accumulatedEntities: entities
    });
  }

  withCorrections(corrections: EntityCorrections): EntityMergeResult {
    return EntityMergeResult.create({
      ...this.props,
      processedCorrections: corrections
    });
  }

  withMetadata(metadata: Partial<EntityMergeMetadata>): EntityMergeResult {
    return EntityMergeResult.create({
      ...this.props,
      mergeMetadata: {
        ...this.props.mergeMetadata,
        ...metadata
      }
    });
  }

  incrementProcessed(count: number = 1): EntityMergeResult {
    return this.withMetadata({
      totalEntitiesProcessed: this.props.mergeMetadata.totalEntitiesProcessed + count
    });
  }

  incrementAdded(count: number = 1): EntityMergeResult {
    return this.withMetadata({
      newEntitiesAdded: this.props.mergeMetadata.newEntitiesAdded + count
    });
  }

  incrementRemoved(count: number = 1): EntityMergeResult {
    return this.withMetadata({
      entitiesRemoved: this.props.mergeMetadata.entitiesRemoved + count
    });
  }

  incrementCorrections(count: number = 1): EntityMergeResult {
    return this.withMetadata({
      correctionsApplied: this.props.mergeMetadata.correctionsApplied + count
    });
  }
}