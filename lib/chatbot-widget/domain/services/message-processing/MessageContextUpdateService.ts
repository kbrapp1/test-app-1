/**
 * Message Context Update Service
 * 
 * AI INSTRUCTIONS:
 * - Handles immutable update operations for MessageContextMetadata
 * - Pure functions that return new state without mutations
 * - Focused on business logic for state transitions
 * - Follows domain layer patterns with immutable operations
 */

import { MessageContextMetadataProps } from '../../value-objects/message-processing/MessageContextMetadata';

export class MessageContextUpdateService {
  static addTopicDiscussed(
    props: MessageContextMetadataProps,
    topic: string
  ): MessageContextMetadataProps {
    const trimmedTopic = topic.trim();
    if (props.topicsDiscussed.includes(trimmedTopic)) {
      return props;
    }

    return {
      ...props,
      topicsDiscussed: [...props.topicsDiscussed, trimmedTopic],
      updatedAt: new Date(),
    };
  }

  static updateSentiment(
    props: MessageContextMetadataProps,
    sentiment: 'positive' | 'neutral' | 'negative'
  ): MessageContextMetadataProps {
    return {
      ...props,
      sentiment,
      updatedAt: new Date(),
    };
  }

  static updateUrgency(
    props: MessageContextMetadataProps,
    urgency: 'low' | 'medium' | 'high'
  ): MessageContextMetadataProps {
    return {
      ...props,
      urgency,
      updatedAt: new Date(),
    };
  }

  static updateEngagement(
    props: MessageContextMetadataProps,
    engagement: 'low' | 'medium' | 'high'
  ): MessageContextMetadataProps {
    return {
      ...props,
      engagement,
      updatedAt: new Date(),
    };
  }

  static setQualificationData(
    props: MessageContextMetadataProps,
    qualificationStep: number,
    questionId?: string,
    expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect'
  ): MessageContextMetadataProps {
    return {
      ...props,
      qualificationStep,
      questionId,
      expectedAnswerType,
      updatedAt: new Date(),
    };
  }

  static setErrorData(
    props: MessageContextMetadataProps,
    errorType: string,
    errorCode?: string,
    errorMessage?: string
  ): MessageContextMetadataProps {
    return {
      ...props,
      errorType,
      errorCode,
      errorMessage,
      updatedAt: new Date(),
    };
  }

  static clearError(props: MessageContextMetadataProps): MessageContextMetadataProps {
    return {
      ...props,
      errorType: undefined,
      errorCode: undefined,
      errorMessage: undefined,
      updatedAt: new Date(),
    };
  }

  static incrementVersion(props: MessageContextMetadataProps): MessageContextMetadataProps {
    return {
      ...props,
      version: (props.version || 0) + 1,
      updatedAt: new Date(),
    };
  }

  static updateInputMethod(
    props: MessageContextMetadataProps,
    inputMethod: 'text' | 'voice' | 'button'
  ): MessageContextMetadataProps {
    return {
      ...props,
      inputMethod,
      updatedAt: new Date(),
    };
  }

  static setAuditInfo(
    props: MessageContextMetadataProps,
    createdBy: string,
    version?: number
  ): MessageContextMetadataProps {
    return {
      ...props,
      createdBy,
      version: version || props.version,
      updatedAt: new Date(),
    };
  }

  static mergeTopics(
    props: MessageContextMetadataProps,
    additionalTopics: string[]
  ): MessageContextMetadataProps {
    const existingTopics = new Set(props.topicsDiscussed);
    const newTopics = additionalTopics
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0 && !existingTopics.has(topic));

    if (newTopics.length === 0) {
      return props;
    }

    return {
      ...props,
      topicsDiscussed: [...props.topicsDiscussed, ...newTopics],
      updatedAt: new Date(),
    };
  }
}