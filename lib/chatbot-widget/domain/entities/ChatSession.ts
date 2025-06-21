import { 
  ChatSessionProps, 
  SessionContext, 
  LeadQualificationState,
  SessionStatus,
  ContactInfo,
  SessionMetrics
} from '../value-objects/session-management/ChatSessionTypes';

// Re-export types for external use
export type {
  ChatSessionProps,
  SessionContext,
  LeadQualificationState,
  SessionStatus,
  ContactInfo,
  SessionMetrics
};
import { ChatSessionValidationService } from '../services/session-management/ChatSessionValidationService';
import { SessionLeadQualificationService } from '../services/session-management/SessionLeadQualificationService';
import { SessionStateService } from '../services/session-management/SessionStateService';
import { SessionContextService } from '../services/session-management/SessionContextService';
import { ChatSessionFactory } from '../services/session-management/ChatSessionFactory';

/**
 * Chat Session Entity
 * Following DDD principles: Pure entity with business logic delegated to domain services
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

  captureContactInfo(contactInfo: ContactInfo): ChatSession {
    const updatedContext = SessionContextService.updateContactInfo(this.props.contextData, contactInfo);
    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  /**
   * Update session context data with new values
   * AI INSTRUCTIONS:
   * - Pure entity method following @golden-rule immutability
   * - Always return new instance, never mutate existing
   * - Update lastActivityAt timestamp
   * - Delegate validation to domain services
   */
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
    
    // AI INSTRUCTIONS: Inline session expiration logic following @golden-rule pure function pattern
    // Domain logic: Session expires when lastActivityAt exceeds timeout threshold
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const now = new Date().getTime();
    return now - this.props.lastActivityAt.getTime() > timeoutMs;
  }

  getSessionDuration(): number {
    const endTime = this.props.endedAt || new Date();
    return endTime.getTime() - this.props.startedAt.getTime();
  }

  getSessionMetrics(): SessionMetrics {
    // AI INSTRUCTIONS: Inline session metrics calculation following @golden-rule domain patterns
    // Pure business logic for calculating session analytics
    const endTime = this.props.endedAt || new Date();
    const duration = endTime.getTime() - this.props.startedAt.getTime();

    return {
      duration,
      pageViewCount: this.props.contextData.pageViews.length,
      topicCount: this.props.contextData.topics.length,
      interestCount: this.props.contextData.interests.length,
      hasContactInfo: !!(this.props.contextData.email || this.props.contextData.phone)
    };
  }

  hasContactInfo(): boolean {
    return !!(this.props.contextData.email || this.props.contextData.phone);
  }

  toPlainObject(): ChatSessionProps {
    return { ...this.props };
  }

  updateVisitorName(name: string): ChatSession {
    const newContextData = { ...this.props.contextData, visitorName: name };
    return new ChatSession({ ...this.props, contextData: newContextData, lastActivityAt: new Date() });
  }

  updateCompany(company: string): ChatSession {
    const newContextData = { ...this.props.contextData, company: company };
    return new ChatSession({ ...this.props, contextData: newContextData, lastActivityAt: new Date() });
  }

  isOngoing(): boolean {
    return this.status === 'active';
  }
} 