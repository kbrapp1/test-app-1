import { Lead, LeadProps, ContactInfo, LeadSource, QualificationStatus, FollowUpStatus, QualificationData, LeadNote } from '../../../../domain/entities/Lead';

/**
 * Raw database record structure from Supabase
 */
export interface RawLeadDbRecord {
  id: string;
  organization_id: string;
  session_id: string;
  chatbot_config_id: string;
  contact_info: any; // JSONB
  qualification_data: any; // JSONB
  source: any; // JSONB
  lead_score: number;
  qualification_status: string;
  conversation_summary: string;
  follow_up_status: string;
  assigned_to: string | null;
  tags: string[];
  notes: any; // JSONB array
  captured_at: string;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insert data structure for database operations
 */
export interface InsertLeadData {
  id: string;
  organization_id: string;
  session_id: string;
  chatbot_config_id: string;
  contact_info: any;
  qualification_data: any;
  source: any;
  lead_score: number;
  qualification_status: string;
  conversation_summary: string;
  follow_up_status: string;
  assigned_to?: string;
  tags: string[];
  notes: any;
  captured_at: string;
  last_contacted_at?: string;
}

/**
 * Update data structure for database operations
 */
export interface UpdateLeadData {
  contact_info?: any;
  qualification_data?: any;
  lead_score?: number;
  qualification_status?: string;
  conversation_summary?: string;
  follow_up_status?: string;
  assigned_to?: string;
  tags?: string[];
  notes?: any;
  last_contacted_at?: string;
  updated_at?: string;
}

/**
 * Lead Domain-Database Mapper
 * Handles transformation between domain entities and database records
 */
export class LeadMapper {
  /**
   * Transform database record to domain entity
   */
  static toDomain(record: RawLeadDbRecord): Lead {
    const props: LeadProps = {
      id: record.id,
      organizationId: record.organization_id,
      sessionId: record.session_id,
      chatbotConfigId: record.chatbot_config_id,
      contactInfo: this.mapContactInfo(record.contact_info),
      qualificationData: this.mapQualificationData(record.qualification_data),
      source: this.mapSource(record.source),
      leadScore: record.lead_score,
      qualificationStatus: record.qualification_status as QualificationStatus,
      conversationSummary: record.conversation_summary,
      followUpStatus: record.follow_up_status as FollowUpStatus,
      assignedTo: record.assigned_to || undefined,
      tags: record.tags || [],
      notes: this.mapNotes(record.notes),
      capturedAt: new Date(record.captured_at),
      lastContactedAt: record.last_contacted_at ? new Date(record.last_contacted_at) : undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };

    return Lead.fromPersistence(props);
  }

  /**
   * Transform domain entity to insert data
   */
  static toInsert(lead: Lead): InsertLeadData {
    return {
      id: lead.id,
      organization_id: lead.organizationId,
      session_id: lead.sessionId,
      chatbot_config_id: lead.chatbotConfigId,
      contact_info: lead.contactInfo,
      qualification_data: lead.qualificationData,
      source: lead.source,
      lead_score: lead.leadScore,
      qualification_status: lead.qualificationStatus,
      conversation_summary: lead.conversationSummary,
      follow_up_status: lead.followUpStatus,
      assigned_to: lead.assignedTo,
      tags: lead.tags,
      notes: lead.notes,
      captured_at: lead.capturedAt.toISOString(),
      last_contacted_at: lead.lastContactedAt?.toISOString(),
    };
  }

  /**
   * Transform domain entity to update data
   */
  static toUpdate(lead: Lead): UpdateLeadData {
    return {
      contact_info: lead.contactInfo,
      qualification_data: lead.qualificationData,
      lead_score: lead.leadScore,
      qualification_status: lead.qualificationStatus,
      conversation_summary: lead.conversationSummary,
      follow_up_status: lead.followUpStatus,
      assigned_to: lead.assignedTo,
      tags: lead.tags,
      notes: lead.notes,
      last_contacted_at: lead.lastContactedAt?.toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Map JSONB contact info to domain object
   */
  private static mapContactInfo(data: any): ContactInfo {
    return {
      name: data?.name || undefined,
      firstName: data?.firstName || undefined,
      lastName: data?.lastName || undefined,
      email: data?.email || undefined,
      phone: data?.phone || undefined,
      company: data?.company || undefined,
      jobTitle: data?.jobTitle || undefined,
      website: data?.website || undefined,
      linkedin: data?.linkedin || undefined,
      address: data?.address ? {
        street: data.address.street || undefined,
        city: data.address.city || undefined,
        state: data.address.state || undefined,
        zipCode: data.address.zipCode || undefined,
        country: data.address.country || undefined,
      } : undefined,
    };
  }

  /**
   * Map JSONB qualification data to domain object
   */
  private static mapQualificationData(data: any): QualificationData {
    return {
      budget: data?.budget || undefined,
      timeline: data?.timeline || undefined,
      decisionMaker: data?.decisionMaker || undefined,
      companySize: data?.companySize || undefined,
      industry: data?.industry || undefined,
      currentSolution: data?.currentSolution || undefined,
      painPoints: data?.painPoints || [],
      interests: data?.interests || [],
      answeredQuestions: (data?.answeredQuestions || []).map((q: any) => ({
        questionId: q.questionId,
        question: q.question,
        answer: q.answer,
        answeredAt: new Date(q.answeredAt),
        scoringWeight: q.scoringWeight,
        scoreContribution: q.scoreContribution,
      })),
      engagementLevel: data?.engagementLevel || 'low',
    };
  }

  /**
   * Map JSONB source to domain object
   */
  private static mapSource(data: any): LeadSource {
    return {
      channel: data?.channel || 'chatbot_widget',
      campaign: data?.campaign || undefined,
      referrer: data?.referrer || undefined,
      utmSource: data?.utmSource || undefined,
      utmMedium: data?.utmMedium || undefined,
      utmCampaign: data?.utmCampaign || undefined,
      pageUrl: data?.pageUrl || '',
      pageTitle: data?.pageTitle || undefined,
    };
  }

  /**
   * Map JSONB notes array to domain objects
   */
  private static mapNotes(data: any): LeadNote[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((note: any) => ({
      id: note.id,
      content: note.content,
      authorId: note.authorId,
      authorName: note.authorName,
      createdAt: new Date(note.createdAt),
      isInternal: note.isInternal || true,
    }));
  }
} 