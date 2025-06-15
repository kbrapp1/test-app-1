/**
 * Recommendation Timeline Analyzer
 * 
 * AI INSTRUCTIONS:
 * - Domain service for analyzing recommendation timelines
 * - Single responsibility: Timeline breakdown and urgency analysis
 * - Keep business logic pure, no external dependencies
 * - Use domain-specific error types for validation
 * - Stay under 200 lines following @golden-rule patterns
 */

import { LeadRecommendation } from '../../../application/use-cases/lead-capture-components/LeadRecommendationEngine';
import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError';

export interface TimelineSummary {
  immediate: number;
  withinHours: number;
  withinDays: number;
  withinWeeks: number;
}

export class RecommendationTimelineAnalyzer {
  /**
   * Get timeline summary breakdown
   */
  getTimelineSummary(recommendations: LeadRecommendation[]): TimelineSummary {
    this.validateRecommendations(recommendations);
    
    const summary: TimelineSummary = {
      immediate: 0,
      withinHours: 0,
      withinDays: 0,
      withinWeeks: 0
    };

    recommendations.forEach(rec => {
      this.categorizeTimeline(summary, rec.timeline);
    });

    return summary;
  }

  /**
   * Get top recommendations (limited set for quick overview)
   */
  getTopRecommendations(recommendations: LeadRecommendation[], limit: number = 3): LeadRecommendation[] {
    this.validateRecommendations(recommendations);
    
    if (limit <= 0) {
      throw new BusinessRuleViolationError(
        'Limit must be a positive number',
        { 
          operation: 'getTopRecommendations',
          providedLimit: limit 
        }
      );
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Check if timeline indicates immediate action needed
   */
  isImmediateAction(timeline: string): boolean {
    if (!timeline || typeof timeline !== 'string') {
      return false;
    }

    const timelineLower = timeline.toLowerCase();
    return timelineLower.includes('immediate') || 
           timelineLower.includes('now') ||
           timelineLower.includes('asap');
  }

  /**
   * Check if timeline indicates action within hours
   */
  isWithinHours(timeline: string): boolean {
    if (!timeline || typeof timeline !== 'string') {
      return false;
    }

    const timelineLower = timeline.toLowerCase();
    return timelineLower.includes('hour') && !this.isImmediateAction(timeline);
  }

  /**
   * Check if timeline indicates action within days
   */
  isWithinDays(timeline: string): boolean {
    if (!timeline || typeof timeline !== 'string') {
      return false;
    }

    const timelineLower = timeline.toLowerCase();
    return timelineLower.includes('day') && 
           !this.isImmediateAction(timeline) && 
           !this.isWithinHours(timeline);
  }

  /**
   * Check if timeline indicates action within weeks
   */
  isWithinWeeks(timeline: string): boolean {
    if (!timeline || typeof timeline !== 'string') {
      return false;
    }

    const timelineLower = timeline.toLowerCase();
    return timelineLower.includes('week') && 
           !this.isImmediateAction(timeline) && 
           !this.isWithinHours(timeline) && 
           !this.isWithinDays(timeline);
  }

  /**
   * Categorize timeline and increment appropriate counter
   */
  private categorizeTimeline(summary: TimelineSummary, timeline: string): void {
    if (this.isImmediateAction(timeline)) {
      summary.immediate++;
    } else if (this.isWithinHours(timeline)) {
      summary.withinHours++;
    } else if (this.isWithinDays(timeline)) {
      summary.withinDays++;
    } else if (this.isWithinWeeks(timeline)) {
      summary.withinWeeks++;
    }
    // If none match, don't increment any counter (unknown timeline format)
  }

  /**
   * Validate recommendations array
   */
  private validateRecommendations(recommendations: LeadRecommendation[]): void {
    if (!Array.isArray(recommendations)) {
      throw new BusinessRuleViolationError(
        'Recommendations must be provided as an array',
        { 
          operation: 'timelineAnalysis',
          providedType: typeof recommendations 
        }
      );
    }
  }
} 