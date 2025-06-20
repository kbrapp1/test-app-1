/**
 * Lead Domain Entity
 * 
 * Domain Entity: Core lead business object with identity
 * Single Responsibility: Lead coordination and core business logic
 * Following DDD entity patterns with value objects and domain services
 * 
 * AI INSTRUCTIONS:
 * - UPDATED: Removed domain lead scoring - using API-only approach
 * - Lead score is now provided externally (from API) not calculated internally
 * - Keep under 250 lines following @golden-rule patterns
 */

import { ContactInfo, ContactInfoProps } from '../value-objects/lead-management/ContactInfo';
import { QualificationData, QualificationDataProps } from '../value-objects/lead-management/QualificationData';
import { LeadSource, LeadSourceProps } from '../value-objects/lead-management/LeadSource';
import { LeadMetadata, LeadMetadataProps, LeadNote } from '../value-objects/lead-management/LeadMetadata';
import { LeadLifecycleManager, FollowUpStatus, LeadLifecycleState } from './LeadLifecycleManager';
import { LeadExportService } from '../services/lead-management/LeadExportService';
import { LeadQueryService } from '../services/lead-management/LeadQueryService';
import { LeadBusinessService } from '../services/lead-management/LeadBusinessService';

// Define QualificationStatus locally since we removed LeadScoringService
export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

