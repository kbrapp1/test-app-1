import { ChatSession, ChatSessionProps, SessionContext, LeadQualificationState, SessionStatus } from '../../../../domain/entities/ChatSession';
import { AnsweredQuestion } from '../../../../domain/value-objects/session-management/ChatSessionTypes';

/** Raw database record structure from Supabase */
export interface RawChatSessionDbRecord {
  id: string;
  chatbot_config_id: string;
  visitor_id: string;
  session_token: string;
  context_data: unknown; // JSONB
  lead_qualification_state: unknown; // JSONB
  status: string;
  started_at: string;
  last_activity_at: string;
  ended_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer_url: string | null;
  current_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Insert data structure for database operations */
export interface InsertChatSessionData {
  id: string;
  chatbot_config_id: string;
  visitor_id: string;
  session_token: string;
  context_data: unknown;
  lead_qualification_state: unknown;
  status: string;
  started_at: string;
  last_activity_at: string;
  ended_at?: string;
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  current_url?: string;
}

/** Update data structure for database operations */
export interface UpdateChatSessionData {
  context_data?: unknown;
  lead_qualification_state?: unknown;
  status?: string;
  last_activity_at?: string;
  ended_at?: string;
  current_url?: string;
  updated_at?: string;
}

/**
 * ChatSession Domain-Database Mapper
 * Handles transformation between domain entities and database records
 */
export class ChatSessionMapper {
  /** Transform database record to domain entity */
  static toDomain(record: RawChatSessionDbRecord): ChatSession {
    const props: ChatSessionProps = {
      id: record.id,
      chatbotConfigId: record.chatbot_config_id,
      visitorId: record.visitor_id,
      sessionToken: record.session_token,
      contextData: this.mapContextData(record.context_data),
      leadQualificationState: this.mapLeadQualificationState(record.lead_qualification_state),
      status: record.status as SessionStatus,
      startedAt: new Date(record.started_at),
      lastActivityAt: new Date(record.last_activity_at),
      endedAt: record.ended_at ? new Date(record.ended_at) : undefined,
      ipAddress: record.ip_address || undefined,
      userAgent: record.user_agent || undefined,
      referrerUrl: record.referrer_url || undefined,
      currentUrl: record.current_url || undefined,
    };

    return ChatSession.fromPersistence(props);
  }

  /** Transform domain entity to insert data */
  static toInsert(session: ChatSession): InsertChatSessionData {
    return {
      id: session.id,
      chatbot_config_id: session.chatbotConfigId,
      visitor_id: session.visitorId,
      session_token: session.sessionToken,
      context_data: session.contextData,
      lead_qualification_state: session.leadQualificationState,
      status: session.status,
      started_at: session.startedAt.toISOString(),
      last_activity_at: session.lastActivityAt.toISOString(),
      ended_at: session.endedAt?.toISOString(),
      ip_address: session.ipAddress,
      user_agent: session.userAgent,
      referrer_url: session.referrerUrl,
      current_url: session.currentUrl,
    };
  }

  /** Transform domain entity to update data */
  static toUpdate(session: ChatSession): UpdateChatSessionData {
    return {
      context_data: session.contextData,
      lead_qualification_state: session.leadQualificationState,
      status: session.status,
      last_activity_at: session.lastActivityAt.toISOString(),
      ended_at: session.endedAt?.toISOString(),
      current_url: session.currentUrl,
      updated_at: new Date().toISOString(),
    };
  }

  /** Map JSONB context data to domain object - MODERN: Use accumulated entities */
  private static mapContextData(data: unknown): SessionContext {
    const context = data as Record<string, unknown> | null | undefined;
    return {
      previousVisits: context?.previousVisits as number || 0,
      pageViews: ((context?.pageViews as Array<{ url: string; title: string; timestamp: string; timeOnPage: number }>) || []).map(pv => ({
        ...pv,
        timestamp: new Date(pv.timestamp)
      })),
      conversationSummary: {
        fullSummary: (context?.conversationSummary as string) || ''
      },
      topics: context?.topics as string[] || [],
      interests: context?.interests as string[] || [],
      engagementScore: context?.engagementScore as number || 50,
      // MODERN: Legacy fields removed, entity data is in accumulated entities
      accumulatedEntities: (context?.accumulatedEntities as SessionContext['accumulatedEntities']) || {
        decisionMakers: [],
        painPoints: [],
        integrationNeeds: [],
        evaluationCriteria: []
      }
    };
  }

  /** Map JSONB lead qualification state to domain object */
  private static mapLeadQualificationState(data: unknown): LeadQualificationState {
    const state = data as Record<string, unknown> | null | undefined;
    return {
      currentStep: state?.currentStep as number || 0,
      answeredQuestions: (state?.answeredQuestions as AnsweredQuestion[]) || [],
      qualificationStatus: (state?.qualificationStatus as 'not_started' | 'in_progress' | 'completed' | 'skipped') || 'not_started',
      isQualified: state?.isQualified as boolean || false,
      capturedAt: state?.capturedAt ? new Date(state.capturedAt as string) : undefined,
    };
  }
} 