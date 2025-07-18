/**
 * Chat Message Factory Service
 * 
 * Domain service responsible for reconstructing ChatMessage entities from persistence
 * and handling complex creation scenarios with proper value object composition.
 */

import { ChatMessage, ChatMessageProps, MessageType } from '../../entities/ChatMessage';
import { MessageAIMetadata } from '../../value-objects/message-processing/MessageAIMetadata';
import { MessageContextMetadata } from '../../value-objects/message-processing/MessageContextMetadata';
import { MessageProcessingMetrics } from '../../value-objects/message-processing/MessageProcessingMetrics';
import { MessageCostTracking } from '../../value-objects/message-processing/MessageCostTracking';

export class ChatMessageFactoryService {
  /**
   * Reconstruct ChatMessage from persistence data
   * Handles the complex mapping of flat persistence data to value objects
   */
  static fromPersistence(props: Record<string, unknown>): ChatMessage {
    const metadata = (props.metadata as Record<string, unknown>) || {};
    
    // Reconstruct AI metadata value object
    const aiMetadata = MessageAIMetadata.create({
      aiModel: metadata.aiModel as string,
      promptTokens: metadata.promptTokens as number,
      completionTokens: metadata.completionTokens as number,
      totalTokens: metadata.totalTokens as number,
      confidence: metadata.confidence as number,
      intentDetected: metadata.intentDetected as string,
      entitiesExtracted: (metadata.entitiesExtracted as Array<{ type: string; value: string; confidence: number; start?: number; end?: number }>) || [],
    });

    // Reconstruct context metadata value object
    const contextMetadata = MessageContextMetadata.create({
      qualificationStep: metadata.qualificationStep as number,
      questionId: metadata.questionId as string,
      expectedAnswerType: metadata.expectedAnswerType as 'text' | 'email' | 'phone' | 'select' | 'multiselect',
      topicsDiscussed: (metadata.topicsDiscussed as string[]) || [],
      sentiment: metadata.sentiment as 'positive' | 'neutral' | 'negative',
      urgency: metadata.urgency as 'low' | 'medium' | 'high',
      inputMethod: metadata.inputMethod as 'text' | 'voice' | 'button',
      errorType: metadata.errorType as string,
      errorCode: metadata.errorCode as string,
      errorMessage: metadata.errorMessage as string,
      createdBy: metadata.createdBy as string,
      updatedAt: metadata.updatedAt ? new Date(metadata.updatedAt as string | number) : undefined,
      version: metadata.version as number,
    });

    // Reconstruct processing metrics value object
    const processingMetrics = MessageProcessingMetrics.create({
      processingSteps: (metadata.processingSteps as Array<{ step: string; duration: number; success: boolean }>) || [],
      responseTime: metadata.responseTime as number,
      cacheHit: metadata.cacheHit as boolean,
      processingTime: props.processingTime as number,
    });

    // Reconstruct cost tracking value object
    const costTracking = metadata.costCents !== undefined
      ? MessageCostTracking.create({
          costCents: metadata.costCents as number,
          costBreakdown: metadata.costBreakdown as { promptTokensCents: number; completionTokensCents: number; totalCents: number; displayCents: number; modelRate?: number },
          modelRate: (metadata.costBreakdown as Record<string, unknown>)?.modelRate as number,
        })
      : MessageCostTracking.createZeroCost();

    // Create the entity with properly composed value objects
    const chatMessageProps: ChatMessageProps = {
      id: props.id as string,
      sessionId: props.sessionId as string,
      messageType: props.messageType as MessageType,
      content: props.content as string,
      timestamp: new Date(props.timestamp as string | number),
      isVisible: props.isVisible as boolean,
      processingTime: props.processingTime as number,
      aiMetadata,
      contextMetadata,
      processingMetrics,
      costTracking,
    };

    return ChatMessage.create(chatMessageProps);
  }

  /** Create a message with enhanced AI metadata for complex scenarios */
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
      id: ChatMessage.generateId(),
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

  /** Create a system error message with detailed error information */
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
      id: ChatMessage.generateId(),
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