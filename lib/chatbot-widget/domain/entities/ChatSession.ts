import { 
  ChatSessionProps, 
  SessionContext, 
  LeadQualificationState,
  SessionStatus,
  SessionMetrics
} from '../value-objects/session-management/ChatSessionTypes';

// Re-export types for external use
export type {
  ChatSessionProps,
  SessionContext,
  LeadQualificationState,
  SessionStatus,
  SessionMetrics
};
import { ChatSessionValidationService } from '../services/session-management/ChatSessionValidationService';
import { SessionLeadQualificationService } from '../services/session-management/SessionLeadQualificationService';
import { SessionStateService } from '../services/session-management/SessionStateService';
import { SessionContextService } from '../services/session-management/SessionContextService';
import { ChatSessionFactory } from '../services/session-management/ChatSessionFactory';

/**
 * Chat Session Entity
 * 
 * AI INSTRUCTIONS:
 * - Core domain entity representing chat session with rich conversational context
 * - Pure entity following DDD principles with business logic delegated to domain services
 */
export class ChatSession {
  private constructor(private readonly props: ChatSessionProps) {
    ChatSessionValidationService.validateSessionProps(props);
  }

  static create(
    chatbotConfigId: string,
    visitorId: string,
    initialContext?: Partial<SessionContext>
  ): ChatSession {
    const props = ChatSessionFactory.createSessionProps(chatbotConfigId, visitorId, initialContext);
    return new ChatSession(props);
  }

