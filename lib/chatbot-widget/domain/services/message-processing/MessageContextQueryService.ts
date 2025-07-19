/**
 * Message Context Query Service
 * 
 * AI INSTRUCTIONS:
 * - Handles query operations for MessageContextMetadata value objects
 * - Pure query functions without side effects
 * - Focused on business logic queries and state inspection
 * - Follows domain layer patterns with business rule evaluation
 */

import { MessageContextMetadataProps } from '../../value-objects/message-processing/MessageContextMetadata';

export class MessageContextQueryService {
  // Topic-related queries
  static hasTopics(props: MessageContextMetadataProps): boolean {
    return props.topicsDiscussed.length > 0;
  }

  static hasTopic(props: MessageContextMetadataProps, topic: string): boolean {
    return props.topicsDiscussed.includes(topic.trim());
  }

  static getTopicCount(props: MessageContextMetadataProps): number {
    return props.topicsDiscussed.length;
  }

  // Error-related queries
  static hasError(props: MessageContextMetadataProps): boolean {
    return !!props.errorType;
  }

  static hasErrorDetails(props: MessageContextMetadataProps): boolean {
    return !!(props.errorType || props.errorCode || props.errorMessage);
  }

  static getErrorSummary(props: MessageContextMetadataProps): string | null {
    if (!this.hasError(props)) return null;
    
    const parts = [props.errorType];
    if (props.errorCode) parts.push(`(${props.errorCode})`);
    if (props.errorMessage) parts.push(`: ${props.errorMessage}`);
    
    return parts.join('');
  }

  // Lead qualification queries
  static isLeadQualification(props: MessageContextMetadataProps): boolean {
    return props.qualificationStep !== undefined;
  }

  static requiresEmailAnswer(props: MessageContextMetadataProps): boolean {
    return props.expectedAnswerType === 'email';
  }

  static requiresPhoneAnswer(props: MessageContextMetadataProps): boolean {
    return props.expectedAnswerType === 'phone';
  }

  // Sentiment queries
  static hasPositiveSentiment(props: MessageContextMetadataProps): boolean {
    return props.sentiment === 'positive';
  }

  static hasNegativeSentiment(props: MessageContextMetadataProps): boolean {
    return props.sentiment === 'negative';
  }

  static hasNeutralSentiment(props: MessageContextMetadataProps): boolean {
    return props.sentiment === 'neutral';
  }

  // Urgency queries
  static isHighUrgency(props: MessageContextMetadataProps): boolean {
    return props.urgency === 'high';
  }

  static isLowUrgency(props: MessageContextMetadataProps): boolean {
    return props.urgency === 'low';
  }

  static isMediumUrgency(props: MessageContextMetadataProps): boolean {
    return props.urgency === 'medium';
  }

  // Engagement queries
  static isHighEngagement(props: MessageContextMetadataProps): boolean {
    return props.engagement === 'high';
  }

  static isLowEngagement(props: MessageContextMetadataProps): boolean {
    return props.engagement === 'low';
  }

  static isMediumEngagement(props: MessageContextMetadataProps): boolean {
    return props.engagement === 'medium';
  }

  // Input method queries
  static isVoiceInput(props: MessageContextMetadataProps): boolean {
    return props.inputMethod === 'voice';
  }

  static isButtonInput(props: MessageContextMetadataProps): boolean {
    return props.inputMethod === 'button';
  }

  static isTextInput(props: MessageContextMetadataProps): boolean {
    return props.inputMethod === 'text' || props.inputMethod === undefined;
  }

  // Summary and context queries
  static getContextSummary(props: MessageContextMetadataProps): string {
    const parts: string[] = [];
    
    if (this.hasTopics(props)) {
      parts.push(`${this.getTopicCount(props)} topics`);
    }
    
    if (props.sentiment) {
      parts.push(`${props.sentiment} sentiment`);
    }
    
    if (props.urgency) {
      parts.push(`${props.urgency} urgency`);
    }
    
    if (props.engagement) {
      parts.push(`${props.engagement} engagement`);
    }
    
    if (this.isLeadQualification(props)) {
      parts.push(`qualification step ${props.qualificationStep}`);
    }
    
    if (this.hasError(props)) {
      parts.push('has error');
    }
    
    return parts.length > 0 ? parts.join(', ') : 'no context data';
  }

  // Comparison queries
  static equals(
    props1: MessageContextMetadataProps,
    props2: MessageContextMetadataProps
  ): boolean {
    return (
      props1.qualificationStep === props2.qualificationStep &&
      props1.questionId === props2.questionId &&
      props1.expectedAnswerType === props2.expectedAnswerType &&
      props1.sentiment === props2.sentiment &&
      props1.urgency === props2.urgency &&
      props1.engagement === props2.engagement &&
      props1.inputMethod === props2.inputMethod &&
      props1.errorType === props2.errorType &&
      props1.topicsDiscussed.length === props2.topicsDiscussed.length &&
      props1.topicsDiscussed.every(topic => props2.topicsDiscussed.includes(topic))
    );
  }
}