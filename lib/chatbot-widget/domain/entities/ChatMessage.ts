/**
 * Chat Message Entity
 * 
 * AI INSTRUCTIONS:
 * - Core domain entity representing chat message with rich metadata through composed value objects
 * - Manages message lifecycle, AI processing metadata, cost tracking, and business analytics
 * - Immutable entity following @golden-rule patterns with collision-resistant ID generation
 * - Coordinates AI metadata, context metadata, processing metrics, and cost tracking value objects
 * - Supports user/bot/system message types with specialized factory methods and business logic
 */

import { MessageAIMetadata } from '../value-objects/message-processing/MessageAIMetadata';
import { MessageContextMetadata } from '../value-objects/message-processing/MessageContextMetadata';
import { MessageProcessingMetrics } from '../value-objects/message-processing/MessageProcessingMetrics';
import { MessageCostTracking } from '../value-objects/message-processing/MessageCostTracking';

export interface ChatMessageProps {
  id: string;
  sessionId: string;
  messageType: MessageType;
  content: string;
  timestamp: Date;
  isVisible: boolean;
  processingTime?: number;
  aiMetadata: MessageAIMetadata;
  contextMetadata: MessageContextMetadata;
  processingMetrics: MessageProcessingMetrics;
  costTracking: MessageCostTracking;
}

// Collision-resistant ID generator with timestamp-based uniqueness
class ChatMessageIdGenerator {
  private static lastTimestamp = 0;
  private static counter = 0;

  static generate(): string {
    const now = Date.now();
    
    // Reset counter if timestamp changed
    if (now !== this.lastTimestamp) {
      this.counter = 0;
      this.lastTimestamp = now;
    } else {
      this.counter++;
    }
    
    // Generate base UUID and modify the last few characters with counter
    const baseUuid = crypto.randomUUID();
    const counterHex = this.counter.toString(16).padStart(3, '0').substring(0, 3);
    
    // Replace last 3 characters before final hyphen with counter
    const parts = baseUuid.split('-');
    const lastPart = parts[4];
    parts[4] = lastPart.substring(0, 9) + counterHex;
    
    return parts.join('-');
  }
}

export type MessageType = 'user' | 'bot' | 'system' | 'lead_capture' | 'qualification';

export class ChatMessage {
  private constructor(private readonly props: ChatMessageProps) {
    this.validateProps(props);
  }

  static create(props: ChatMessageProps): ChatMessage {
    return new ChatMessage(props);
  }

  // Generate collision-resistant ID
  static generateId(): string {
    return ChatMessageIdGenerator.generate();
  }

  static createUserMessage(
    sessionId: string,
    content: string,
    inputMethod: 'text' | 'voice' | 'button' = 'text'
  ): ChatMessage {
    return new ChatMessage({
      id: ChatMessageIdGenerator.generate(),
      sessionId,
      messageType: 'user',
      content: content.trim(),
      timestamp: new Date(),
      isVisible: true,
      aiMetadata: MessageAIMetadata.createEmpty(),
      contextMetadata: MessageContextMetadata.createForUser(inputMethod),
      processingMetrics: MessageProcessingMetrics.createEmpty(),
      costTracking: MessageCostTracking.createZeroCost(),
    });
  }

  static createBotMessage(
    sessionId: string,
    content: string,
    aiMetadata?: {
      model?: string;
      promptTokens?: number;
      completionTokens?: number;
      confidence?: number;
      intentDetected?: string;
      processingTime?: number;
    }
  ): ChatMessage {
    const messageAIMetadata = aiMetadata 
      ? MessageAIMetadata.createFromTokens(
          aiMetadata.model || 'gpt-4o-mini',
          aiMetadata.promptTokens || 0,
          aiMetadata.completionTokens || 0,
          aiMetadata.confidence,
          aiMetadata.intentDetected
        )
      : MessageAIMetadata.createEmpty();

    const processingMetrics = aiMetadata?.processingTime
      ? MessageProcessingMetrics.createWithResponseTime(aiMetadata.processingTime)
      : MessageProcessingMetrics.createEmpty();

    const costTracking = (aiMetadata?.promptTokens && aiMetadata?.completionTokens)
      ? MessageCostTracking.createFromTokens(
          aiMetadata.promptTokens,
          aiMetadata.completionTokens,
          0.0001
        )
      : MessageCostTracking.createZeroCost();

    return new ChatMessage({
      id: ChatMessageIdGenerator.generate(),
      sessionId,
      messageType: 'bot',
      content: content.trim(),
      timestamp: new Date(),
      isVisible: true,
      processingTime: aiMetadata?.processingTime,
      aiMetadata: messageAIMetadata,
      contextMetadata: MessageContextMetadata.createEmpty(),
      processingMetrics,
      costTracking,
    });
  }

  static fromPersistence(props: ChatMessageProps): ChatMessage {
    return new ChatMessage(props);
  }

