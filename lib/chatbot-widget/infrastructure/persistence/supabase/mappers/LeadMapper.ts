/**
 * Lead Domain-Database Mapper
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead entity mapping only
 * - Handle transformation between domain and database
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines
 * - UPDATED: Removed LeadScoringService dependency - using API-only approach
 * - Lead scores are now stored as provided by external API
 */

import { Lead } from '../../../../domain/entities/Lead';
import { ContactInfo } from '../../../../domain/value-objects/lead-management/ContactInfo';
import { LeadSource } from '../../../../domain/value-objects/lead-management/LeadSource';
import { QualificationData } from '../../../../domain/value-objects/lead-management/QualificationData';
import { LeadMetadata, LeadNote } from '../../../../domain/value-objects/lead-management/LeadMetadata';
import { FollowUpStatus } from '../../../../domain/entities/LeadLifecycleManager';

// Define QualificationStatus locally since we removed LeadScoringService
export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

// JSONB Database Interfaces matching actual schema
interface ContactInfoJsonb {
  name?: string;
  firstName?: string; 
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  linkedin?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

interface QualificationDataJsonb {
  answeredQuestions: Array<{
    questionId: string;
    question: string;
    answer: string; // Domain allows string | string[], but JSONB stores as string
    answeredAt: string; // ISO date
    scoringWeight?: number; // Optional in JSONB, required in domain
    scoreContribution?: number; // Optional in JSONB, required in domain
  }>;
  engagementLevel: 'low' | 'medium' | 'high';
  budget?: string | null;
  timeline?: string | null;
  decisionMaker?: boolean | null;
  currentSolution?: string | null;
  painPoints: string[];
  industry?: string | null;
  companySize?: string | null;
}

interface SourceJsonb {
  type: 'chatbot' | 'form' | 'api';
  chatbotName?: string | null;
  referrerUrl?: string | null;
  campaignSource?: string | null;
  medium: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface LeadNoteJsonb {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  isInternal: boolean;
  createdAt: string; // ISO date
}

/** Raw database record structure from Supabase */
export interface RawLeadDbRecord {
  id: string;
  organization_id: string;
  session_id: string;
  chatbot_config_id: string;
  contact_info: ContactInfoJsonb;
  qualification_data: QualificationDataJsonb;
  source: SourceJsonb;
  lead_score: number;
  qualification_status: string;
  conversation_summary: string;
  follow_up_status: string;
  assigned_to: string | null;
  tags: string[];
  notes: LeadNoteJsonb[];
  captured_at: string;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Insert data structure for database operations */
export interface InsertLeadData {
  id: string;
  organization_id: string;
  session_id: string;
  chatbot_config_id: string;
  contact_info: ContactInfoJsonb;
  qualification_data: QualificationDataJsonb;
  source: SourceJsonb;
  lead_score: number;
  qualification_status: string;
  conversation_summary: string;
  follow_up_status: string;
  assigned_to?: string;
  tags: string[];
  notes: LeadNoteJsonb[];
  captured_at: string;
  last_contacted_at?: string;
}

/** Update data structure for database operations */
export interface UpdateLeadData {
  contact_info?: ContactInfoJsonb;
  qualification_data?: QualificationDataJsonb;
  lead_score?: number;
  qualification_status?: string;
  conversation_summary?: string;
  follow_up_status?: string;
  assigned_to?: string;
  tags?: string[];
  notes?: LeadNoteJsonb[];
  last_contacted_at?: string;
  updated_at?: string;
}

/**
 * Lead Domain-Database Mapper
 * Handles transformation between domain entities and database records
 */
export class LeadMapper {
  /** Transform database record to domain entity */
  static toDomain(record: RawLeadDbRecord): Lead {
    const props = {
      id: record.id,
      organizationId: record.organization_id,
      sessionId: record.session_id,
      chatbotConfigId: record.chatbot_config_id,
      contactInfo: this.mapContactInfo(record.contact_info),
      qualificationData: this.mapQualificationData(record.qualification_data),
      source: this.mapSource(record.source),
      metadata: this.mapMetadata(record.conversation_summary, record.tags, record.notes),
      leadScore: record.lead_score,
      qualificationStatus: record.qualification_status as QualificationStatus,
      followUpStatus: record.follow_up_status as FollowUpStatus,
      assignedTo: record.assigned_to || undefined,
      capturedAt: new Date(record.captured_at),
      lastContactedAt: record.last_contacted_at ? new Date(record.last_contacted_at) : undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };

    return Lead.fromPersistence(props);
  }

  /** Transform domain entity to insert data */
  static toInsert(lead: Lead): InsertLeadData {
    return {
      id: lead.id,
      organization_id: lead.organizationId,
      session_id: lead.sessionId,
      chatbot_config_id: lead.chatbotConfigId,
      contact_info: this.domainContactInfoToJsonb(lead.contactInfo),
      qualification_data: this.domainQualificationDataToJsonb(lead.qualificationData),
      source: this.domainSourceToJsonb(lead.source),
      lead_score: lead.leadScore,
      qualification_status: lead.qualificationStatus,
      conversation_summary: lead.conversationSummary,
      follow_up_status: lead.followUpStatus,
      assigned_to: lead.assignedTo,
      tags: lead.tags,
      notes: this.domainNotesToJsonb(lead.notes),
      captured_at: lead.capturedAt.toISOString(),
      last_contacted_at: lead.lastContactedAt?.toISOString(),
    };
  }

