/**
 * Lead Next Steps Generator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate actionable next steps based on qualification status
 * - Provide structured workflow guidance for lead follow-up
 * - Use business rules to determine appropriate action sequences
 * - Return prioritized next steps with clear timelines
 * - Stay under 200-250 lines
 * - Follow @golden-rule patterns exactly
 */

import { Lead } from '../../../domain/entities/Lead';
import { QualificationStatus } from './LeadQualificationAnalyzer';
import { NextStepDefinitions } from './NextStepDefinitions';

export interface NextStep {
  step: string;
  priority: StepPriority;
  timeline: string;
  assignee: StepAssignee;
  category: StepCategory;
  description: string;
}

export type StepPriority = 'critical' | 'high' | 'medium' | 'low';
export type StepAssignee = 'sales_team' | 'marketing_team' | 'lead_qualifier' | 'system' | 'manager';
export type StepCategory = 'immediate_action' | 'follow_up' | 'nurturing' | 'administration' | 'monitoring';

export class LeadNextStepsGenerator {
  /**
   * Generate next steps based on qualification status
   */
  static generateNextSteps(
    lead: Lead,
    qualificationStatus: QualificationStatus
  ): NextStep[] {
    const steps: NextStep[] = [];

    // Status-specific steps
    steps.push(...NextStepDefinitions.getStepsByStatus(qualificationStatus));

    // Universal steps that apply to all leads
    steps.push(...NextStepDefinitions.getUniversalSteps());

    // Lead-specific steps based on data quality
    steps.push(...NextStepDefinitions.getDataQualitySteps(lead));

    // Sort by priority and timeline
    return this.prioritizeSteps(steps);
  }

  /**
   * Prioritize and sort steps by importance and timeline
   */
  private static prioritizeSteps(steps: NextStep[]): NextStep[] {
    // Remove duplicates based on step name
    const uniqueSteps = steps.filter((step, index, arr) =>
      arr.findIndex(s => s.step === step.step) === index
    );

    // Define priority order
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    // Define timeline urgency
    const getTimelineUrgency = (timeline: string): number => {
      if (timeline.includes('Immediate') || timeline.includes('hour')) return 4;
      if (timeline.includes('day')) return 3;
      if (timeline.includes('week')) return 2;
      return 1;
    };

    // Sort by priority first, then by timeline urgency
    return uniqueSteps.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return getTimelineUrgency(b.timeline) - getTimelineUrgency(a.timeline);
    });
  }

  /**
   * Get next steps summary for quick overview
   */
  static getNextStepsSummary(steps: NextStep[]): {
    totalSteps: number;
    criticalSteps: number;
    immediateActions: number;
    primaryAction: string;
    assigneeBreakdown: Record<StepAssignee, number>;
  } {
    const criticalSteps = steps.filter(s => s.priority === 'critical').length;
    const immediateActions = steps.filter(s => 
      s.timeline.includes('Immediate') || 
      s.timeline.includes('hour') ||
      s.category === 'immediate_action'
    ).length;

    const assigneeBreakdown = steps.reduce((acc, step) => {
      acc[step.assignee] = (acc[step.assignee] || 0) + 1;
      return acc;
    }, {} as Record<StepAssignee, number>);

    return {
      totalSteps: steps.length,
      criticalSteps,
      immediateActions,
      primaryAction: steps[0]?.step || 'No steps available',
      assigneeBreakdown
    };
  }

  /**
   * Filter steps by assignee for team-specific workflows
   */
  static getStepsByAssignee(steps: NextStep[], assignee: StepAssignee): NextStep[] {
    return steps.filter(step => step.assignee === assignee);
  }

  /**
   * Get urgent steps that need immediate attention
   */
  static getUrgentSteps(steps: NextStep[]): NextStep[] {
    return steps.filter(step => 
      step.priority === 'critical' || 
      step.timeline.includes('Immediate') ||
      step.timeline.includes('hour')
    );
  }

  /**
   * Get steps by category for workflow organization
   */
  static getStepsByCategory(steps: NextStep[], category: StepCategory): NextStep[] {
    return steps.filter(step => step.category === category);
  }

  /**
   * Get steps by priority level
   */
  static getStepsByPriority(steps: NextStep[], priority: StepPriority): NextStep[] {
    return steps.filter(step => step.priority === priority);
  }

  /**
   * Get steps that need to be completed within a specific timeframe
   */
  static getStepsByTimeframe(steps: NextStep[], timeframe: string): NextStep[] {
    return steps.filter(step => step.timeline.toLowerCase().includes(timeframe.toLowerCase()));
  }

  /**
   * Get workflow summary for management reporting
   */
  static getWorkflowSummary(steps: NextStep[]): {
    workflow: {
      immediate: NextStep[];
      shortTerm: NextStep[];
      longTerm: NextStep[];
    };
    teamAssignments: Record<StepAssignee, NextStep[]>;
    priorityDistribution: Record<StepPriority, number>;
  } {
    const immediate = steps.filter(s => 
      s.timeline.includes('Immediate') || 
      s.timeline.includes('hour') ||
      s.priority === 'critical'
    );

    const shortTerm = steps.filter(s => 
      s.timeline.includes('day') || 
      s.timeline.includes('week')
    );

    const longTerm = steps.filter(s => 
      s.timeline.includes('month') || 
      s.timeline.includes('Ongoing')
    );

    const teamAssignments = steps.reduce((acc, step) => {
      if (!acc[step.assignee]) acc[step.assignee] = [];
      acc[step.assignee].push(step);
      return acc;
    }, {} as Record<StepAssignee, NextStep[]>);

    const priorityDistribution = steps.reduce((acc, step) => {
      acc[step.priority] = (acc[step.priority] || 0) + 1;
      return acc;
    }, {} as Record<StepPriority, number>);

    return {
      workflow: { immediate, shortTerm, longTerm },
      teamAssignments,
      priorityDistribution
    };
  }
} 