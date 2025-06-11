export interface ChatSessionProps {
  id: string;
  chatbotConfigId: string;
  visitorId: string;
  sessionToken: string;
  contextData: SessionContext;
  leadQualificationState: LeadQualificationState;
  status: SessionStatus;
  startedAt: Date;
  lastActivityAt: Date;
  endedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  currentUrl?: string;
}

export interface SessionContext {
  visitorName?: string;
  email?: string;
  phone?: string;
  company?: string;
  previousVisits: number;
  pageViews: PageView[];
  conversationSummary: string;
  topics: string[];
  interests: string[];
  engagementScore: number;
}

export interface PageView {
  url: string;
  title: string;
  timestamp: Date;
  timeOnPage: number;
}

export interface LeadQualificationState {
  isQualified: boolean;
  currentStep: number;
  answeredQuestions: AnsweredQuestion[];
  leadScore: number;
  qualificationStatus: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  capturedAt?: Date;
}

export interface AnsweredQuestion {
  questionId: string;
  question: string;
  answer: string | string[];
  answeredAt: Date;
  scoringWeight: number;
}

export type SessionStatus = 'active' | 'idle' | 'completed' | 'abandoned' | 'ended';

export class ChatSession {
  private constructor(private readonly props: ChatSessionProps) {
    this.validateProps(props);
  }

  static create(
    chatbotConfigId: string,
    visitorId: string,
    initialContext?: Partial<SessionContext>
  ): ChatSession {
    const now = new Date();
    const sessionToken = crypto.randomUUID();
    
    return new ChatSession({
      id: crypto.randomUUID(),
      chatbotConfigId,
      visitorId,
      sessionToken,
      contextData: {
        previousVisits: 0,
        pageViews: [],
        conversationSummary: '',
        topics: [],
        interests: [],
        engagementScore: 0,
        ...initialContext,
      },
      leadQualificationState: {
        isQualified: false,
        currentStep: 0,
        answeredQuestions: [],
        leadScore: 0,
        qualificationStatus: 'not_started',
      },
      status: 'active',
      startedAt: now,
      lastActivityAt: now,
    });
  }

  static fromPersistence(props: ChatSessionProps): ChatSession {
    return new ChatSession(props);
  }

  private validateProps(props: ChatSessionProps): void {
    if (!props.chatbotConfigId?.trim()) {
      throw new Error('Chatbot config ID is required');
    }
    if (!props.visitorId?.trim()) {
      throw new Error('Visitor ID is required');
    }
    if (!props.sessionToken?.trim()) {
      throw new Error('Session token is required');
    }
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
    return new ChatSession({
      ...this.props,
      lastActivityAt: new Date(),
      status: this.props.status === 'idle' ? 'active' : this.props.status,
    });
  }