  static fromPersistence(props: ChatSessionProps): ChatSession {
    return new ChatSession(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get chatbotConfigId(): string { return this.props.chatbotConfigId; }
  get visitorId(): string { return this.props.visitorId; }
  get sessionToken(): string { return this.props.sessionToken; }
  get contextData(): SessionContext { return this.props.contextData; }
  get leadQualificationState(): LeadQualificationState { return this.props.leadQualificationState; }
  get status(): SessionStatus { return this.props.status; }
  get startedAt(): Date { return this.props.startedAt; }
  get lastActivityAt(): Date { return this.props.lastActivityAt; }
  get endedAt(): Date | undefined { return this.props.endedAt; }
  get ipAddress(): string | undefined { return this.props.ipAddress; }
  get userAgent(): string | undefined { return this.props.userAgent; }
  get referrerUrl(): string | undefined { return this.props.referrerUrl; }
  get currentUrl(): string | undefined { return this.props.currentUrl; }

  // Business methods
  updateActivity(): ChatSession {
    const updatedProps = SessionStateService.updateActivity(this.props);
    return new ChatSession(updatedProps);
  }

  addPageView(url: string, title: string, timeOnPage: number = 0): ChatSession {
    const updatedContext = SessionContextService.addPageView(this.props.contextData, url, title, timeOnPage);
    const updatedProps = SessionStateService.updateCurrentUrl(
      { ...this.props, contextData: updatedContext },
      url
    );
    return new ChatSession(updatedProps);
  }

  updateConversationSummary(summary: string): ChatSession {
    const updatedContext = SessionContextService.updateConversationSummary(this.props.contextData, summary);
    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  // Enhanced conversation summary with phase breakdowns
  updateConversationSummaryEnhanced(summary: {
    fullSummary: string;
    phaseSummaries?: Array<{
      phase: string;
      summary: string;
      keyOutcomes: string[];
      entitiesExtracted: string[];
      timeframe: { start: Date; end: Date };
    }>;
    criticalMoments?: Array<{
      messageId: string;
      importance: 'high' | 'critical';
      context: string;
      preserveInContext: boolean;
    }>;
  }): ChatSession {
    const updatedContext = SessionContextService.updateConversationSummary(
      this.props.contextData, 
      summary.fullSummary,
      summary.phaseSummaries,
      summary.criticalMoments
    );
    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  addTopic(topic: string): ChatSession {
    const updatedContext = SessionContextService.addTopic(this.props.contextData, topic);
    if (updatedContext === this.props.contextData) {
      return this; // No change
    }
    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  addInterest(interest: string): ChatSession {
    const updatedContext = SessionContextService.addInterest(this.props.contextData, interest);
    if (updatedContext === this.props.contextData) {
      return this; // No change
    }
    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  updateEngagementScore(score: number): ChatSession {
    const updatedContext = SessionContextService.updateEngagementScore(this.props.contextData, score);
    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  startLeadQualification(): ChatSession {
    const updatedState = SessionLeadQualificationService.startQualification(
      this.props.leadQualificationState
    );

    return new ChatSession({
      ...this.props,
      leadQualificationState: updatedState,
      lastActivityAt: new Date(),
    });
  }

  answerQualificationQuestion(
    questionId: string,
    question: string,
    answer: string | string[],
    scoringWeight: number
  ): ChatSession {
    const answeredQuestion = SessionLeadQualificationService.createAnsweredQuestion(
      questionId,
      question,
      answer,
      scoringWeight
    );

    const updatedState = SessionLeadQualificationService.addAnswer(
      this.props.leadQualificationState,
      answeredQuestion
    );

    return new ChatSession({
      ...this.props,
      leadQualificationState: updatedState,
      lastActivityAt: new Date(),
    });
  }

  completeLeadQualification(): ChatSession {
    const updatedState = SessionLeadQualificationService.completeQualification(
      this.props.leadQualificationState,
      this.props.contextData
    );

    return new ChatSession({
      ...this.props,
      leadQualificationState: updatedState,
      lastActivityAt: new Date(),
    });
  }

  skipLeadQualification(): ChatSession {
    const updatedState = SessionLeadQualificationService.skipQualification(
      this.props.leadQualificationState
    );

    return new ChatSession({
      ...this.props,
      leadQualificationState: updatedState,
      lastActivityAt: new Date(),
    });
  }

  // Update session context with new values (immutable)
  updateContextData(newContextData: Partial<SessionContext>): ChatSession {
    const updatedContext = SessionContextService.mergeContextData(
      this.props.contextData, 
      newContextData
    );
    
    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  markAsIdle(): ChatSession {
    const updatedProps = SessionStateService.markAsIdle(this.props);
    return new ChatSession(updatedProps);
  }

  markAsAbandoned(): ChatSession {
    const updatedProps = SessionStateService.markAsAbandoned(this.props);
    return new ChatSession(updatedProps);
  }

  end(): ChatSession {
    const updatedProps = SessionStateService.endSession(this.props);
    return new ChatSession(updatedProps);
  }

  isExpired(timeoutMinutes: number = 30): boolean {
    ChatSessionValidationService.validateTimeout(timeoutMinutes);
    
    // Check if lastActivityAt exceeds timeout threshold
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const now = new Date().getTime();
    return now - this.props.lastActivityAt.getTime() > timeoutMs;
  }

  getSessionDuration(): number {
    const endTime = this.props.endedAt || new Date();
    return endTime.getTime() - this.props.startedAt.getTime();
  }

  getSessionMetrics(): SessionMetrics {
    // Calculate session analytics metrics
    const endTime = this.props.endedAt || new Date();
    const duration = endTime.getTime() - this.props.startedAt.getTime();

    // Contact info is captured via accumulated entities system
    const hasContactInfo = this.props.contextData.accumulatedEntities?.visitorName?.value;

    return {
      duration,
      pageViewCount: this.props.contextData.pageViews.length,
      topicCount: this.props.contextData.topics.length,
      interestCount: this.props.contextData.interests.length,
      hasContactInfo: !!hasContactInfo
    };
  }

  hasContactInfo(): boolean {
    // Check if we have visitor identification in accumulated entities
    return !!this.props.contextData.accumulatedEntities?.visitorName?.value;
  }

  toPlainObject(): ChatSessionProps {
    return { ...this.props };
  }

  isOngoing(): boolean {
    return this.status === 'active';
  }
} 