  /** Transform domain entity to update data */
  static toUpdate(lead: Lead): UpdateLeadData {
    return {
      contact_info: this.domainContactInfoToJsonb(lead.contactInfo),
      qualification_data: this.domainQualificationDataToJsonb(lead.qualificationData),
      lead_score: lead.leadScore,
      qualification_status: lead.qualificationStatus,
      conversation_summary: lead.conversationSummary,
      follow_up_status: lead.followUpStatus,
      assigned_to: lead.assignedTo,
      tags: lead.tags,
      notes: this.domainNotesToJsonb(lead.notes),
      last_contacted_at: lead.lastContactedAt?.toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /** Map JSONB contact info to domain props */
  private static mapContactInfo(data: ContactInfoJsonb) {
    return {
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      jobTitle: data.jobTitle,
      website: data.website,
      linkedin: data.linkedin,
      address: data.address ? {
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipCode,
        country: data.address.country,
      } : undefined,
    };
  }

  /** Map JSONB qualification data to domain props */
  private static mapQualificationData(data: QualificationDataJsonb) {
    return {
      budget: data.budget || undefined,
      timeline: data.timeline || undefined,
      decisionMaker: data.decisionMaker || undefined,
      companySize: data.companySize || undefined,
      industry: data.industry || undefined,
      currentSolution: data.currentSolution || undefined,
      painPoints: data.painPoints || [],
      interests: [], // Not in JSONB schema, defaulting to empty
      answeredQuestions: (data.answeredQuestions || []).map(q => ({
        questionId: q.questionId,
        question: q.question,
        answer: q.answer, // Keep as string to match JSONB
        answeredAt: new Date(q.answeredAt),
        scoringWeight: q.scoringWeight || 0, // Provide default for required field
        scoreContribution: q.scoreContribution || 0, // Provide default for required field
      })),
      engagementLevel: data.engagementLevel || 'low',
    };
  }

  /** Map JSONB source to domain props */
  private static mapSource(data: SourceJsonb) {
    // Transform database schema to domain schema
    return {
      channel: 'chatbot_widget' as const,
      campaign: data.campaignSource || undefined,
      referrer: data.referrerUrl || undefined,
      utmSource: undefined, // Not stored in current JSONB schema
      utmMedium: data.medium || undefined,
      utmCampaign: data.campaignSource || undefined,
      pageUrl: data.referrerUrl || 'https://example.com', // Required field, provide fallback
      pageTitle: data.chatbotName || undefined,
    };
  }

  /** Map metadata fields to domain props */
  private static mapMetadata(conversationSummary: string, tags: string[], notes: LeadNoteJsonb[]) {
    return {
      conversationSummary: conversationSummary || '',
      tags: tags || [],
      notes: this.mapNotes(notes),
    };
  }

  /** Map JSONB notes to domain LeadNote objects */
  private static mapNotes(data: LeadNoteJsonb[]): LeadNote[] {
    if (!Array.isArray(data)) return [];
    
    return data.map(note => ({
      id: note.id,
      content: note.content,
      authorId: note.authorId,
      authorName: note.authorName,
      isInternal: note.isInternal,
      createdAt: new Date(note.createdAt),
    }));
  }

  /** Transform domain ContactInfo to JSONB */
  private static domainContactInfoToJsonb(contactInfo: ContactInfo): ContactInfoJsonb {
    const props = contactInfo.toPlainObject();
    return {
      name: props.name,
      firstName: props.firstName,
      lastName: props.lastName,
      email: props.email,
      phone: props.phone,
      company: props.company,
      jobTitle: props.jobTitle,
      website: props.website,
      linkedin: props.linkedin,
      address: props.address ? {
        street: props.address.street,
        city: props.address.city,
        state: props.address.state,
        zipCode: props.address.zipCode,
        country: props.address.country,
      } : undefined,
    };
  }

  /** Transform domain QualificationData to JSONB */
  private static domainQualificationDataToJsonb(qualificationData: QualificationData): QualificationDataJsonb {
    const props = qualificationData.toPlainObject();
    return {
      answeredQuestions: (props.answeredQuestions || []).map(q => ({
        questionId: q.questionId,
        question: q.question,
        answer: Array.isArray(q.answer) ? q.answer.join(', ') : q.answer, // Convert array to string
        answeredAt: q.answeredAt.toISOString(),
        scoringWeight: q.scoringWeight,
        scoreContribution: q.scoreContribution,
      })),
      engagementLevel: props.engagementLevel || 'low',
      budget: props.budget || null,
      timeline: props.timeline || null,
      decisionMaker: props.decisionMaker || null,
      currentSolution: props.currentSolution || null,
      painPoints: props.painPoints || [],
      industry: props.industry || null,
      companySize: props.companySize || null,
    };
  }

  /** Transform domain LeadSource to JSONB */
  private static domainSourceToJsonb(source: LeadSource): SourceJsonb {
    const props = source.toPlainObject();
    // Transform domain schema to database schema
    return {
      type: 'chatbot',
      chatbotName: props.pageTitle || null,
      referrerUrl: props.referrer || props.pageUrl || null,
      campaignSource: props.campaign || props.utmCampaign || null,
      medium: props.utmMedium || 'chat',
      ipAddress: null, // Not available in domain
      userAgent: null, // Not available in domain
    };
  }

  /** Transform domain LeadNote array to JSONB */
  private static domainNotesToJsonb(notes: LeadNote[]): LeadNoteJsonb[] {
    return notes.map(note => ({
      id: note.id,
      content: note.content,
      authorId: note.authorId,
      authorName: note.authorName,
      isInternal: note.isInternal,
      createdAt: note.createdAt.toISOString(),
    }));
  }
} 