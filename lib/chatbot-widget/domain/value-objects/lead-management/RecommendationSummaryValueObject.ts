/**
 * Recommendation Summary Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object for recommendation summary data
 * - Encapsulate summary logic and text generation
 * - Ensure immutability and validation
 * - Delegate complex operations to domain services
 * - Stay under 200 lines following @golden-rule patterns
 */

import { LeadRecommendation } from '../../../application/use-cases/lead-capture-components/LeadRecommendationEngine';
import { RecommendationPriorityAnalyzer } from '../../services/lead-management/RecommendationPriorityAnalyzer';
import { RecommendationCategoryAnalyzer, CategoryBreakdown } from '../../services/lead-management/RecommendationCategoryAnalyzer';
import { RecommendationTimelineAnalyzer, TimelineSummary } from '../../services/lead-management/RecommendationTimelineAnalyzer';
import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError';

export interface RecommendationSummaryData {
  totalRecommendations: number;
  highPriorityCount: number;
  primaryAction: string;
  urgentActions: string[];
  categoryBreakdown: CategoryBreakdown;
  timelineSummary: TimelineSummary;
  topRecommendations: LeadRecommendation[];
}

export class RecommendationSummaryValueObject {
  private readonly data: RecommendationSummaryData;

  constructor(
    recommendations: LeadRecommendation[],
    priorityAnalyzer: RecommendationPriorityAnalyzer,
    categoryAnalyzer: RecommendationCategoryAnalyzer,
    timelineAnalyzer: RecommendationTimelineAnalyzer
  ) {
    this.validateInputs(recommendations, priorityAnalyzer, categoryAnalyzer, timelineAnalyzer);
    
    this.data = {
      totalRecommendations: recommendations.length,
      highPriorityCount: priorityAnalyzer.getHighPriorityCount(recommendations),
      primaryAction: priorityAnalyzer.getPrimaryAction(recommendations),
      urgentActions: priorityAnalyzer.getUrgentActions(recommendations),
      categoryBreakdown: categoryAnalyzer.getCategoryBreakdown(recommendations),
      timelineSummary: timelineAnalyzer.getTimelineSummary(recommendations),
      topRecommendations: timelineAnalyzer.getTopRecommendations(recommendations)
    };
  }

  /**
   * Create from existing summary data
   */
  static fromSummary(summary: RecommendationSummaryData): RecommendationSummaryValueObject {
    const instance = Object.create(RecommendationSummaryValueObject.prototype);
    instance.data = { ...summary };
    return instance;
  }

  /**
   * Convert to plain summary object
   */
  toSummary(): RecommendationSummaryData {
    return { ...this.data };
  }

  /**
   * Generate executive summary text
   */
  generateExecutiveText(): string {
    const { totalRecommendations, highPriorityCount, urgentActions } = this.data;
    
    if (totalRecommendations === 0) {
      return 'No recommendations generated for this lead.';
    }

    let summaryText = `Generated ${totalRecommendations} recommendation${totalRecommendations > 1 ? 's' : ''}`;
    
    if (highPriorityCount > 0) {
      summaryText += ` with ${highPriorityCount} high priority action${highPriorityCount > 1 ? 's' : ''}`;
    }
    
    if (urgentActions.length > 0) {
      summaryText += ` and ${urgentActions.length} urgent action${urgentActions.length > 1 ? 's' : ''} requiring immediate attention`;
    }
    
    summaryText += '.';
    
    return summaryText;
  }

  /**
   * Get next action recommendation text
   */
  getNextActionText(): string {
    if (this.data.urgentActions.length > 0) {
      return `Immediate action required: ${this.data.urgentActions[0]}`;
    }
    
    if (this.data.primaryAction !== 'No recommendations available') {
      return `Primary action: ${this.data.primaryAction}`;
    }
    
    return 'No specific actions recommended at this time.';
  }

  /**
   * Get priority distribution text
   */
  getPriorityDistributionText(): string {
    const { totalRecommendations, highPriorityCount } = this.data;
    const mediumPriority = totalRecommendations - highPriorityCount;
    
    if (totalRecommendations === 0) return 'No recommendations';
    
    let text = '';
    if (highPriorityCount > 0) {
      text += `${highPriorityCount} high priority`;
    }
    if (mediumPriority > 0) {
      if (text) text += ', ';
      text += `${mediumPriority} medium priority`;
    }
    
    return text || 'No priority breakdown available';
  }

  /**
   * Get category focus text
   */
  getCategoryFocusText(): string {
    const { categoryBreakdown } = this.data;
    
    const maxCategory = Object.entries(categoryBreakdown).reduce((max, [category, count]) => {
      return count > max.count ? { category, count } : max;
    }, { category: '', count: 0 });
    
    if (maxCategory.count === 0) {
      return 'No specific category focus identified.';
    }
    
    const categoryNames: Record<string, string> = {
      salesActions: 'sales activities',
      marketingActions: 'marketing initiatives',
      dataImprovements: 'data collection',
      qualificationImprovements: 'lead qualification'
    };
    
    const categoryName = categoryNames[maxCategory.category] || maxCategory.category;
    
    return `Primary focus should be on ${categoryName} (${maxCategory.count} recommendation${maxCategory.count > 1 ? 's' : ''}).`;
  }

  /**
   * Validate constructor inputs
   */
  private validateInputs(
    recommendations: LeadRecommendation[],
    priorityAnalyzer: RecommendationPriorityAnalyzer,
    categoryAnalyzer: RecommendationCategoryAnalyzer,
    timelineAnalyzer: RecommendationTimelineAnalyzer
  ): void {
    if (!Array.isArray(recommendations)) {
      throw new BusinessRuleViolationError(
        'Recommendations must be provided as an array',
        { operation: 'createSummaryValueObject' }
      );
    }

    if (!priorityAnalyzer || !categoryAnalyzer || !timelineAnalyzer) {
      throw new BusinessRuleViolationError(
        'All analyzer services must be provided',
        { 
          operation: 'createSummaryValueObject',
          hasPriorityAnalyzer: !!priorityAnalyzer,
          hasCategoryAnalyzer: !!categoryAnalyzer,
          hasTimelineAnalyzer: !!timelineAnalyzer
        }
      );
    }
  }
} 