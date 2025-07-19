/**
 * Message Context Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Handles validation logic for MessageContextMetadata value objects
 * - Pure validation functions without side effects
 * - Focused on domain business rules and constraints
 * - Follows domain layer patterns with business rule validation
 */

import { MessageContextMetadataProps } from '../../value-objects/message-processing/MessageContextMetadata';

export class MessageContextValidationService {
  static validateProps(props: MessageContextMetadataProps): void {
    this.validateTopicsDiscussed(props.topicsDiscussed);
    this.validateQualificationStep(props.qualificationStep);
    this.validateSentiment(props.sentiment);
    this.validateUrgency(props.urgency);
    this.validateEngagement(props.engagement);
    this.validateInputMethod(props.inputMethod);
    this.validateExpectedAnswerType(props.expectedAnswerType);
    this.validateVersion(props.version);
  }

  private static validateTopicsDiscussed(topicsDiscussed: string[]): void {
    if (!Array.isArray(topicsDiscussed)) {
      throw new Error('Topics discussed must be an array');
    }
  }

  private static validateQualificationStep(qualificationStep?: number): void {
    if (qualificationStep !== undefined && (typeof qualificationStep !== 'number' || qualificationStep < 0)) {
      throw new Error('Qualification step must be a non-negative number');
    }
  }

  private static validateSentiment(sentiment?: 'positive' | 'neutral' | 'negative'): void {
    if (sentiment && !['positive', 'neutral', 'negative'].includes(sentiment)) {
      throw new Error('Sentiment must be positive, neutral, or negative');
    }
  }

  private static validateUrgency(urgency?: 'low' | 'medium' | 'high'): void {
    if (urgency && !['low', 'medium', 'high'].includes(urgency)) {
      throw new Error('Urgency must be low, medium, or high');
    }
  }

  private static validateEngagement(engagement?: 'low' | 'medium' | 'high'): void {
    if (engagement && !['low', 'medium', 'high'].includes(engagement)) {
      throw new Error('Engagement must be low, medium, or high');
    }
  }

  private static validateInputMethod(inputMethod?: 'text' | 'voice' | 'button'): void {
    if (inputMethod && !['text', 'voice', 'button'].includes(inputMethod)) {
      throw new Error('Input method must be text, voice, or button');
    }
  }

  private static validateExpectedAnswerType(expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect'): void {
    if (expectedAnswerType && !['text', 'email', 'phone', 'select', 'multiselect'].includes(expectedAnswerType)) {
      throw new Error('Expected answer type must be text, email, phone, select, or multiselect');
    }
  }

  private static validateVersion(version?: number): void {
    if (version !== undefined && (typeof version !== 'number' || version < 1)) {
      throw new Error('Version must be a positive number');
    }
  }

  static isValidTopic(topic: string): boolean {
    return typeof topic === 'string' && topic.trim().length > 0;
  }

  static isValidErrorData(errorType: string, errorCode?: string, errorMessage?: string): boolean {
    return typeof errorType === 'string' && errorType.trim().length > 0;
  }
}