/**
 * Message Context Metadata Value Object
 * 
 * Handles conversation context, sentiment analysis, urgency tracking,
 * and lead qualification metadata for chat messages.
 */

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
    this.validateProps(props);
  }

  static create(props: MessageContextMetadataProps): MessageContextMetadata {
    return new MessageContextMetadata(props);
  }

  static createEmpty(): MessageContextMetadata {
    return new MessageContextMetadata({
      topicsDiscussed: [],
    });
  }

  static createForUser(inputMethod: 'text' | 'voice' | 'button' = 'text'): MessageContextMetadata {
    return new MessageContextMetadata({
      topicsDiscussed: [],
      inputMethod,
    });
  }

  static createForLeadCapture(
    qualificationStep: number,
    questionId?: string,
    expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect'
  ): MessageContextMetadata {
    return new MessageContextMetadata({
      topicsDiscussed: [],
      qualificationStep,
      questionId,
      expectedAnswerType,
    });
  }

  static createForError(errorType: string, errorCode?: string, errorMessage?: string): MessageContextMetadata {
    return new MessageContextMetadata({
      topicsDiscussed: [],
      errorType,
      errorCode,
      errorMessage,
    });
  }

  private validateProps(props: MessageContextMetadataProps): void {
    if (!Array.isArray(props.topicsDiscussed)) {
      throw new Error('Topics discussed must be an array');
    }

    if (props.qualificationStep !== undefined && (typeof props.qualificationStep !== 'number' || props.qualificationStep < 0)) {
      throw new Error('Qualification step must be a non-negative number');
    }

    if (props.sentiment && !['positive', 'neutral', 'negative'].includes(props.sentiment)) {
      throw new Error('Sentiment must be positive, neutral, or negative');
    }

    if (props.urgency && !['low', 'medium', 'high'].includes(props.urgency)) {
      throw new Error('Urgency must be low, medium, or high');
    }

    if (props.engagement && !['low', 'medium', 'high'].includes(props.engagement)) {
      throw new Error('Engagement must be low, medium, or high');
    }

    if (props.inputMethod && !['text', 'voice', 'button'].includes(props.inputMethod)) {
      throw new Error('Input method must be text, voice, or button');
    }

    if (props.expectedAnswerType && !['text', 'email', 'phone', 'select', 'multiselect'].includes(props.expectedAnswerType)) {
      throw new Error('Expected answer type must be text, email, phone, select, or multiselect');
    }

    if (props.version !== undefined && (typeof props.version !== 'number' || props.version < 1)) {
      throw new Error('Version must be a positive number');
    }
  }

  // Getters
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

  // Business methods
  addTopicDiscussed(topic: string): MessageContextMetadata {
    const trimmedTopic = topic.trim();
    if (this.props.topicsDiscussed.includes(trimmedTopic)) {
      return this;
    }

    return new MessageContextMetadata({
      ...this.props,
      topicsDiscussed: [...this.props.topicsDiscussed, trimmedTopic],
      updatedAt: new Date(),
    });
  }

  updateSentiment(sentiment: 'positive' | 'neutral' | 'negative'): MessageContextMetadata {
    return new MessageContextMetadata({
      ...this.props,
      sentiment,
      updatedAt: new Date(),
    });
  }

  updateUrgency(urgency: 'low' | 'medium' | 'high'): MessageContextMetadata {
    return new MessageContextMetadata({
      ...this.props,
      urgency,
      updatedAt: new Date(),
    });
  }

  updateEngagement(engagement: 'low' | 'medium' | 'high'): MessageContextMetadata {
    return new MessageContextMetadata({
      ...this.props,
      engagement,
      updatedAt: new Date(),
    });
  }

  setQualificationData(
    qualificationStep: number,
    questionId?: string,
    expectedAnswerType?: 'text' | 'email' | 'phone' | 'select' | 'multiselect'
  ): MessageContextMetadata {
    return new MessageContextMetadata({
      ...this.props,
      qualificationStep,
      questionId,
      expectedAnswerType,
      updatedAt: new Date(),
    });
  }

  setErrorData(errorType: string, errorCode?: string, errorMessage?: string): MessageContextMetadata {
    return new MessageContextMetadata({
      ...this.props,
      errorType,
      errorCode,
      errorMessage,
      updatedAt: new Date(),
    });
  }

  clearError(): MessageContextMetadata {
    return new MessageContextMetadata({
      ...this.props,
      errorType: undefined,
      errorCode: undefined,
      errorMessage: undefined,
      updatedAt: new Date(),
    });
  }

  incrementVersion(): MessageContextMetadata {
    return new MessageContextMetadata({
      ...this.props,
      version: (this.props.version || 0) + 1,
      updatedAt: new Date(),
    });
  }

  // Query methods
  hasTopics(): boolean {
    return this.props.topicsDiscussed.length > 0;
  }

  hasTopic(topic: string): boolean {
    return this.props.topicsDiscussed.includes(topic.trim());
  }

  hasError(): boolean {
    return !!this.props.errorType;
  }

  hasErrorDetails(): boolean {
    return !!(this.props.errorType || this.props.errorCode || this.props.errorMessage);
  }

  isLeadQualification(): boolean {
    return this.props.qualificationStep !== undefined;
  }

  hasPositiveSentiment(): boolean {
    return this.props.sentiment === 'positive';
  }

  hasNegativeSentiment(): boolean {
    return this.props.sentiment === 'negative';
  }

  isHighUrgency(): boolean {
    return this.props.urgency === 'high';
  }

  isLowUrgency(): boolean {
    return this.props.urgency === 'low';
  }

  isHighEngagement(): boolean {
    return this.props.engagement === 'high';
  }

  isLowEngagement(): boolean {
    return this.props.engagement === 'low';
  }

  isVoiceInput(): boolean {
    return this.props.inputMethod === 'voice';
  }

  isButtonInput(): boolean {
    return this.props.inputMethod === 'button';
  }

  requiresEmailAnswer(): boolean {
    return this.props.expectedAnswerType === 'email';
  }

  requiresPhoneAnswer(): boolean {
    return this.props.expectedAnswerType === 'phone';
  }

  getTopicCount(): number {
    return this.props.topicsDiscussed.length;
  }

  getErrorSummary(): string | null {
    if (!this.hasError()) return null;
    
    const parts = [this.props.errorType];
    if (this.props.errorCode) parts.push(`(${this.props.errorCode})`);
    if (this.props.errorMessage) parts.push(`: ${this.props.errorMessage}`);
    
    return parts.join('');
  }

  getContextSummary(): string {
    const parts: string[] = [];
    
    if (this.hasTopics()) {
      parts.push(`${this.getTopicCount()} topics`);
    }
    
    if (this.props.sentiment) {
      parts.push(`${this.props.sentiment} sentiment`);
    }
    
    if (this.props.urgency) {
      parts.push(`${this.props.urgency} urgency`);
    }
    
    if (this.props.engagement) {
      parts.push(`${this.props.engagement} engagement`);
    }
    
    if (this.isLeadQualification()) {
      parts.push(`qualification step ${this.props.qualificationStep}`);
    }
    
    if (this.hasError()) {
      parts.push('has error');
    }
    
    return parts.length > 0 ? parts.join(', ') : 'no context data';
  }

  equals(other: MessageContextMetadata): boolean {
    return (
      this.props.qualificationStep === other.props.qualificationStep &&
      this.props.questionId === other.props.questionId &&
      this.props.expectedAnswerType === other.props.expectedAnswerType &&
      this.props.sentiment === other.props.sentiment &&
      this.props.urgency === other.props.urgency &&
      this.props.engagement === other.props.engagement &&
      this.props.inputMethod === other.props.inputMethod &&
      this.props.errorType === other.props.errorType &&
      this.props.topicsDiscussed.length === other.props.topicsDiscussed.length
    );
  }

  toPlainObject(): MessageContextMetadataProps {
    return { ...this.props };
  }
} 