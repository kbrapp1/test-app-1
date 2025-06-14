/**
 * Lead Export Service
 * 
 * Domain Service: Handles lead data export operations
 * Single Responsibility: Lead export and summary data generation
 * Following DDD domain service patterns
 */

import { Lead } from '../entities/Lead';
import { ContactInfo } from '../value-objects/ContactInfo';
import { LeadMetadata } from '../value-objects/LeadMetadata';
import { LeadSource } from '../value-objects/LeadSource';
import { LeadScoringService } from './LeadScoringService';

export class LeadExportService {
  /**
   * Generate summary data for lead overview
   */
  static generateSummary(lead: Lead): object {
    return {
      id: lead.id,
      displayName: lead.contactInfo.getDisplayName(),
      email: lead.contactInfo.email,
      company: lead.contactInfo.company,
      leadScore: lead.leadScore,
      scoreGrade: LeadScoringService.getScoreGrade(lead.leadScore),
      qualificationStatus: lead.qualificationStatus,
      followUpStatus: lead.followUpStatus,
      isAssigned: !!lead.assignedTo,
      assignedTo: lead.assignedTo,
      daysSinceCreated: this.calculateDaysSinceCreated(lead.createdAt),
      capturedAt: lead.capturedAt,
      tags: lead.tags,
      source: lead.source.toSummary(),
    };
  }

  /**
   * Generate export data for CSV/Excel export
   */
  static generateExportData(lead: Lead): object {
    return {
      id: lead.id,
      name: lead.contactInfo.getDisplayName(),
      email: lead.contactInfo.email,
      phone: lead.contactInfo.phone,
      company: lead.contactInfo.company,
      jobTitle: lead.contactInfo.jobTitle,
      leadScore: lead.leadScore,
      qualificationStatus: lead.qualificationStatus,
      followUpStatus: lead.followUpStatus,
      assignedTo: lead.assignedTo,
      capturedAt: lead.capturedAt,
      conversationSummary: lead.conversationSummary,
      source: lead.source.toAnalyticsData(),
      tags: lead.metadata.getTagsAsString(),
      notes: lead.metadata.getPublicNotesAsString(),
    };
  }

  /**
   * Generate detailed analytics data
   */
  static generateAnalyticsData(lead: Lead): object {
    const scoringResult = LeadScoringService.calculateScore(lead.qualificationData);
    
    return {
      id: lead.id,
      contactInfo: lead.contactInfo.toPlainObject(),
      qualificationData: lead.qualificationData.toPlainObject(),
      source: lead.source.toAnalyticsData(),
      scoring: {
        score: lead.leadScore,
        grade: LeadScoringService.getScoreGrade(lead.leadScore),
        breakdown: scoringResult.scoreBreakdown,
        qualificationStatus: lead.qualificationStatus,
        recommendations: LeadScoringService.getScoreRecommendations(scoringResult),
      },
      lifecycle: {
        followUpStatus: lead.followUpStatus,
        assignedTo: lead.assignedTo,
        daysSinceCreated: this.calculateDaysSinceCreated(lead.createdAt),
        daysSinceLastContact: this.calculateDaysSinceLastContact(lead.lastContactedAt),
        capturedAt: lead.capturedAt,
        lastContactedAt: lead.lastContactedAt,
      },
      metadata: lead.metadata.toPlainObject(),
    };
  }

  /**
   * Generate compact data for lists and tables
   */
  static generateListData(lead: Lead): object {
    return {
      id: lead.id,
      name: lead.contactInfo.getDisplayName(),
      email: lead.contactInfo.email,
      company: lead.contactInfo.company,
      score: lead.leadScore,
      grade: LeadScoringService.getScoreGrade(lead.leadScore),
      status: lead.qualificationStatus,
      followUp: lead.followUpStatus,
      assigned: lead.assignedTo,
      captured: lead.capturedAt,
      tags: lead.tags.slice(0, 3), // Limit for display
    };
  }

  /**
   * Calculate days since lead was created
   */
  private static calculateDaysSinceCreated(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate days since last contact
   */
  private static calculateDaysSinceLastContact(lastContactedAt?: Date): number | null {
    if (!lastContactedAt) return null;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastContactedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
} 