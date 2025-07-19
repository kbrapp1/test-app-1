/**
 * Message Context Metadata Factory Service
 * 
 * AI INSTRUCTIONS:
 * - Handles creation of MessageContextMetadata value objects
 * - Encapsulates factory methods and creation logic
 * - Focused on domain object instantiation concerns
 * - Follows domain layer patterns with pure creation logic
 */

import { MessageContextMetadataProps } from '../../value-objects/message-processing/MessageContextMetadata';

export class MessageContextMetadataFactory {
  static create(props: MessageContextMetadataProps): MessageContextMetadataProps {
    return {
      ...props,
      topicsDiscussed: props.topicsDiscussed || [],
    };
  }

  static createEmpty(): MessageContextMetadataProps {
    return {
      topicsDiscussed: [],
    };
  }

  static createForUser(inputMethod: 'text' | 'voice' | 'button' = 'text'): MessageContextMetadataProps {
    return {
      topicsDiscussed: [],
      inputMethod,
    };
  }

  static createForLeadCapture(
    qualificationStep: number,
    questionId?: string,
    expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect'
  ): MessageContextMetadataProps {
    return {
      topicsDiscussed: [],
      qualificationStep,
      questionId,
      expectedAnswerType,
    };
  }

  static createForError(
    errorType: string, 
    errorCode?: string, 
    errorMessage?: string
  ): MessageContextMetadataProps {
    return {
      topicsDiscussed: [],
      errorType,
      errorCode,
      errorMessage,
    };
  }

  static createForSentimentAnalysis(
    sentiment: 'positive' | 'neutral' | 'negative',
    urgency?: 'low' | 'medium' | 'high',
    engagement?: 'low' | 'medium' | 'high'
  ): MessageContextMetadataProps {
    return {
      topicsDiscussed: [],
      sentiment,
      urgency,
      engagement,
    };
  }

  static createWithTopics(topics: string[]): MessageContextMetadataProps {
    return {
      topicsDiscussed: [...topics],
    };
  }

  static createWithAuditInfo(
    createdBy: string,
    version: number = 1
  ): MessageContextMetadataProps {
    return {
      topicsDiscussed: [],
      createdBy,
      version,
      updatedAt: new Date(),
    };
  }
}