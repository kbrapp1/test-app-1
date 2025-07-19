/**
 * Message Context Metadata Value Object
 * 
 * AI INSTRUCTIONS:
 * - Core immutable value object for conversation context metadata
 * - Orchestrates domain services for validation, updates, and queries
 * - Preserves value object immutability and domain layer compliance
 * - Handles conversation context, sentiment analysis, urgency tracking, and lead qualification
 */

import { MessageContextMetadataFactory } from '../../services/message-processing/MessageContextMetadataFactory';
import { MessageContextValidationService } from '../../services/message-processing/MessageContextValidationService';
import { MessageContextUpdateService } from '../../services/message-processing/MessageContextUpdateService';
import { MessageContextQueryService } from '../../services/message-processing/MessageContextQueryService';

export interface MessageContextMetadataProps {
  // Lead qualification metadata
  qualificationStep?: number;
  questionId?: string;
  expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect';
  
  // Context metadata
  topicsDiscussed: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency?: 'low' | 'medium' | 'high';
  engagement?: 'low' | 'medium' | 'high';
  
  // User interaction metadata
  inputMethod?: 'text' | 'voice' | 'button';
  
  // System metadata
  errorType?: string;
  errorCode?: string;
  errorMessage?: string;
  
  // Audit metadata
  createdBy?: string;
  updatedAt?: Date;
  version?: number;
}

export class MessageContextMetadata {
  private constructor(private readonly props: MessageContextMetadataProps) {
    MessageContextValidationService.validateProps(props);
  }

  static create(props: MessageContextMetadataProps): MessageContextMetadata {
    const validatedProps = MessageContextMetadataFactory.create(props);
    return new MessageContextMetadata(validatedProps);
  }

  static createEmpty(): MessageContextMetadata {
    const props = MessageContextMetadataFactory.createEmpty();
    return new MessageContextMetadata(props);
  }

  static createForUser(inputMethod: 'text' | 'voice' | 'button' = 'text'): MessageContextMetadata {
    const props = MessageContextMetadataFactory.createForUser(inputMethod);
    return new MessageContextMetadata(props);
  }

  static createForLeadCapture(
    qualificationStep: number,
    questionId?: string,
    expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect'
  ): MessageContextMetadata {
    const props = MessageContextMetadataFactory.createForLeadCapture(
      qualificationStep,
      questionId,
      expectedAnswerType
    );
    return new MessageContextMetadata(props);
  }

  static createForError(errorType: string, errorCode?: string, errorMessage?: string): MessageContextMetadata {
    const props = MessageContextMetadataFactory.createForError(errorType, errorCode, errorMessage);
    return new MessageContextMetadata(props);
  }

