/**
 * Entity Merge Context Value Object
 * 
 * Encapsulates the context needed for entity merging operations
 * following DDD principles for the chatbot domain.
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export interface EntityMergeContextProps {
  messageId: string;
  defaultConfidence: number;
  enableDeduplication: boolean;
  confidenceThreshold: number;
}

export class EntityMergeContext {
  private constructor(private readonly props: EntityMergeContextProps) {
    this.validateInvariants();
  }

  static create(props: EntityMergeContextProps): EntityMergeContext {
    return new EntityMergeContext(props);
  }

  get messageId(): string {
    return this.props.messageId;
  }

  get defaultConfidence(): number {
    return this.props.defaultConfidence;
  }

  get enableDeduplication(): boolean {
    return this.props.enableDeduplication;
  }

  get confidenceThreshold(): number {
    return this.props.confidenceThreshold;
  }

  private validateInvariants(): void {
    if (!this.props.messageId || this.props.messageId.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Message ID is required for entity accumulation',
        { context: this.props }
      );
    }
    
    if (this.props.defaultConfidence < 0 || this.props.defaultConfidence > 1) {
      throw new BusinessRuleViolationError(
        'Default confidence must be between 0 and 1',
        { confidence: this.props.defaultConfidence, context: this.props }
      );
    }

    if (this.props.confidenceThreshold < 0 || this.props.confidenceThreshold > 1) {
      throw new BusinessRuleViolationError(
        'Confidence threshold must be between 0 and 1',
        { threshold: this.props.confidenceThreshold, context: this.props }
      );
    }
  }

  withMessageId(messageId: string): EntityMergeContext {
    return EntityMergeContext.create({
      ...this.props,
      messageId
    });
  }

  withConfidence(defaultConfidence: number): EntityMergeContext {
    return EntityMergeContext.create({
      ...this.props,
      defaultConfidence
    });
  }

  withDeduplication(enableDeduplication: boolean): EntityMergeContext {
    return EntityMergeContext.create({
      ...this.props,
      enableDeduplication
    });
  }

  withThreshold(confidenceThreshold: number): EntityMergeContext {
    return EntityMergeContext.create({
      ...this.props,
      confidenceThreshold
    });
  }
}