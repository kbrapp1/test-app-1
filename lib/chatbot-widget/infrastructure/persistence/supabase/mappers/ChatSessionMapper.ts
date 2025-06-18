import { ChatSession, ChatSessionProps, SessionContext, LeadQualificationState, SessionStatus } from '../../../../domain/entities/ChatSession';

/**
 * Raw database record structure from Supabase
 */
export interface RawChatSessionDbRecord {
  id: string;
  chatbot_config_id: string;
  visitor_id: string;
  session_token: string;
  context_data: any; // JSONB
  lead_qualification_state: any; // JSONB
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

/**
 * Insert data structure for database operations
 */
export interface InsertChatSessionData {
  id: string;
  chatbot_config_id: string;
  visitor_id: string;
  session_token: string;
  context_data: any;
  lead_qualification_state: any;
  status: string;
  started_at: string;
  last_activity_at: string;
  ended_at?: string;
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  current_url?: string;
}

/**
 * Update data structure for database operations
 */
export interface UpdateChatSessionData {
  context_data?: any;
  lead_qualification_state?: any;
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
  /**
   * Transform database record to domain entity
   */
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

  /**
   * Transform domain entity to insert data
   */
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

  /**
   * Transform domain entity to update data
   */
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

  /**
   * Map JSONB context data to domain object
   */
  private static mapContextData(data: any): SessionContext {
    return {
      visitorName: data?.visitorName || null,
      email: data?.email || null,
      phone: data?.phone || null,
      company: data?.company || null,
      previousVisits: data?.previousVisits || 0,
      pageViews: data?.pageViews || [],
      conversationSummary: data?.conversationSummary || '',
      topics: data?.topics || [],
      interests: data?.interests || [],
      engagementScore: data?.engagementScore || 50,
    };
  }

  /**
   * Map JSONB lead qualification state to domain object
   */
  private static mapLeadQualificationState(data: any): LeadQualificationState {
    return {
      currentStep: data?.currentStep || 0,
      answeredQuestions: data?.answeredQuestions || [],
      qualificationStatus: data?.qualificationStatus || 'not_started',
      isQualified: data?.isQualified || false,
      leadScore: data?.leadScore || 0,
      capturedAt: data?.capturedAt ? new Date(data.capturedAt) : undefined,
    };
  }
} 