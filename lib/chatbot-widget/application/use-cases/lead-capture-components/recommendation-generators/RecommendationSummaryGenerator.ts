/**
 * Recommendation Summary Generator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate summary information from recommendation lists
 * - Delegate complex calculations to specialized value objects
 * - Keep under 200 lines following @golden-rule patterns
 * - Use domain-specific error types for validation
 * - Focus on orchestration, not implementation
 */

import { LeadRecommendation } from '../LeadRecommendationEngine';
import { RecommendationSummaryValueObject, RecommendationSummaryData } from '../../../../domain/value-objects/lead-management/RecommendationSummaryValueObject';
import { RecommendationPriorityAnalyzer } from '../../../../domain/services/lead-management/RecommendationPriorityAnalyzer';
import { RecommendationCategoryAnalyzer } from '../../../../domain/services/lead-management/RecommendationCategoryAnalyzer';
import { RecommendationTimelineAnalyzer } from '../../../../domain/services/lead-management/RecommendationTimelineAnalyzer';
import { BusinessRuleViolationError } from '../../../../domain/errors/BusinessRuleViolationError';

export type RecommendationSummary = RecommendationSummaryData;

export class RecommendationSummaryGenerator {
  private readonly priorityAnalyzer: RecommendationPriorityAnalyzer;
  private readonly categoryAnalyzer: RecommendationCategoryAnalyzer;
  private readonly timelineAnalyzer: RecommendationTimelineAnalyzer;

  constructor() {
    this.priorityAnalyzer = new RecommendationPriorityAnalyzer();
    this.categoryAnalyzer = new RecommendationCategoryAnalyzer();
    this.timelineAnalyzer = new RecommendationTimelineAnalyzer();
  }

  /**
   * Generate comprehensive recommendation summary
   */
  generateSummary(recommendations: LeadRecommendation[]): RecommendationSummary {
    this.validateRecommendations(recommendations);

    const summaryValueObject = new RecommendationSummaryValueObject(
      recommendations,
      this.priorityAnalyzer,
      this.categoryAnalyzer,
      this.timelineAnalyzer
    );

    return summaryValueObject.toSummary();
  }

  /**
   * Generate executive summary text
   */
  generateExecutiveSummary(summary: RecommendationSummary): string {
    const summaryValueObject = RecommendationSummaryValueObject.fromSummary(summary);
    return summaryValueObject.generateExecutiveText();
  }

  /**
   * Get next action recommendation
   */
  getNextActionRecommendation(summary: RecommendationSummary): string {
    const summaryValueObject = RecommendationSummaryValueObject.fromSummary(summary);
    return summaryValueObject.getNextActionText();
  }

  /**
   * Get priority distribution text
   */
  getPriorityDistributionText(summary: RecommendationSummary): string {
    const summaryValueObject = RecommendationSummaryValueObject.fromSummary(summary);
    return summaryValueObject.getPriorityDistributionText();
  }

  /**
   * Get category focus recommendation
   */
  getCategoryFocusRecommendation(summary: RecommendationSummary): string {
    const summaryValueObject = RecommendationSummaryValueObject.fromSummary(summary);
    return summaryValueObject.getCategoryFocusText();
  }

  /**
   * Validate recommendations input
   */
  private validateRecommendations(recommendations: LeadRecommendation[]): void {
    if (!Array.isArray(recommendations)) {
      throw new BusinessRuleViolationError(
        'Recommendations must be provided as an array',
        { 
          operation: 'generateSummary',
          providedType: typeof recommendations 
        }
      );
    }

    // Validate each recommendation has required fields
    recommendations.forEach((rec, index) => {
      if (!rec.action || typeof rec.action !== 'string') {
        throw new BusinessRuleViolationError(
          'Each recommendation must have a valid action',
          { 
            operation: 'generateSummary',
            recommendationIndex: index,
            action: rec.action 
          }
        );
      }

      if (!rec.priority || !['high', 'medium', 'low'].includes(rec.priority)) {
        throw new BusinessRuleViolationError(
          'Each recommendation must have a valid priority (high, medium, low)',
          { 
            operation: 'generateSummary',
            recommendationIndex: index,
            priority: rec.priority 
          }
        );
      }

      if (!rec.timeline || typeof rec.timeline !== 'string') {
        throw new BusinessRuleViolationError(
          'Each recommendation must have a valid timeline',
          { 
            operation: 'generateSummary',
            recommendationIndex: index,
            timeline: rec.timeline 
          }
        );
      }

      if (!rec.category || typeof rec.category !== 'string') {
        throw new BusinessRuleViolationError(
          'Each recommendation must have a valid category',
          { 
            operation: 'generateSummary',
            recommendationIndex: index,
            category: rec.category 
          }
        );
      }
    });
  }
} 