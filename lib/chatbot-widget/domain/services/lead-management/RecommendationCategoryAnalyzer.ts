/**
 * Recommendation Category Analyzer
 * 
 * AI INSTRUCTIONS:
 * - Domain service for analyzing recommendation categories
 * - Single responsibility: Category analysis and classification
 * - Keep business logic pure, no external dependencies
 * - Use domain-specific error types for validation
 * - Stay under 200 lines following @golden-rule patterns
 */

import { LeadRecommendation } from '../../value-objects/lead-management/LeadRecommendation';
import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export interface CategoryBreakdown {
  salesActions: number;
  marketingActions: number;
  dataImprovements: number;
  qualificationImprovements: number;
}

export class RecommendationCategoryAnalyzer {
  /**
   * Get breakdown by category
   */
  getCategoryBreakdown(recommendations: LeadRecommendation[]): CategoryBreakdown {
    this.validateRecommendations(recommendations);
    
    const breakdown: CategoryBreakdown = {
      salesActions: 0,
      marketingActions: 0,
      dataImprovements: 0,
      qualificationImprovements: 0
    };

    recommendations.forEach(rec => {
      this.incrementCategoryCount(breakdown, rec.category);
    });

    return breakdown;
  }

  /**
   * Get dominant category
   */
  getDominantCategory(breakdown: CategoryBreakdown): { category: string; count: number } {
    const entries = Object.entries(breakdown) as [keyof CategoryBreakdown, number][];
    
    return entries.reduce((max, [category, count]) => {
      return count > max.count ? { category, count } : max;
    }, { category: '', count: 0 });
  }

  /**
   * Get category focus text
   */
  getCategoryFocusText(breakdown: CategoryBreakdown): string {
    const dominant = this.getDominantCategory(breakdown);
    
    if (dominant.count === 0) {
      return 'No specific category focus identified.';
    }
    
    const categoryName = this.getCategoryDisplayName(dominant.category);
    
    return `Primary focus should be on ${categoryName} (${dominant.count} recommendation${dominant.count > 1 ? 's' : ''}).`;
  }

  /**
   * Get category display name
   */
  private getCategoryDisplayName(category: string): string {
    const categoryNames: Record<string, string> = {
      salesActions: 'sales activities',
      marketingActions: 'marketing initiatives',
      dataImprovements: 'data collection',
      qualificationImprovements: 'lead qualification'
    };
    
    return categoryNames[category] || category;
  }

  /**
   * Increment category count based on recommendation category
   */
  private incrementCategoryCount(breakdown: CategoryBreakdown, category: string): void {
    switch (category) {
      case 'sales_action':
        breakdown.salesActions++;
        break;
      case 'marketing_action':
        breakdown.marketingActions++;
        break;
      case 'data_improvement':
        breakdown.dataImprovements++;
        break;
      case 'qualification_improvement':
        breakdown.qualificationImprovements++;
        break;
      default:
        // Log unknown category but don't throw error to maintain robustness
        break;
    }
  }

  /**
   * Validate recommendations array
   */
  private validateRecommendations(recommendations: LeadRecommendation[]): void {
    if (!Array.isArray(recommendations)) {
      throw new BusinessRuleViolationError(
        'Recommendations must be provided as an array',
        { 
          operation: 'categoryAnalysis',
          providedType: typeof recommendations 
        }
      );
    }
  }
} 