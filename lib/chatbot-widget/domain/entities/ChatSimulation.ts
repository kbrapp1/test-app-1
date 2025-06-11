import { ChatSimulationContext, SimulatedUserProfile, TestingGoal } from '../value-objects/ChatSimulationContext';
import { ChatMessage } from './ChatMessage';

export interface ChatSimulationProps {
  readonly id: string;
  readonly context: ChatSimulationContext;
  readonly messages: ChatMessage[];
  readonly status: 'active' | 'completed' | 'cancelled' | 'failed';
  readonly startedAt: Date;
  readonly endedAt?: Date;
  readonly results?: SimulationResults;
  readonly metadata: SimulationMetadata;
}

export interface SimulationResults {
  readonly completedSuccessfully: boolean;
  readonly totalMessages: number;
  readonly leadCaptured: boolean;
  readonly goalsAchieved: Array<{ goalId: string; achieved: boolean; notes?: string }>;
  readonly performanceMetrics: PerformanceMetrics;
  readonly qualityAssessment: QualityAssessment;
}

export interface PerformanceMetrics {
  readonly averageResponseTime: number;
  readonly totalDuration: number;
  readonly messagesPerMinute: number;
  readonly errorCount: number;
}

export interface QualityAssessment {
  readonly relevanceScore: number; // 0-100
  readonly accuracyScore: number; // 0-100
  readonly userSatisfactionScore: number; // 0-100
  readonly knowledgeBaseUtilization: number; // 0-100
}

export interface SimulationMetadata {
  readonly testerId?: string;
  readonly notes?: string;
  readonly tags: string[];
  readonly relatedSimulations: string[];
}

export class ChatSimulation {
  private constructor(private readonly props: ChatSimulationProps) {
    this.validateProps(props);
  }

  static create(
    context: ChatSimulationContext,
    metadata: Partial<SimulationMetadata> = {}
  ): ChatSimulation {
    return new ChatSimulation({
      id: crypto.randomUUID(),
      context,
      messages: [],
      status: 'active',
      startedAt: new Date(),
      metadata: {
        tags: [],
        relatedSimulations: [],
        ...metadata,
      },
    });
  }

  static fromPersistence(props: ChatSimulationProps): ChatSimulation {
    return new ChatSimulation(props);
  }

