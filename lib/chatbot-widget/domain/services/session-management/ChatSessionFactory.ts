import { ChatSessionProps, SessionContext } from '../../value-objects/session-management/ChatSessionTypes';

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
  static fromPersistenceData(data: any): ChatSessionProps {
    return {
      id: data.id,
      chatbotConfigId: data.chatbot_config_id,
      visitorId: data.visitor_id,
      sessionToken: data.session_token,
      contextData: this.parseContextData(data.context_data),
      leadQualificationState: this.parseQualificationState(data.lead_qualification_state),
      status: data.status,
      startedAt: new Date(data.started_at),
      lastActivityAt: new Date(data.last_activity_at),
      endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      referrerUrl: data.referrer_url,
      currentUrl: data.current_url,
    };
  }

  /**
   * Parse context data from persistence
   * AI INSTRUCTIONS: Handle enhanced conversationSummary format
   */
  private static parseContextData(data: any): SessionContext {
    // Handle conversationSummary format - use enhanced object format
    const conversationSummary = data.conversation_summary && typeof data.conversation_summary === 'object'
      ? data.conversation_summary
      : {
          fullSummary: data.conversation_summary || 'New conversation started',
          phaseSummaries: [],
          criticalMoments: []
        };

    return {
      previousVisits: data.previous_visits || 0,
      pageViews: data.page_views || [],
      conversationSummary,
      topics: data.topics || [],
      interests: data.interests || [],
      engagementScore: data.engagement_score || 0,
      journeyState: data.journey_state,
      accumulatedEntities: data.accumulated_entities || {
        decisionMakers: [],
        painPoints: [],
        integrationNeeds: [],
        evaluationCriteria: []
      }
    };
  }

  /** Parse qualification state from persistence
 */
  private static parseQualificationState(data: any) {
    return {
      isQualified: data.is_qualified || false,
      currentStep: data.current_step || 0,
      answeredQuestions: data.answered_questions || [],
      qualificationStatus: data.qualification_status || 'not_started',
      capturedAt: data.captured_at ? new Date(data.captured_at) : undefined,
    };
  }

  /** Convert session props to persistence format
 */
  static toPersistenceData(props: ChatSessionProps): any {
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

  /** Convert context to persistence format - MODERN: Use accumulated entities
 */
  private static contextToPersistence(context: SessionContext): any {
    return {
      // MODERN: Legacy fields removed, entity data is in accumulated_entities
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
  private static qualificationToPersistence(state: any): any {
    return {
      is_qualified: state.isQualified,
      current_step: state.currentStep,
      answered_questions: state.answeredQuestions,
      qualification_status: state.qualificationStatus,
      captured_at: state.capturedAt?.toISOString(),
    };
  }
} 