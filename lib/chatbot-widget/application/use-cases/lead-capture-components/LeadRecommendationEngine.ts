/**
 * Lead Recommendation Engine
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate recommendation generation workflow only
 * - Delegate specialized tasks to focused generator components
 * - Handle coordination and aggregation of recommendations
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines by delegating to components
 * - Follow @golden-rule patterns exactly
 */

import { Lead } from '../../../domain/entities/Lead';
import { ChatSession } from '../../../domain/entities/ChatSession';
import {
  ScoreBasedRecommendationGenerator,
  ContactInfoRecommendationGenerator,
  EngagementRecommendationGenerator,
  InterestBasedRecommendationGenerator,
  CompanyBasedRecommendationGenerator,
  RecommendationPrioritizer,
  RecommendationSummaryGenerator,
  type RecommendationSummary
} from './recommendation-generators';

export interface LeadRecommendation {
  type: RecommendationType;
  priority: RecommendationPriority;
  action: string;
  reasoning: string;
  timeline: string;
  category: RecommendationCategory;
}

export type RecommendationType = 
  | 'immediate_follow_up'
  | 'nurture_campaign'
  | 'content_delivery'
  | 'data_capture'
  | 'qualification'
  | 'research'
  | 'disqualify';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export type RecommendationCategory = 
  | 'sales_action'
  | 'marketing_action'
  | 'data_improvement'
  | 'qualification_improvement';

export class LeadRecommendationEngine {
  /**
   * Generate comprehensive recommendations for a lead
   */
  static generateRecommendations(
    lead: Lead,
    session: ChatSession,
    leadScore: number
  ): LeadRecommendation[] {
    const allRecommendations: LeadRecommendation[] = [];

    // Delegate to specialized generators
    allRecommendations.push(
      ...ScoreBasedRecommendationGenerator.generateRecommendations(leadScore)
    );

    allRecommendations.push(
      ...ContactInfoRecommendationGenerator.generateRecommendations(lead)
    );

    allRecommendations.push(
      ...EngagementRecommendationGenerator.generateRecommendations(lead, session)
    );

    allRecommendations.push(
      ...InterestBasedRecommendationGenerator.generateRecommendations(lead, session)
    );

    allRecommendations.push(
      ...CompanyBasedRecommendationGenerator.generateRecommendations(lead, session)
    );

    // Prioritize and filter recommendations
    return RecommendationPrioritizer.prioritizeRecommendations(allRecommendations);
  }

  /**
   * Get recommendation summary for quick overview
   */
  static getRecommendationSummary(recommendations: LeadRecommendation[]): RecommendationSummary {
    const generator = new RecommendationSummaryGenerator();
    return generator.generateSummary(recommendations);
  }

  /**
   * Generate recommendations with summary
   */
  static generateRecommendationsWithSummary(
    lead: Lead,
    session: ChatSession,
    leadScore: number
  ): {
    recommendations: LeadRecommendation[];
    summary: RecommendationSummary;
  } {
    const recommendations = this.generateRecommendations(lead, session, leadScore);
    const summary = this.getRecommendationSummary(recommendations);

    return {
      recommendations,
      summary
    };
  }

  /**
   * Get recommendations by category
   */
  static getRecommendationsByCategory(
    recommendations: LeadRecommendation[]
  ): Record<RecommendationCategory, LeadRecommendation[]> {
    return RecommendationPrioritizer.groupByCategory(recommendations);
  }

  /**
   * Get recommendations by priority
   */
  static getRecommendationsByPriority(
    recommendations: LeadRecommendation[]
  ): Record<RecommendationPriority, LeadRecommendation[]> {
    return RecommendationPrioritizer.groupByPriority(recommendations);
  }

  /**
   * Get urgent recommendations requiring immediate action
   */
  static getUrgentRecommendations(
    recommendations: LeadRecommendation[]
  ): LeadRecommendation[] {
    return RecommendationPrioritizer.getUrgentRecommendations(recommendations);
  }

  /**
   * Get recommendations of a specific type
   */
  static getRecommendationsByType(
    recommendations: LeadRecommendation[],
    type: RecommendationType
  ): LeadRecommendation[] {
    return RecommendationPrioritizer.getRecommendationsByType(recommendations, type);
  }

  /**
   * Get executive summary text
   */
  static getExecutiveSummary(recommendations: LeadRecommendation[]): string {
    const summary = this.getRecommendationSummary(recommendations);
    const generator = new RecommendationSummaryGenerator();
    return generator.generateExecutiveSummary(summary);
  }

  /**
   * Get next action recommendation
   */
  static getNextActionRecommendation(recommendations: LeadRecommendation[]): string {
    const summary = this.getRecommendationSummary(recommendations);
    const generator = new RecommendationSummaryGenerator();
    return generator.getNextActionRecommendation(summary);
  }

  /**
   * Get category focus recommendation
   */
  static getCategoryFocusRecommendation(recommendations: LeadRecommendation[]): string {
    const summary = this.getRecommendationSummary(recommendations);
    const generator = new RecommendationSummaryGenerator();
    return generator.getCategoryFocusRecommendation(summary);
  }

  /**
   * Get recommendation distribution statistics
   */
  static getRecommendationDistribution(recommendations: LeadRecommendation[]): {
    byPriority: Record<RecommendationPriority, number>;
    byCategory: Record<RecommendationCategory, number>;
    totalCount: number;
  } {
    return RecommendationPrioritizer.getRecommendationDistribution(recommendations);
  }

  /**
   * Validate recommendation data
   */
  static validateRecommendation(recommendation: LeadRecommendation): boolean {
    return Boolean(
      recommendation.type &&
      recommendation.priority &&
      recommendation.action &&
      recommendation.reasoning &&
      recommendation.timeline &&
      recommendation.category
    );
  }

  /**
   * Filter valid recommendations
   */
  static filterValidRecommendations(
    recommendations: LeadRecommendation[]
  ): LeadRecommendation[] {
    return recommendations.filter(rec => this.validateRecommendation(rec));
  }

  /**
   * Get recommendation types available
   */
  static getAvailableRecommendationTypes(): RecommendationType[] {
    return [
      'immediate_follow_up',
      'nurture_campaign',
      'content_delivery',
      'data_capture',
      'qualification',
      'research',
      'disqualify'
    ];
  }

  /**
   * Get recommendation priorities available
   */
  static getAvailablePriorities(): RecommendationPriority[] {
    return ['high', 'medium', 'low'];
  }

  /**
   * Get recommendation categories available
   */
  static getAvailableCategories(): RecommendationCategory[] {
    return [
      'sales_action',
      'marketing_action',
      'data_improvement',
      'qualification_improvement'
    ];
  }

  /**
   * Create a custom recommendation
   */
  static createCustomRecommendation(
    type: RecommendationType,
    priority: RecommendationPriority,
    action: string,
    reasoning: string,
    timeline: string,
    category: RecommendationCategory
  ): LeadRecommendation {
    return {
      type,
      priority,
      action,
      reasoning,
      timeline,
      category
    };
  }
} 