  private validateProps(props: ChatSimulationProps): void {
    if (!props.id?.trim()) {
      throw new Error('Simulation ID is required');
    }

    if (!props.context) {
      throw new Error('Simulation context is required');
    }

    if (!props.startedAt) {
      throw new Error('Started at timestamp is required');
    }

    if (props.endedAt && props.endedAt < props.startedAt) {
      throw new Error('End time cannot be before start time');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get context(): ChatSimulationContext { return this.props.context; }
  get messages(): ChatMessage[] { return this.props.messages; }
  get status(): string { return this.props.status; }
  get startedAt(): Date { return this.props.startedAt; }
  get endedAt(): Date | undefined { return this.props.endedAt; }
  get results(): SimulationResults | undefined { return this.props.results; }
  get metadata(): SimulationMetadata { return this.props.metadata; }

  // Business methods
  addMessage(message: ChatMessage): ChatSimulation {
    if (!this.canAddMessage()) {
      throw new Error('Cannot add message to inactive simulation');
    }

    if (!this.context.isWithinMessageLimit(this.props.messages.length + 1)) {
      throw new Error('Message limit exceeded for simulation');
    }

    if (!this.context.isWithinTimeLimit(this.props.startedAt)) {
      return this.complete({
        completedSuccessfully: false,
        totalMessages: this.props.messages.length,
        leadCaptured: false,
        goalsAchieved: [],
        performanceMetrics: this.calculatePerformanceMetrics(),
        qualityAssessment: this.calculateQualityAssessment(),
      });
    }

    return new ChatSimulation({
      ...this.props,
      messages: [...this.props.messages, message],
    });
  }

  complete(results: SimulationResults): ChatSimulation {
    if (this.props.status !== 'active') {
      throw new Error('Can only complete active simulations');
    }

    return new ChatSimulation({
      ...this.props,
      status: 'completed',
      endedAt: new Date(),
      results,
    });
  }

  cancel(reason?: string): ChatSimulation {
    if (this.props.status !== 'active') {
      throw new Error('Can only cancel active simulations');
    }

    return new ChatSimulation({
      ...this.props,
      status: 'cancelled',
      endedAt: new Date(),
      metadata: {
        ...this.props.metadata,
        notes: reason ? `${this.props.metadata.notes || ''}\nCancelled: ${reason}`.trim() : this.props.metadata.notes,
      },
    });
  }

  fail(error: string): ChatSimulation {
    return new ChatSimulation({
      ...this.props,
      status: 'failed',
      endedAt: new Date(),
      metadata: {
        ...this.props.metadata,
        notes: `${this.props.metadata.notes || ''}\nFailed: ${error}`.trim(),
      },
    });
  }

  canAddMessage(): boolean {
    return this.props.status === 'active';
  }

  isCompleted(): boolean {
    return this.props.status === 'completed';
  }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  hasExceededLimits(): boolean {
    return !this.context.isWithinMessageLimit(this.props.messages.length) ||
           !this.context.isWithinTimeLimit(this.props.startedAt);
  }

  getUserMessages(): ChatMessage[] {
    return this.props.messages.filter(msg => msg.messageType === 'user');
  }

  getBotMessages(): ChatMessage[] {
    return this.props.messages.filter(msg => msg.messageType === 'bot');
  }

  getCurrentMessageCount(): number {
    return this.props.messages.length;
  }

  getDuration(): number {
    const endTime = this.props.endedAt || new Date();
    return endTime.getTime() - this.props.startedAt.getTime();
  }

  getDurationInSeconds(): number {
    return Math.floor(this.getDuration() / 1000);
  }

  private calculatePerformanceMetrics(): PerformanceMetrics {
    const duration = this.getDurationInSeconds();
    const botMessages = this.getBotMessages();
    
    const averageResponseTime = botMessages.reduce((sum, msg) => {
      return sum + (msg.processingTime || 1000); // Default 1s if not recorded
    }, 0) / Math.max(botMessages.length, 1);

    return {
      averageResponseTime,
      totalDuration: duration,
      messagesPerMinute: duration > 0 ? (this.props.messages.length / duration) * 60 : 0,
      errorCount: botMessages.filter(msg => msg.metadata.errorType).length,
    };
  }

  private calculateQualityAssessment(): QualityAssessment {
    // Simplified quality assessment - could be enhanced with AI analysis
    const userMessages = this.getUserMessages();
    const botMessages = this.getBotMessages();
    
    // Basic heuristics for quality scoring
    const relevanceScore = botMessages.length > 0 ? 75 : 0; // Default reasonable score
    const accuracyScore = this.calculateAccuracyScore();
    const userSatisfactionScore = this.calculateSatisfactionScore();
    const knowledgeBaseUtilization = this.calculateKnowledgeUtilization();

    return {
      relevanceScore,
      accuracyScore,
      userSatisfactionScore,
      knowledgeBaseUtilization,
    };
  }

  private calculateAccuracyScore(): number {
    // Count messages without errors as accurate
    const botMessages = this.getBotMessages();
    if (botMessages.length === 0) return 0;
    
    const accurateMessages = botMessages.filter(msg => !msg.metadata.errorType).length;
    return (accurateMessages / botMessages.length) * 100;
  }

  private calculateSatisfactionScore(): number {
    // Heuristic based on conversation flow
    const userMessages = this.getUserMessages();
    const botMessages = this.getBotMessages();
    
    if (userMessages.length === 0 || botMessages.length === 0) return 0;
    
    // Base score on response ratio and conversation length
    const responseRatio = botMessages.length / userMessages.length;
    const conversationLength = this.props.messages.length;
    
    let score = 50; // Base score
    
    // Good response ratio (1:1 or close)
    if (responseRatio >= 0.8 && responseRatio <= 1.2) score += 20;
    
    // Reasonable conversation length
    if (conversationLength >= 4 && conversationLength <= 20) score += 20;
    
    // Bonus for lead qualification questions being answered
    if (this.context.shouldRequireLeadCapture() && this.hasLeadInformation()) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateKnowledgeUtilization(): number {
    // Simplified calculation - could be enhanced with semantic analysis
    const botMessages = this.getBotMessages();
    const messagesWithKnowledge = botMessages.filter(msg => 
      msg.content.length > 50 && // Substantial responses
      !msg.content.toLowerCase().includes('i don\'t know') &&
      !msg.content.toLowerCase().includes('i\'m not sure')
    );
    
    if (botMessages.length === 0) return 0;
    return (messagesWithKnowledge.length / botMessages.length) * 100;
  }

  private hasLeadInformation(): boolean {
    // Check if any user messages contain email or phone patterns
    const userMessages = this.getUserMessages();
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    
    return userMessages.some(msg => 
      emailPattern.test(msg.content) || phonePattern.test(msg.content)
    );
  }

  withUpdatedMetadata(metadata: Partial<SimulationMetadata>): ChatSimulation {
    return new ChatSimulation({
      ...this.props,
      metadata: {
        ...this.props.metadata,
        ...metadata,
      },
    });
  }

  // Export methods
  toPlainObject(): Omit<ChatSimulationProps, 'messages'> & { messages: ChatMessage[] } {
    return {
      ...this.props,
      messages: this.props.messages,
    };
  }

  getExecutiveSummary(): string {
    const duration = this.getDurationInSeconds();
    const userMsgCount = this.getUserMessages().length;
    const botMsgCount = this.getBotMessages().length;
    
    return `Simulation completed in ${duration}s with ${userMsgCount} user messages and ${botMsgCount} bot responses. Status: ${this.props.status}`;
  }

  getResultsSummary(): string {
    if (!this.props.results) return 'No results available';
    
    const r = this.props.results;
    return `Success: ${r.completedSuccessfully}, Messages: ${r.totalMessages}, Lead: ${r.leadCaptured ? 'Yes' : 'No'}, Quality: ${r.qualityAssessment.relevanceScore}%`;
  }
} 