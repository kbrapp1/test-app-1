/**
 * Removal Operation Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing entity removal operations
 * - Encapsulates entity value and correction metadata
 * - Follow @golden-rule patterns exactly
 * - Keep focused on removal operation concerns only
 * - Use domain-specific validation
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { CorrectionMetadata, CorrectionMetadataProps } from './CorrectionMetadata';

export interface RemovalOperationProps {
  entityValue: string;
  metadata: CorrectionMetadataProps;
}

export class RemovalOperation {
  private readonly _metadata: CorrectionMetadata;
  
  private constructor(
    private readonly entityValue: string,
    metadata: CorrectionMetadata
  ) {
    this._metadata = metadata;
    this.validateInvariants();
  }
  
  static create(
    entityValue: string,
    sourceMessageId: string,
    confidence: number = 0.9,
    correctionReason?: string
  ): RemovalOperation {
    const metadata = CorrectionMetadata.create(sourceMessageId, confidence, correctionReason);
    return new RemovalOperation(entityValue.trim(), metadata);
  }
  
  static fromProps(props: RemovalOperationProps): RemovalOperation {
    const metadata = CorrectionMetadata.fromProps(props.metadata);
    return new RemovalOperation(props.entityValue, metadata);
  }
  
  // Getters for immutable access
  get value(): string { return this.entityValue; }
  get metadata(): CorrectionMetadata { return this._metadata; }
  
  // Business methods
  isHighConfidenceRemoval(): boolean {
    return this._metadata.isHighConfidence();
  }
  
  hasRemovalReason(): boolean {
    return this._metadata.hasReason();
  }
  
  matches(entityValue: string): boolean {
    return this.entityValue.toLowerCase().trim() === entityValue.toLowerCase().trim();
  }
  
  // Serialization
  toPlainObject(): RemovalOperationProps {
    return {
      entityValue: this.entityValue,
      metadata: this._metadata.toPlainObject()
    };
  }
  
  private validateInvariants(): void {
    if (!this.entityValue || this.entityValue.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Removal operation must have a valid entity value',
        { entityValue: this.entityValue }
      );
    }
  }
}