export interface LeadProps {
  id: string;
  sessionId: string;
  organizationId: string;
  chatbotConfigId: string;
  contactInfo: ContactInfo;
  qualificationData: QualificationData;
  leadScore: number;
  qualificationStatus: QualificationStatus;
  source: LeadSource;
  metadata: LeadMetadata;
  capturedAt: Date;
  followUpStatus: FollowUpStatus;
  assignedTo?: string;
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Lead {
  private constructor(private readonly props: LeadProps) {
    this.validateProps(props);
  }

  static create(
    sessionId: string,
    organizationId: string,
    chatbotConfigId: string,
    contactInfoProps: ContactInfoProps,
    qualificationDataProps: QualificationDataProps,
    sourceProps: LeadSourceProps,
    conversationSummary: string,
    leadScore: number = 0,
    qualificationStatus: QualificationStatus = 'not_qualified'
  ): Lead {
    const contactInfo = ContactInfo.create(contactInfoProps);
    const qualificationData = QualificationData.create(qualificationDataProps);
    const source = LeadSource.create(sourceProps);
    const metadata = LeadMetadata.create({
      conversationSummary,
      tags: [],
      notes: [],
    });
    
    const now = new Date();
    
    return new Lead({
      id: crypto.randomUUID(),
      sessionId,
      organizationId,
      chatbotConfigId,
      contactInfo,
      qualificationData,
      leadScore,
      qualificationStatus,
      source,
      metadata,
      capturedAt: now,
      followUpStatus: 'new',
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: Omit<LeadProps, 'contactInfo' | 'qualificationData' | 'source' | 'metadata'> & {
    contactInfo: ContactInfoProps;
    qualificationData: QualificationDataProps;
    source: LeadSourceProps;
    metadata: LeadMetadataProps;
  }): Lead {
    return new Lead({
      ...props,
      contactInfo: ContactInfo.fromPersistence(props.contactInfo),
      qualificationData: QualificationData.fromPersistence(props.qualificationData),
      source: LeadSource.fromPersistence(props.source),
      metadata: LeadMetadata.fromPersistence(props.metadata),
    });
  }

  private validateProps(props: LeadProps): void {
    if (!props.sessionId?.trim()) {
      throw new Error('Session ID is required');
    }
    if (!props.organizationId?.trim()) {
      throw new Error('Organization ID is required');
    }
    if (!props.chatbotConfigId?.trim()) {
      throw new Error('Chatbot config ID is required');
    }
    if (props.leadScore < 0 || props.leadScore > 100) {
      throw new Error('Lead score must be between 0 and 100');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get sessionId(): string { return this.props.sessionId; }
  get organizationId(): string { return this.props.organizationId; }
  get chatbotConfigId(): string { return this.props.chatbotConfigId; }
  get contactInfo(): ContactInfo { return this.props.contactInfo; }
  get qualificationData(): QualificationData { return this.props.qualificationData; }
  get leadScore(): number { return this.props.leadScore; }
  get qualificationStatus(): QualificationStatus { return this.props.qualificationStatus; }
  get source(): LeadSource { return this.props.source; }
  get metadata(): LeadMetadata { return this.props.metadata; }
  get capturedAt(): Date { return this.props.capturedAt; }
  get followUpStatus(): FollowUpStatus { return this.props.followUpStatus; }
  get assignedTo(): string | undefined { return this.props.assignedTo; }
  get lastContactedAt(): Date | undefined { return this.props.lastContactedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Convenience getters for metadata
  get conversationSummary(): string { return this.props.metadata.conversationSummary; }
  get tags(): string[] { return this.props.metadata.tags; }
  get notes(): LeadNote[] { return this.props.metadata.notes; }

  // Business methods (delegated to LeadBusinessService)
  updateContactInfo(contactInfoProps: Partial<ContactInfoProps>): Lead {
    const result = LeadBusinessService.updateContactInfo(this.props.contactInfo, contactInfoProps);
    return this.createUpdatedLead(result);
  }

  updateQualificationData(qualificationDataProps: Partial<QualificationDataProps>): Lead {
    const result = LeadBusinessService.updateQualificationData(this.props.qualificationData, qualificationDataProps);
    return this.createUpdatedLead(result);
  }

  updateFollowUpStatus(status: FollowUpStatus): Lead {
    const result = LeadBusinessService.updateFollowUpStatus(this.getLifecycleState(), status);
    return this.createUpdatedLead(result);
  }

  assignTo(userId: string): Lead {
    const result = LeadBusinessService.assignLead(this.getLifecycleState(), userId);
    return this.createUpdatedLead(result);
  }

  unassign(): Lead {
    const result = LeadBusinessService.unassignLead(this.getLifecycleState());
    return this.createUpdatedLead(result);
  }

  addTag(tag: string): Lead {
    const result = LeadBusinessService.addTag(this.props.metadata, tag);
    return this.createUpdatedLead(result);
  }

  removeTag(tag: string): Lead {
    const result = LeadBusinessService.removeTag(this.props.metadata, tag);
    return this.createUpdatedLead(result);
  }

  addNote(content: string, authorId: string, authorName: string, isInternal: boolean = true): Lead {
    const result = LeadBusinessService.addNote(this.props.metadata, content, authorId, authorName, isInternal);
    return this.createUpdatedLead(result);
  }

  updateConversationSummary(summary: string): Lead {
    const result = LeadBusinessService.updateConversationSummary(this.props.metadata, summary);
    return this.createUpdatedLead(result);
  }

  // Status transition shortcuts (delegated to lifecycle manager)
  markAsContacted(): Lead { return this.updateFollowUpStatus('contacted'); }
  markAsConverted(): Lead { return this.updateFollowUpStatus('converted'); }
  markAsLost(): Lead { return this.updateFollowUpStatus('lost'); }
  markAsNurturing(): Lead { return this.updateFollowUpStatus('nurturing'); }
  markAsInProgress(): Lead { return this.updateFollowUpStatus('in_progress'); }

  // Query methods (delegated to LeadQueryService)
  isQualified(): boolean {
    return LeadQueryService.isQualified(this.props.qualificationStatus);
  }

  isHighlyQualified(): boolean {
    return LeadQueryService.isHighlyQualified(this.props.qualificationStatus);
  }

  isDisqualified(): boolean {
    return LeadQueryService.isDisqualified(this.props.qualificationStatus);
  }

  isNew(): boolean { 
    return this.props.followUpStatus === 'new'; 
  }

  isConverted(): boolean { 
    return this.props.followUpStatus === 'converted'; 
  }

  isAssigned(): boolean { 
    return this.props.assignedTo !== undefined; 
  }

  hasRecentActivity(daysThreshold: number = 7): boolean {
    if (!this.props.lastContactedAt) return false;
    const daysSinceContact = (Date.now() - this.props.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceContact <= daysThreshold;
  }

  getDaysSinceCreated(): number {
    return Math.floor((Date.now() - this.props.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  getScoreGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (this.props.leadScore >= 90) return 'A';
    if (this.props.leadScore >= 80) return 'B';
    if (this.props.leadScore >= 70) return 'C';
    if (this.props.leadScore >= 60) return 'D';
    return 'F';
  }

  toSummary(): object {
    return LeadExportService.generateSummary(this);
  }

  toExportData(): object {
    return LeadExportService.generateExportData(this);
  }

  toAnalyticsData(): object {
    return LeadExportService.generateAnalyticsData(this);
  }

  toListData(): object {
    return LeadExportService.generateListData(this);
  }

  toPlainObject(): LeadProps {
    return { ...this.props };
  }

  private getLifecycleState(): LeadLifecycleState {
    return {
      followUpStatus: this.props.followUpStatus,
      assignedTo: this.props.assignedTo,
      lastContactedAt: this.props.lastContactedAt,
      updatedAt: this.props.updatedAt,
    };
  }

  private createUpdatedLead(updates: Partial<LeadProps>): Lead {
    return new Lead({
      ...this.props,
      ...updates,
      updatedAt: new Date(),
    });
  }
} 