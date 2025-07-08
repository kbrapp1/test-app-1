/**
 * Lead Business Service
 * 
 * Domain Service: Handles lead business operations and state transitions
 * Single Responsibility: Lead business logic coordination and state management
 * Following DDD domain service patterns
 * 
 * AI INSTRUCTIONS:
 * - UPDATED: Removed dependency on LeadScoringService - using API-only approach
 * - Lead scores are provided externally, not calculated here
 * - Keep under 200 lines following @golden-rule patterns
 */

import { ContactInfo, ContactInfoProps } from '../../value-objects/lead-management/ContactInfo';
import { QualificationData, QualificationDataProps } from '../../value-objects/lead-management/QualificationData';
import { LeadMetadata } from '../../value-objects/lead-management/LeadMetadata';
import { LeadLifecycleManager, FollowUpStatus, LeadLifecycleState } from '../../entities/LeadLifecycleManager';

// Define QualificationStatus locally since we removed LeadScoringService
export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

export interface LeadUpdateResult {
  contactInfo?: ContactInfo;
  qualificationData?: QualificationData;
  metadata?: LeadMetadata;
  leadScore?: number;
  qualificationStatus?: QualificationStatus;
  followUpStatus?: FollowUpStatus;
  assignedTo?: string;
  lastContactedAt?: Date;
  updatedAt: Date;
}

export class LeadBusinessService {
  /** Update contact information and return changes */
  static updateContactInfo(
    currentContactInfo: ContactInfo,
    updates: Partial<ContactInfoProps>
  ): LeadUpdateResult {
    const updatedContactInfo = ContactInfo.create({
      ...currentContactInfo.toPlainObject(),
      ...updates,
    });

    return {
      contactInfo: updatedContactInfo,
      updatedAt: new Date(),
    };
  }

  /**
   * Update qualification data
   * Note: Lead score is now provided by API, not calculated here
   */
  static updateQualificationData(
    currentQualificationData: QualificationData,
    updates: Partial<QualificationDataProps>
  ): LeadUpdateResult {
    const updatedQualificationData = QualificationData.create({
      ...currentQualificationData.toPlainObject(),
      ...updates,
    });

    return {
      qualificationData: updatedQualificationData,
      updatedAt: new Date(),
    };
  }

  /** Update follow-up status using lifecycle manager */
  static updateFollowUpStatus(
    currentState: LeadLifecycleState,
    status: FollowUpStatus
  ): LeadUpdateResult {
    const updatedState = LeadLifecycleManager.updateFollowUpStatus(currentState, status);
    
    return {
      followUpStatus: updatedState.followUpStatus,
      lastContactedAt: updatedState.lastContactedAt,
      updatedAt: updatedState.updatedAt,
    };
  }

  /** Assign lead to user */
  static assignLead(
    currentState: LeadLifecycleState,
    userId: string
  ): LeadUpdateResult {
    const updatedState = LeadLifecycleManager.assignLead(currentState, userId);
    
    return {
      assignedTo: updatedState.assignedTo,
      updatedAt: updatedState.updatedAt,
    };
  }

  /** Unassign lead */
  static unassignLead(
    currentState: LeadLifecycleState
  ): LeadUpdateResult {
    const updatedState = LeadLifecycleManager.unassignLead(currentState);
    
    return {
      assignedTo: updatedState.assignedTo,
      updatedAt: updatedState.updatedAt,
    };
  }

  /** Add tag to lead metadata */
  static addTag(
    currentMetadata: LeadMetadata,
    tag: string
  ): LeadUpdateResult {
    const updatedMetadata = currentMetadata.addTag(tag);
    
    return {
      metadata: updatedMetadata,
      updatedAt: new Date(),
    };
  }

  /** Remove tag from lead metadata */
  static removeTag(
    currentMetadata: LeadMetadata,
    tag: string
  ): LeadUpdateResult {
    const updatedMetadata = currentMetadata.removeTag(tag);
    
    return {
      metadata: updatedMetadata,
      updatedAt: new Date(),
    };
  }

  /**
   * Add note to lead metadata
   */
  static addNote(
    currentMetadata: LeadMetadata,
    content: string,
    authorId: string,
    authorName: string,
    isInternal: boolean = true
  ): LeadUpdateResult {
    const updatedMetadata = currentMetadata.addNote(content, authorId, authorName, isInternal);
    
    return {
      metadata: updatedMetadata,
      updatedAt: new Date(),
    };
  }

  /** Update conversation summary */
  static updateConversationSummary(
    currentMetadata: LeadMetadata,
    summary: string
  ): LeadUpdateResult {
    const updatedMetadata = currentMetadata.updateConversationSummary(summary);
    
    return {
      metadata: updatedMetadata,
      updatedAt: new Date(),
    };
  }
} 