  private validateProps(props: ChatMessageProps): void {
    if (!props.sessionId?.trim()) {
      throw new Error('Session ID is required');
    }
    if (!props.content?.trim()) {
      throw new Error('Message content cannot be empty');
    }
    if (props.content.length > 4000) {
      throw new Error('Message content cannot exceed 4000 characters');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get sessionId(): string { return this.props.sessionId; }
  get messageType(): MessageType { return this.props.messageType; }
  get content(): string { return this.props.content; }
  get timestamp(): Date { return this.props.timestamp; }
  get isVisible(): boolean { return this.props.isVisible; }
  get processingTime(): number | undefined { return this.props.processingTime; }
  get aiMetadata(): MessageAIMetadata { return this.props.aiMetadata; }
  get contextMetadata(): MessageContextMetadata { return this.props.contextMetadata; }
  get processingMetrics(): MessageProcessingMetrics { return this.props.processingMetrics; }
  get costTracking(): MessageCostTracking { return this.props.costTracking; }

  // Business methods - delegate to value objects
  addProcessingStep(step: string, duration: number, success: boolean, error?: string): ChatMessage {
    return new ChatMessage({
      ...this.props,
      processingMetrics: this.props.processingMetrics.addProcessingStep(step, duration, success, error),
    });
  }

  addExtractedEntity(entity: { type: string; value: string; confidence: number; start?: number; end?: number }): ChatMessage {
    return new ChatMessage({
      ...this.props,
      aiMetadata: this.props.aiMetadata.addExtractedEntity(entity),
    });
  }

  updateSentiment(sentiment: 'positive' | 'neutral' | 'negative'): ChatMessage {
    return new ChatMessage({
      ...this.props,
      contextMetadata: this.props.contextMetadata.updateSentiment(sentiment),
    });
  }

  updateUrgency(urgency: 'low' | 'medium' | 'high'): ChatMessage {
    return new ChatMessage({
      ...this.props,
      contextMetadata: this.props.contextMetadata.updateUrgency(urgency),
    });
  }

  updateEngagement(engagement: 'low' | 'medium' | 'high'): ChatMessage {
    return new ChatMessage({
      ...this.props,
      contextMetadata: this.props.contextMetadata.updateEngagement(engagement),
    });
  }

  addTopicDiscussed(topic: string): ChatMessage {
    return new ChatMessage({
      ...this.props,
      contextMetadata: this.props.contextMetadata.addTopicDiscussed(topic),
    });
  }

  markAsInvisible(): ChatMessage {
    return new ChatMessage({
      ...this.props,
      isVisible: false,
    });
  }

  markAsVisible(): ChatMessage {
    return new ChatMessage({
      ...this.props,
      isVisible: true,
    });
  }

  updateProcessingTime(processingTime: number): ChatMessage {
    return new ChatMessage({
      ...this.props,
      processingTime,
      processingMetrics: this.props.processingMetrics.updateResponseTime(processingTime),
    });
  }

  addCostTracking(costCents: number, breakdown?: { promptTokensCents: number; completionTokensCents: number; totalCents: number; displayCents: number; modelRate?: number }): ChatMessage {
    const newCostTracking = breakdown 
      ? MessageCostTracking.create({ costCents, costBreakdown: breakdown })
      : MessageCostTracking.create({ costCents });

    return new ChatMessage({
      ...this.props,
      costTracking: newCostTracking,
    });
  }

  // Query methods - delegate to value objects
  isFromUser(): boolean { return this.props.messageType === 'user'; }
  isFromBot(): boolean { return this.props.messageType === 'bot'; }
  isSystemMessage(): boolean { return this.props.messageType === 'system'; }
  isLeadCapture(): boolean { return this.props.messageType === 'lead_capture' || this.props.messageType === 'qualification'; }
  hasError(): boolean { return this.props.contextMetadata.hasError(); }
  hasEntities(): boolean { return this.props.aiMetadata.hasEntities(); }
  getTokenCost(): number { return this.props.costTracking.costCents; }
  getCostBreakdown(): { promptTokensCents: number; completionTokensCents: number; totalCents: number; displayCents: number; modelRate?: number } | undefined { return this.props.costTracking.costBreakdown; }
  hasErrorDetails(): boolean { return this.props.contextMetadata.hasErrorDetails(); }
  getProcessingDuration(): number { return this.props.processingMetrics.getTotalProcessingDuration(); }
  hasHighConfidence(threshold: number = 0.8): boolean { return this.props.aiMetadata.hasHighConfidence(threshold); }

  isRecentMessage(minutesThreshold: number = 5): boolean {
    const now = new Date().getTime();
    const messageTime = this.props.timestamp.getTime();
    const thresholdMs = minutesThreshold * 60 * 1000;
    return (now - messageTime) <= thresholdMs;
  }

  // Export methods
  toDisplayText(): string { return this.props.content; }

  toAnalyticsEvent(): object {
    return {
      messageId: this.props.id,
      sessionId: this.props.sessionId,
      messageType: this.props.messageType,
      timestamp: this.props.timestamp,
      contentLength: this.props.content.length,
      processingTime: this.props.processingTime,
      tokenCost: this.getTokenCost(),
      confidence: this.props.aiMetadata.confidence,
      sentiment: this.props.contextMetadata.sentiment,
      urgency: this.props.contextMetadata.urgency,
      engagement: this.props.contextMetadata.engagement,
      hasEntities: this.hasEntities(),
      hasError: this.hasError(),
    };
  }

  toPlainObject(): ChatMessageProps {
    return { ...this.props };
  }
} 