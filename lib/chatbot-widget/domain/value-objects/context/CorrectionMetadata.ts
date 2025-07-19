/**
 * Correction Metadata Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object for correction audit trail
 * - Encapsulates timestamp, source, confidence, and reason
 * - Follow @golden-rule patterns exactly
 * - Keep focused on metadata concerns only
 * - Use domain-specific validation
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export interface CorrectionMetadataProps {
  timestamp: Date;
  sourceMessageId: string;
  confidence: number;
  correctionReason?: string;
}

export class CorrectionMetadata {
  private constructor(private readonly props: CorrectionMetadataProps) {
    this.validateInvariants();
  }
  
  static create(
    sourceMessageId: string,
    confidence: number = 0.9,
    correctionReason?: string
  ): CorrectionMetadata {
    return new CorrectionMetadata({
      timestamp: new Date(),
      sourceMessageId,
      confidence,
      correctionReason
    });
  }
  
  static fromProps(props: CorrectionMetadataProps): CorrectionMetadata {
    return new CorrectionMetadata(props);
  }
  
  // Getters for immutable access
  get timestamp(): Date { return this.props.timestamp; }
  get sourceMessageId(): string { return this.props.sourceMessageId; }
  get confidence(): number { return this.props.confidence; }
  get correctionReason(): string | undefined { return this.props.correctionReason; }
  
  // Business methods
  isHighConfidence(): boolean {
    return this.props.confidence >= 0.8;
  }
  
  hasReason(): boolean {
    return !!this.props.correctionReason;
  }
  
  // Serialization
  toPlainObject(): CorrectionMetadataProps {
    return { ...this.props };
  }
  
  private validateInvariants(): void {
    if (!this.props.sourceMessageId || this.props.sourceMessageId.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Correction metadata must have a valid source message ID',
        { sourceMessageId: this.props.sourceMessageId }
      );
    }
    
    if (this.props.confidence < 0 || this.props.confidence > 1) {
      throw new BusinessRuleViolationError(
        'Confidence must be between 0 and 1',
        { confidence: this.props.confidence }
      );
    }
  }
}