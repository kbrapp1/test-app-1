/**
 * Chat Message Factory Service
 * 
 * Domain service responsible for reconstructing ChatMessage entities from persistence
 * and handling complex creation scenarios with proper value object composition.
 */

import { ChatMessage, ChatMessageProps } from '../../entities/ChatMessage';
import { MessageAIMetadata } from '../../value-objects/message-processing/MessageAIMetadata';
import { MessageContextMetadata } from '../../value-objects/message-processing/MessageContextMetadata';
import { MessageProcessingMetrics } from '../../value-objects/message-processing/MessageProcessingMetrics';
import { MessageCostTracking } from '../../value-objects/message-processing/MessageCostTracking';

export class ChatMessageFactoryService {
  /**
   * Reconstruct ChatMessage from persistence data
   * Handles the complex mapping of flat persistence data to value objects
   */
  static fromPersistence(props: any): ChatMessage {
    // Reconstruct AI metadata value object
    const aiMetadata = MessageAIMetadata.create({
      aiModel: props.metadata?.aiModel,
      promptTokens: props.metadata?.promptTokens,
      completionTokens: props.metadata?.completionTokens,
      totalTokens: props.metadata?.totalTokens,
      confidence: props.metadata?.confidence,
      intentDetected: props.metadata?.intentDetected,
      entitiesExtracted: props.metadata?.entitiesExtracted || [],
    });

    // Reconstruct context metadata value object
    const contextMetadata = MessageContextMetadata.create({
      qualificationStep: props.metadata?.qualificationStep,
      questionId: props.metadata?.questionId,
      expectedAnswerType: props.metadata?.expectedAnswerType,
      topicsDiscussed: props.metadata?.topicsDiscussed || [],
      sentiment: props.metadata?.sentiment,
      urgency: props.metadata?.urgency,
      inputMethod: props.metadata?.inputMethod,
      errorType: props.metadata?.errorType,
      errorCode: props.metadata?.errorCode,
      errorMessage: props.metadata?.errorMessage,
      createdBy: props.metadata?.createdBy,
      updatedAt: props.metadata?.updatedAt ? new Date(props.metadata.updatedAt) : undefined,
      version: props.metadata?.version,
    });

    // Reconstruct processing metrics value object
    const processingMetrics = MessageProcessingMetrics.create({
      processingSteps: props.metadata?.processingSteps || [],
      responseTime: props.metadata?.responseTime,
      cacheHit: props.metadata?.cacheHit,
      processingTime: props.processingTime,
    });

    // Reconstruct cost tracking value object
    const costTracking = props.metadata?.costCents !== undefined
      ? MessageCostTracking.create({
          costCents: props.metadata.costCents,
          costBreakdown: props.metadata.costBreakdown,
          modelRate: props.metadata.costBreakdown?.modelRate,
        })
      : MessageCostTracking.createZeroCost();

    // Create the entity with properly composed value objects
    const chatMessageProps: ChatMessageProps = {
      id: props.id,
      sessionId: props.sessionId,
      messageType: props.messageType,
      content: props.content,
      timestamp: new Date(props.timestamp),
      isVisible: props.isVisible,
      processingTime: props.processingTime,
      aiMetadata,
      contextMetadata,
      processingMetrics,
      costTracking,
    };

    return ChatMessage.create(chatMessageProps);
  }

  /**
   * Create a message with enhanced AI metadata for complex scenarios
   */
  static createBotMessageWithFullMetadata(
    sessionId: string,
    content: string,
    aiModel: string,
    promptTokens: number,
    completionTokens: number,
    confidence: number,
    intentDetected: string,
    entities: Array<{ type: string; value: string; confidence: number; start?: number; end?: number }>,
    processingTime: number,
    modelRate: number = 0.0001
  ): ChatMessage {
    // Create AI metadata with entities
    let aiMetadata = MessageAIMetadata.createFromTokens(
      aiModel,
      promptTokens,
      completionTokens,
      confidence,
      intentDetected
    );

    // Add entities
    entities.forEach(entity => {
      aiMetadata = aiMetadata.addExtractedEntity(entity);
    });

    // Create processing metrics
    const processingMetrics = MessageProcessingMetrics.createWithResponseTime(processingTime);

    // Create cost tracking
    const costTracking = MessageCostTracking.createFromTokens(
      promptTokens,
      completionTokens,
      modelRate
    );

    // Create context metadata
    const contextMetadata = MessageContextMetadata.createEmpty();

    const props: ChatMessageProps = {
      id: crypto.randomUUID(),
      sessionId,
      messageType: 'bot',
      content: content.trim(),
      timestamp: new Date(),
      isVisible: true,
      processingTime,
      aiMetadata,
      contextMetadata,
      processingMetrics,
      costTracking,
    };

    return ChatMessage.create(props);
  }

  /**
   * Create a system error message with detailed error information
   */
  static createSystemErrorMessage(
    sessionId: string,
    content: string,
    errorType: string,
    errorCode?: string,
    errorMessage?: string
  ): ChatMessage {
    const contextMetadata = MessageContextMetadata.createForError(errorType, errorCode, errorMessage);
    const aiMetadata = MessageAIMetadata.createEmpty();
    const processingMetrics = MessageProcessingMetrics.createEmpty();
    const costTracking = MessageCostTracking.createZeroCost();

    const props: ChatMessageProps = {
      id: crypto.randomUUID(),
      sessionId,
      messageType: 'system',
      content,
      timestamp: new Date(),
      isVisible: false,
      aiMetadata,
      contextMetadata,
      processingMetrics,
      costTracking,
    };

    return ChatMessage.create(props);
  }
} 