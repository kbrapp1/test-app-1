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
import { LeadNote } from '../../../../domain/value-objects/lead-management/LeadMetadata';
import { FollowUpStatus } from '../../../../domain/entities/LeadLifecycleManager';
import { ContactInfoDatabaseMapper, ContactInfoJsonb } from './ContactInfoDatabaseMapper';
import { QualificationDataDatabaseMapper, QualificationDataJsonb } from './QualificationDataDatabaseMapper';
import { LeadSourceDatabaseMapper, SourceJsonb } from './LeadSourceDatabaseMapper';

// Define QualificationStatus locally since we removed LeadScoringService
export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

// JSONB Database Interface for LeadNote
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
      contactInfo: ContactInfoDatabaseMapper.mapContactInfo(record.contact_info),
      qualificationData: QualificationDataDatabaseMapper.mapQualificationData(record.qualification_data),
      source: LeadSourceDatabaseMapper.mapSource(record.source),
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
      contact_info: ContactInfoDatabaseMapper.domainContactInfoToJsonb(lead.contactInfo),
      qualification_data: QualificationDataDatabaseMapper.domainQualificationDataToJsonb(lead.qualificationData),
      source: LeadSourceDatabaseMapper.domainSourceToJsonb(lead.source),
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
      contact_info: ContactInfoDatabaseMapper.domainContactInfoToJsonb(lead.contactInfo),
      qualification_data: QualificationDataDatabaseMapper.domainQualificationDataToJsonb(lead.qualificationData),
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