  addPageView(url: string, title: string, timeOnPage: number = 0): ChatSession {
    const pageView: PageView = {
      url,
      title,
      timestamp: new Date(),
      timeOnPage,
    };

    const updatedContext: SessionContext = {
      ...this.props.contextData,
      pageViews: [...this.props.contextData.pageViews, pageView],
    };

    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      currentUrl: url,
      lastActivityAt: new Date(),
    });
  }

  updateConversationSummary(summary: string): ChatSession {
    const updatedContext: SessionContext = {
      ...this.props.contextData,
      conversationSummary: summary,
    };

    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  addTopic(topic: string): ChatSession {
    if (this.props.contextData.topics.includes(topic)) {
      return this;
    }

    const updatedContext: SessionContext = {
      ...this.props.contextData,
      topics: [...this.props.contextData.topics, topic],
    };

    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  addInterest(interest: string): ChatSession {
    if (this.props.contextData.interests.includes(interest)) {
      return this;
    }

    const updatedContext: SessionContext = {
      ...this.props.contextData,
      interests: [...this.props.contextData.interests, interest],
    };

    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  updateEngagementScore(score: number): ChatSession {
    const clampedScore = Math.max(0, Math.min(100, score));
    
    const updatedContext: SessionContext = {
      ...this.props.contextData,
      engagementScore: clampedScore,
    };

    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  startLeadQualification(): ChatSession {
    const updatedState: LeadQualificationState = {
      ...this.props.leadQualificationState,
      qualificationStatus: 'in_progress',
      currentStep: 0,
    };

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
    const answeredQuestion: AnsweredQuestion = {
      questionId,
      question,
      answer,
      answeredAt: new Date(),
      scoringWeight,
    };

    const existingAnswers = this.props.leadQualificationState.answeredQuestions.filter(
      q => q.questionId !== questionId
    );

    const updatedState: LeadQualificationState = {
      ...this.props.leadQualificationState,
      answeredQuestions: [...existingAnswers, answeredQuestion],
      currentStep: this.props.leadQualificationState.currentStep + 1,
    };

    return new ChatSession({
      ...this.props,
      leadQualificationState: updatedState,
      lastActivityAt: new Date(),
    });
  }

  calculateLeadScore(): number {
    const { answeredQuestions } = this.props.leadQualificationState;
    
    if (answeredQuestions.length === 0) {
      return 0;
    }

    // Base score calculation
    let totalScore = 0;
    let totalWeight = 0;

    answeredQuestions.forEach(answer => {
      totalWeight += answer.scoringWeight;
      
      // Simple scoring logic - can be enhanced based on answer content
      if (Array.isArray(answer.answer)) {
        totalScore += answer.answer.length > 0 ? answer.scoringWeight : 0;
      } else {
        totalScore += answer.answer.trim().length > 0 ? answer.scoringWeight : 0;
      }
    });

    // Add engagement score factor
    const engagementFactor = this.props.contextData.engagementScore / 100;
    const baseScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    
    return Math.round(baseScore * (0.7 + 0.3 * engagementFactor));
  }

  completeLeadQualification(): ChatSession {
    const leadScore = this.calculateLeadScore();
    
    const updatedState: LeadQualificationState = {
      ...this.props.leadQualificationState,
      qualificationStatus: 'completed',
      leadScore,
      isQualified: leadScore >= 60, // 60% threshold for qualification
      capturedAt: new Date(),
    };

    return new ChatSession({
      ...this.props,
      leadQualificationState: updatedState,
      lastActivityAt: new Date(),
    });
  }

  skipLeadQualification(): ChatSession {
    const updatedState: LeadQualificationState = {
      ...this.props.leadQualificationState,
      qualificationStatus: 'skipped',
    };

    return new ChatSession({
      ...this.props,
      leadQualificationState: updatedState,
      lastActivityAt: new Date(),
    });
  }

  captureContactInfo(email?: string, phone?: string, name?: string, company?: string): ChatSession {
    const updatedContext: SessionContext = {
      ...this.props.contextData,
      email: email || this.props.contextData.email,
      phone: phone || this.props.contextData.phone,
      visitorName: name || this.props.contextData.visitorName,
      company: company || this.props.contextData.company,
    };

    return new ChatSession({
      ...this.props,
      contextData: updatedContext,
      lastActivityAt: new Date(),
    });
  }

  markAsIdle(): ChatSession {
    return new ChatSession({
      ...this.props,
      status: 'idle',
      lastActivityAt: new Date(),
    });
  }

  markAsAbandoned(): ChatSession {
    return new ChatSession({
      ...this.props,
      status: 'abandoned',
      endedAt: new Date(),
    });
  }

  end(): ChatSession {
    return new ChatSession({
      ...this.props,
      status: 'ended',
      endedAt: new Date(),
    });
  }

  isExpired(timeoutMinutes: number = 30): boolean {
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const now = new Date().getTime();
    return now - this.props.lastActivityAt.getTime() > timeoutMs;
  }

  getSessionDuration(): number {
    const endTime = this.props.endedAt || new Date();
    return endTime.getTime() - this.props.startedAt.getTime();
  }

  hasContactInfo(): boolean {
    return !!(this.props.contextData.email || this.props.contextData.phone);
  }

  toPlainObject(): ChatSessionProps {
    return { ...this.props };
  }
} 