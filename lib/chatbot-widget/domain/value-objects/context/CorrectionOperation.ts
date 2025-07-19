/**
 * Correction Operation Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing entity correction operations
 * - Support typed corrections with previous value tracking
 * - Follow @golden-rule patterns exactly
 * - Keep focused on correction operation concerns only
 * - Use domain-specific validation
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { CorrectionMetadata, CorrectionMetadataProps } from './CorrectionMetadata';

export type UrgencyLevel = 'low' | 'medium' | 'high';
export type ContactMethod = 'email' | 'phone' | 'meeting';

export interface CorrectionOperationProps<T = string> {
  newValue: T;
  previousValue?: T;
  metadata: CorrectionMetadataProps;
}

export class CorrectionOperation<T = string> {
  private readonly _metadata: CorrectionMetadata;
  
  private constructor(
    private readonly newValue: T,
    private readonly previousValue: T | undefined,
    metadata: CorrectionMetadata
  ) {
    this._metadata = metadata;
    this.validateInvariants();
  }
  
  static create<T>(
    newValue: T,
    sourceMessageId: string,
    previousValue?: T,
    confidence: number = 0.9,
    correctionReason?: string
  ): CorrectionOperation<T> {
    const metadata = CorrectionMetadata.create(sourceMessageId, confidence, correctionReason);
    return new CorrectionOperation(newValue, previousValue, metadata);
  }
  
  static fromProps<T>(props: CorrectionOperationProps<T>): CorrectionOperation<T> {
    const metadata = CorrectionMetadata.fromProps(props.metadata);
    return new CorrectionOperation(props.newValue, props.previousValue, metadata);
  }
  
  // Getters for immutable access
  get value(): T { return this.newValue; }
  get previous(): T | undefined { return this.previousValue; }
  get metadata(): CorrectionMetadata { return this._metadata; }
  
  // Business methods
  isHighConfidenceCorrection(): boolean {
    return this._metadata.isHighConfidence();
  }
  
  hasCorrectionReason(): boolean {
    return this._metadata.hasReason();
  }
  
  hasPreviousValue(): boolean {
    return this.previousValue !== undefined;
  }
  
  isValueChange(): boolean {
    return this.hasPreviousValue() && this.previousValue !== this.newValue;
  }
  
  // Serialization
  toPlainObject(): CorrectionOperationProps<T> {
    return {
      newValue: this.newValue,
      previousValue: this.previousValue,
      metadata: this._metadata.toPlainObject()
    };
  }
  
  private validateInvariants(): void {
    if (this.newValue === null || this.newValue === undefined) {
      throw new BusinessRuleViolationError(
        'Correction operation must have a valid new value',
        { newValue: this.newValue }
      );
    }
    
    if (typeof this.newValue === 'string' && this.newValue.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'String correction value cannot be empty',
        { newValue: this.newValue }
      );
    }
  }
}