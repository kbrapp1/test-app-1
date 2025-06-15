/**
 * Next Step Definitions
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Define next step templates and configurations
 * - Provide reusable step definitions for different qualification statuses
 * - Keep step definitions organized and maintainable
 * - Stay under 200-250 lines
 * - Follow @golden-rule patterns exactly
 */

import { Lead } from '../../../domain/entities/Lead';
import { QualificationStatus } from './LeadQualificationAnalyzer';
import { NextStep, StepPriority, StepAssignee, StepCategory } from './LeadNextStepsGenerator';

export class NextStepDefinitions {
  /**
   * Get steps specific to qualification status
   */
  static getQualifiedSteps(): NextStep[] {
    return [
      {
        step: 'Assign to sales representative',
        priority: 'critical',
        timeline: 'Within 1 hour',
        assignee: 'manager',
        category: 'immediate_action',
        description: 'Immediately assign qualified lead to available sales rep'
      },
      {
        step: 'Schedule follow-up call or demo',
        priority: 'critical',
        timeline: 'Within 4 hours',
        assignee: 'sales_team',
        category: 'immediate_action',
        description: 'Contact lead to schedule demo or discovery call'
      },
      {
        step: 'Add to high-priority lead list',
        priority: 'high',
        timeline: 'Immediate',
        assignee: 'system',
        category: 'administration',
        description: 'Flag lead as high priority in CRM system'
      },
      {
        step: 'Send personalized welcome sequence',
        priority: 'high',
        timeline: 'Within 2 hours',
        assignee: 'marketing_team',
        category: 'immediate_action',
        description: 'Trigger personalized email sequence for qualified leads'
      },
      {
        step: 'Prepare company research',
        priority: 'medium',
        timeline: 'Before first call',
        assignee: 'sales_team',
        category: 'follow_up',
        description: 'Research lead\'s company and prepare talking points'
      }
    ];
  }

  /**
   * Get steps for leads that need review
   */
  static getNeedsReviewSteps(): NextStep[] {
    return [
      {
        step: 'Queue for manual review',
        priority: 'high',
        timeline: 'Within 4 hours',
        assignee: 'lead_qualifier',
        category: 'immediate_action',
        description: 'Add to manual review queue for qualification assessment'
      },
      {
        step: 'Send additional qualification email',
        priority: 'medium',
        timeline: 'Within 24 hours',
        assignee: 'marketing_team',
        category: 'follow_up',
        description: 'Send targeted email to gather more qualification data'
      },
      {
        step: 'Add to nurture campaign',
        priority: 'medium',
        timeline: 'Within 48 hours',
        assignee: 'marketing_team',
        category: 'nurturing',
        description: 'Enroll in educational nurture sequence'
      },
      {
        step: 'Schedule qualification follow-up',
        priority: 'medium',
        timeline: 'Within 1 week',
        assignee: 'lead_qualifier',
        category: 'follow_up',
        description: 'Schedule follow-up to complete qualification process'
      }
    ];
  }

  /**
   * Get steps for unqualified leads
   */
  static getUnqualifiedSteps(): NextStep[] {
    return [
      {
        step: 'Add to general newsletter list',
        priority: 'low',
        timeline: 'Within 1 week',
        assignee: 'marketing_team',
        category: 'nurturing',
        description: 'Add to general newsletter for long-term nurturing'
      },
      {
        step: 'Monitor for future engagement',
        priority: 'low',
        timeline: 'Ongoing',
        assignee: 'system',
        category: 'monitoring',
        description: 'Set up monitoring for increased engagement signals'
      },
      {
        step: 'Consider re-qualification campaign in 3 months',
        priority: 'low',
        timeline: '3 months',
        assignee: 'marketing_team',
        category: 'nurturing',
        description: 'Schedule re-qualification attempt after nurturing period'
      },
      {
        step: 'Archive lead with reason',
        priority: 'medium',
        timeline: 'Within 1 week',
        assignee: 'system',
        category: 'administration',
        description: 'Archive lead with detailed disqualification reason'
      }
    ];
  }

  /**
   * Get universal steps that apply to all leads
   */
  static getUniversalSteps(): NextStep[] {
    return [
      {
        step: 'Update CRM with lead information',
        priority: 'high',
        timeline: 'Within 1 hour',
        assignee: 'system',
        category: 'administration',
        description: 'Sync all lead data to CRM system'
      },
      {
        step: 'Track engagement metrics',
        priority: 'medium',
        timeline: 'Ongoing',
        assignee: 'system',
        category: 'monitoring',
        description: 'Monitor lead engagement across all channels'
      },
      {
        step: 'Log conversation summary',
        priority: 'medium',
        timeline: 'Within 2 hours',
        assignee: 'system',
        category: 'administration',
        description: 'Record detailed conversation summary in lead record'
      }
    ];
  }

  /**
   * Get data quality improvement steps
   */
  static getDataQualitySteps(lead: Lead): NextStep[] {
    const steps: NextStep[] = [];

    // Missing email
    if (!lead.contactInfo.email || lead.contactInfo.email.trim().length === 0) {
      steps.push({
        step: 'Attempt email capture',
        priority: 'high',
        timeline: 'Next interaction',
        assignee: 'sales_team',
        category: 'follow_up',
        description: 'Prioritize capturing email address for communication'
      });
    }

    // Missing phone
    if (!lead.contactInfo.phone || lead.contactInfo.phone.trim().length === 0) {
      steps.push({
        step: 'Consider phone number capture',
        priority: 'medium',
        timeline: 'Within 1 week',
        assignee: 'marketing_team',
        category: 'follow_up',
        description: 'Implement phone capture strategy if appropriate'
      });
    }

    // Missing company info for B2B
    if (!lead.contactInfo.company || lead.contactInfo.company.trim().length === 0) {
      steps.push({
        step: 'Identify company affiliation',
        priority: 'medium',
        timeline: 'Before first call',
        assignee: 'sales_team',
        category: 'follow_up',
        description: 'Research and identify lead\'s company for B2B approach'
      });
    }

    // Incomplete qualification
    if (lead.qualificationData.answeredQuestions.length < 2) {
      steps.push({
        step: 'Complete qualification process',
        priority: 'medium',
        timeline: 'Within 3 days',
        assignee: 'lead_qualifier',
        category: 'follow_up',
        description: 'Gather additional qualification information'
      });
    }

    return steps;
  }

  /**
   * Get steps by qualification status
   */
  static getStepsByStatus(status: QualificationStatus): NextStep[] {
    switch (status) {
      case 'qualified':
        return this.getQualifiedSteps();
      case 'needs_review':
        return this.getNeedsReviewSteps();
      case 'unqualified':
        return this.getUnqualifiedSteps();
      default:
        return [];
    }
  }
} 