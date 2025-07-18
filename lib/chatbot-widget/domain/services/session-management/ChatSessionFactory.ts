import { ChatSessionProps, SessionContext, SessionStatus, LeadQualificationState, PageView } from '../../value-objects/session-management/ChatSessionTypes';

/**
 * Chat Session Factory Service
 * Domain Service: Pure business logic for creating chat sessions
 * Following DDD principles: Single responsibility for session creation
 */
export class ChatSessionFactory {
  
  /** Create new session properties
 */
  static createSessionProps(
    chatbotConfigId: string,
    visitorId: string,
    initialContext?: Partial<SessionContext>
  ): ChatSessionProps {
    const now = new Date();
    const sessionToken = crypto.randomUUID();
    
    return {
      id: crypto.randomUUID(),
      chatbotConfigId,
      visitorId,
      sessionToken,
      contextData: this.createInitialContext(initialContext),
      leadQualificationState: this.createInitialQualificationState(),
      status: 'active',
      startedAt: now,
      lastActivityAt: now,
    };
  }

  /**
   * Create initial session context
   * AI INSTRUCTIONS: Use enhanced conversationSummary format following @golden-rule patterns
   */
  private static createInitialContext(initialContext?: Partial<SessionContext>): SessionContext {
    return {
      previousVisits: 0,
      pageViews: [],
      conversationSummary: {
        fullSummary: 'New conversation started',
        phaseSummaries: [],
        criticalMoments: []
      },
      topics: [],
      interests: [],
      engagementScore: 0,
      accumulatedEntities: {
        decisionMakers: [],
        painPoints: [],
        integrationNeeds: [],
        evaluationCriteria: []
      },
      ...initialContext,
    };
  }

  /** Create initial lead qualification state
 */
  private static createInitialQualificationState() {
    return {
      isQualified: false,
      currentStep: 0,
      answeredQuestions: [],
      qualificationStatus: 'not_started' as const,
    };
  }

  /** Create session props from persistence data
 */
  static fromPersistenceData(data: Record<string, unknown>): ChatSessionProps {
    return {
      id: data.id as string,
      chatbotConfigId: data.chatbot_config_id as string,
      visitorId: data.visitor_id as string,
      sessionToken: data.session_token as string,
      contextData: this.parseContextData((data.context_data as Record<string, unknown>) || {}),
      leadQualificationState: this.parseQualificationState((data.lead_qualification_state as Record<string, unknown>) || {}),
      status: data.status as SessionStatus,
      startedAt: new Date(data.started_at as string),
      lastActivityAt: new Date(data.last_activity_at as string),
      endedAt: data.ended_at ? new Date(data.ended_at as string) : undefined,
      ipAddress: data.ip_address as string,
      userAgent: data.user_agent as string,
      referrerUrl: data.referrer_url as string,
      currentUrl: data.current_url as string,
    };
  }

  /**
   * Parse context data from persistence
   * AI INSTRUCTIONS: Handle enhanced conversationSummary format
   */
  private static parseContextData(data: Record<string, unknown>): SessionContext {
    // Handle conversationSummary format - use enhanced object format
    const conversationSummary = data.conversation_summary && typeof data.conversation_summary === 'object'
      ? data.conversation_summary
      : {
          fullSummary: data.conversation_summary || 'New conversation started',
          phaseSummaries: [],
          criticalMoments: []
        };

    return {
      previousVisits: (data.previous_visits as number) || 0,
      pageViews: (data.page_views as PageView[]) || [],
      conversationSummary: conversationSummary as SessionContext['conversationSummary'],
      topics: (data.topics as string[]) || [],
      interests: (data.interests as string[]) || [],
      engagementScore: (data.engagement_score as number) || 0,
      journeyState: (data.journey_state as SessionContext['journeyState']) || undefined,
      accumulatedEntities: (data.accumulated_entities as SessionContext['accumulatedEntities']) || {
        decisionMakers: [],
        painPoints: [],
        integrationNeeds: [],
        evaluationCriteria: []
      }
    };
  }

  /** Parse qualification state from persistence
 */
  private static parseQualificationState(data: Record<string, unknown>) {
    return {
      isQualified: (data.is_qualified as boolean) || false,
      currentStep: (data.current_step as number) || 0,
      answeredQuestions: (data.answered_questions as LeadQualificationState['answeredQuestions']) || [],
      qualificationStatus: (data.qualification_status as 'not_started' | 'in_progress' | 'completed' | 'skipped') || 'not_started',
      capturedAt: data.captured_at ? new Date(data.captured_at as string) : undefined,
    };
  }

  /** Convert session props to persistence format
 */
  static toPersistenceData(props: ChatSessionProps): Record<string, unknown> {
    return {
      id: props.id,
      chatbot_config_id: props.chatbotConfigId,
      visitor_id: props.visitorId,
      session_token: props.sessionToken,
      context_data: this.contextToPersistence(props.contextData),
      lead_qualification_state: this.qualificationToPersistence(props.leadQualificationState),
      status: props.status,
      started_at: props.startedAt.toISOString(),
      last_activity_at: props.lastActivityAt.toISOString(),
      ended_at: props.endedAt?.toISOString(),
      ip_address: props.ipAddress,
      user_agent: props.userAgent,
      referrer_url: props.referrerUrl,
      current_url: props.currentUrl,
    };
  }

  /** Convert context to persistence format */
  private static contextToPersistence(context: SessionContext): Record<string, unknown> {
    return {
      previous_visits: context.previousVisits,
      page_views: context.pageViews,
      conversation_summary: context.conversationSummary,
      topics: context.topics,
      interests: context.interests,
      engagement_score: context.engagementScore,
      journey_state: context.journeyState,
      accumulated_entities: context.accumulatedEntities,
    };
  }

  /** Convert qualification state to persistence format
 */
  private static qualificationToPersistence(state: LeadQualificationState): Record<string, unknown> {
    return {
      is_qualified: state.isQualified,
      current_step: state.currentStep,
      answered_questions: state.answeredQuestions,
      qualification_status: state.qualificationStatus,
      captured_at: (state.capturedAt as Date)?.toISOString(),
    };
  }
} 