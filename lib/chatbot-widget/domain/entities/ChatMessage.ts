export interface ChatMessageProps {
  id: string;
  sessionId: string;
  messageType: MessageType;
  content: string;
  metadata: MessageMetadata;
  timestamp: Date;
  isVisible: boolean;
  processingTime?: number;
}

export type MessageType = 'user' | 'bot' | 'system' | 'lead_capture' | 'qualification';

export interface MessageMetadata {
  // AI-specific metadata
  aiModel?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  
  // User message metadata
  inputMethod?: 'text' | 'voice' | 'button';
  
  // Bot response metadata
  confidence?: number;
  intentDetected?: string;
  entitiesExtracted?: ExtractedEntity[];
  
  // Lead qualification metadata
  qualificationStep?: number;
  questionId?: string;
  expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect';
  
  // System metadata
  errorType?: string;
  processingSteps?: ProcessingStep[];
  
  // Context metadata
  topicsDiscussed?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency?: 'low' | 'medium' | 'high';
  
  // Performance metadata
  responseTime?: number;
  cacheHit?: boolean;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
  start?: number;
  end?: number;
}

export interface ProcessingStep {
  step: string;
  duration: number;
  success: boolean;
  error?: string;
}

export class ChatMessage {
  private constructor(private readonly props: ChatMessageProps) {
    this.validateProps(props);
  }

  static createUserMessage(
    sessionId: string,
    content: string,
    inputMethod: 'text' | 'voice' | 'button' = 'text'
  ): ChatMessage {
    return new ChatMessage({
      id: crypto.randomUUID(),
      sessionId,
      messageType: 'user',
      content: content.trim(),
      metadata: {
        inputMethod,
      },
      timestamp: new Date(),
      isVisible: true,
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
    return new ChatMessage({
      id: crypto.randomUUID(),
      sessionId,
      messageType: 'bot',
      content: content.trim(),
      metadata: {
        aiModel: aiMetadata?.model,
        promptTokens: aiMetadata?.promptTokens,
        completionTokens: aiMetadata?.completionTokens,
        totalTokens: (aiMetadata?.promptTokens || 0) + (aiMetadata?.completionTokens || 0),
        confidence: aiMetadata?.confidence,
        intentDetected: aiMetadata?.intentDetected,
        responseTime: aiMetadata?.processingTime,
      },
      timestamp: new Date(),
      isVisible: true,
      processingTime: aiMetadata?.processingTime,
    });
  }

  static createSystemMessage(
    sessionId: string,
    content: string,
    errorType?: string
  ): ChatMessage {
    return new ChatMessage({
      id: crypto.randomUUID(),
      sessionId,
      messageType: 'system',
      content,
      metadata: {
        errorType,
      },
      timestamp: new Date(),
      isVisible: false, // System messages are typically not visible to users
    });
  }

  static createLeadCaptureMessage(
    sessionId: string,
    content: string,
    qualificationStep: number,
    questionId?: string,
    expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect'
  ): ChatMessage {
    return new ChatMessage({
      id: crypto.randomUUID(),
      sessionId,
      messageType: 'lead_capture',
      content,
      metadata: {
        qualificationStep,
        questionId,
        expectedAnswerType,
      },
      timestamp: new Date(),
      isVisible: true,
    });
  }

  static createQualificationMessage(
    sessionId: string,
    content: string,
    questionId: string,
    qualificationStep: number,
    expectedAnswerType: 'text' | 'email' | 'phone' | 'select' | 'multiselect'
  ): ChatMessage {
    return new ChatMessage({
      id: crypto.randomUUID(),
      sessionId,
      messageType: 'qualification',
      content,
      metadata: {
        questionId,
        qualificationStep,
        expectedAnswerType,
      },
      timestamp: new Date(),
      isVisible: true,
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
  get metadata(): MessageMetadata { return this.props.metadata; }
  get timestamp(): Date { return this.props.timestamp; }
  get isVisible(): boolean { return this.props.isVisible; }
  get processingTime(): number | undefined { return this.props.processingTime; }

  // Business methods
  addProcessingStep(step: string, duration: number, success: boolean, error?: string): ChatMessage {
    const newStep: ProcessingStep = { step, duration, success, error };
    const existingSteps = this.props.metadata.processingSteps || [];
    
    return new ChatMessage({
      ...this.props,
      metadata: {
        ...this.props.metadata,
        processingSteps: [...existingSteps, newStep],
      },
    });
  }

  addExtractedEntity(entity: ExtractedEntity): ChatMessage {
    const existingEntities = this.props.metadata.entitiesExtracted || [];
    
    return new ChatMessage({
      ...this.props,
      metadata: {
        ...this.props.metadata,
        entitiesExtracted: [...existingEntities, entity],
      },
    });
  }

  updateSentiment(sentiment: 'positive' | 'neutral' | 'negative'): ChatMessage {
    return new ChatMessage({
      ...this.props,
      metadata: {
        ...this.props.metadata,
        sentiment,
      },
    });
  }

  updateUrgency(urgency: 'low' | 'medium' | 'high'): ChatMessage {
    return new ChatMessage({
      ...this.props,
      metadata: {
        ...this.props.metadata,
        urgency,
      },
    });
  }

  addTopicDiscussed(topic: string): ChatMessage {
    const existingTopics = this.props.metadata.topicsDiscussed || [];
    
    if (existingTopics.includes(topic)) {
      return this;
    }
    
    return new ChatMessage({
      ...this.props,
      metadata: {
        ...this.props.metadata,
        topicsDiscussed: [...existingTopics, topic],
      },
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
      metadata: {
        ...this.props.metadata,
        responseTime: processingTime,
      },
    });
  }

  // Query methods
  isFromUser(): boolean {
    return this.props.messageType === 'user';
  }

  isFromBot(): boolean {
    return this.props.messageType === 'bot';
  }

  isSystemMessage(): boolean {
    return this.props.messageType === 'system';
  }

  isLeadCapture(): boolean {
    return this.props.messageType === 'lead_capture' || this.props.messageType === 'qualification';
  }

  hasError(): boolean {
    return !!this.props.metadata.errorType;
  }

  hasEntities(): boolean {
    return (this.props.metadata.entitiesExtracted?.length || 0) > 0;
  }

  getTokenCost(): number {
    return this.props.metadata.totalTokens || 0;
  }

  getProcessingDuration(): number {
    const steps = this.props.metadata.processingSteps || [];
    return steps.reduce((total, step) => total + step.duration, 0);
  }

  hasHighConfidence(threshold: number = 0.8): boolean {
    return (this.props.metadata.confidence || 0) >= threshold;
  }

  isRecentMessage(minutesThreshold: number = 5): boolean {
    const now = new Date().getTime();
    const messageTime = this.props.timestamp.getTime();
    const thresholdMs = minutesThreshold * 60 * 1000;
    
    return (now - messageTime) <= thresholdMs;
  }

  // Export methods
  toDisplayText(): string {
    return this.props.content;
  }

  toAnalyticsEvent(): object {
    return {
      messageId: this.props.id,
      sessionId: this.props.sessionId,
      messageType: this.props.messageType,
      timestamp: this.props.timestamp,
      contentLength: this.props.content.length,
      processingTime: this.props.processingTime,
      tokenCost: this.getTokenCost(),
      confidence: this.props.metadata.confidence,
      sentiment: this.props.metadata.sentiment,
      urgency: this.props.metadata.urgency,
      hasEntities: this.hasEntities(),
      hasError: this.hasError(),
    };
  }

  toPlainObject(): ChatMessageProps {
    return { ...this.props };
  }
} 