  // Getters for immutable property access
  get qualificationStep(): number | undefined { return this.props.qualificationStep; }
  get questionId(): string | undefined { return this.props.questionId; }
  get expectedAnswerType(): 'text' | 'email' | 'phone' | 'select' | 'multiselect' | undefined { return this.props.expectedAnswerType; }
  get topicsDiscussed(): string[] { return [...this.props.topicsDiscussed]; }
  get sentiment(): 'positive' | 'neutral' | 'negative' | undefined { return this.props.sentiment; }
  get urgency(): 'low' | 'medium' | 'high' | undefined { return this.props.urgency; }
  get engagement(): 'low' | 'medium' | 'high' | undefined { return this.props.engagement; }
  get inputMethod(): 'text' | 'voice' | 'button' | undefined { return this.props.inputMethod; }
  get errorType(): string | undefined { return this.props.errorType; }
  get errorCode(): string | undefined { return this.props.errorCode; }
  get errorMessage(): string | undefined { return this.props.errorMessage; }
  get createdBy(): string | undefined { return this.props.createdBy; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
  get version(): number | undefined { return this.props.version; }

  // Immutable update business methods (delegated to update service)
  addTopicDiscussed(topic: string): MessageContextMetadata {
    const updatedProps = MessageContextUpdateService.addTopicDiscussed(this.props, topic);
    return updatedProps === this.props ? this : new MessageContextMetadata(updatedProps);
  }

  updateSentiment(sentiment: 'positive' | 'neutral' | 'negative'): MessageContextMetadata {
    const updatedProps = MessageContextUpdateService.updateSentiment(this.props, sentiment);
    return new MessageContextMetadata(updatedProps);
  }

  updateUrgency(urgency: 'low' | 'medium' | 'high'): MessageContextMetadata {
    const updatedProps = MessageContextUpdateService.updateUrgency(this.props, urgency);
    return new MessageContextMetadata(updatedProps);
  }

  updateEngagement(engagement: 'low' | 'medium' | 'high'): MessageContextMetadata {
    const updatedProps = MessageContextUpdateService.updateEngagement(this.props, engagement);
    return new MessageContextMetadata(updatedProps);
  }

  setQualificationData(
    qualificationStep: number,
    questionId?: string,
    expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect'
  ): MessageContextMetadata {
    const updatedProps = MessageContextUpdateService.setQualificationData(
      this.props,
      qualificationStep,
      questionId,
      expectedAnswerType
    );
    return new MessageContextMetadata(updatedProps);
  }

  setErrorData(errorType: string, errorCode?: string, errorMessage?: string): MessageContextMetadata {
    const updatedProps = MessageContextUpdateService.setErrorData(this.props, errorType, errorCode, errorMessage);
    return new MessageContextMetadata(updatedProps);
  }

  clearError(): MessageContextMetadata {
    const updatedProps = MessageContextUpdateService.clearError(this.props);
    return new MessageContextMetadata(updatedProps);
  }

  incrementVersion(): MessageContextMetadata {
    const updatedProps = MessageContextUpdateService.incrementVersion(this.props);
    return new MessageContextMetadata(updatedProps);
  }

  // Query methods (delegated to query service)
  hasTopics(): boolean {
    return MessageContextQueryService.hasTopics(this.props);
  }

  hasTopic(topic: string): boolean {
    return MessageContextQueryService.hasTopic(this.props, topic);
  }

  hasError(): boolean {
    return MessageContextQueryService.hasError(this.props);
  }

  hasErrorDetails(): boolean {
    return MessageContextQueryService.hasErrorDetails(this.props);
  }

  isLeadQualification(): boolean {
    return MessageContextQueryService.isLeadQualification(this.props);
  }

  hasPositiveSentiment(): boolean {
    return MessageContextQueryService.hasPositiveSentiment(this.props);
  }

  hasNegativeSentiment(): boolean {
    return MessageContextQueryService.hasNegativeSentiment(this.props);
  }

  isHighUrgency(): boolean {
    return MessageContextQueryService.isHighUrgency(this.props);
  }

  isLowUrgency(): boolean {
    return MessageContextQueryService.isLowUrgency(this.props);
  }

  isHighEngagement(): boolean {
    return MessageContextQueryService.isHighEngagement(this.props);
  }

  isLowEngagement(): boolean {
    return MessageContextQueryService.isLowEngagement(this.props);
  }

  isVoiceInput(): boolean {
    return MessageContextQueryService.isVoiceInput(this.props);
  }

  isButtonInput(): boolean {
    return MessageContextQueryService.isButtonInput(this.props);
  }

  requiresEmailAnswer(): boolean {
    return MessageContextQueryService.requiresEmailAnswer(this.props);
  }

  requiresPhoneAnswer(): boolean {
    return MessageContextQueryService.requiresPhoneAnswer(this.props);
  }

  getTopicCount(): number {
    return MessageContextQueryService.getTopicCount(this.props);
  }

  getErrorSummary(): string | null {
    return MessageContextQueryService.getErrorSummary(this.props);
  }

  getContextSummary(): string {
    return MessageContextQueryService.getContextSummary(this.props);
  }

  equals(other: MessageContextMetadata): boolean {
    return MessageContextQueryService.equals(this.props, other.props);
  }

  toPlainObject(): MessageContextMetadataProps {
    return { ...this.props };
  }
} 