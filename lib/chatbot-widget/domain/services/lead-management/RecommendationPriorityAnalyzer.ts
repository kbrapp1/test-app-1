/**
 * Recommendation Priority Analyzer
 * 
 * AI INSTRUCTIONS:
 * - Domain service for analyzing recommendation priorities
 * - Single responsibility: Priority analysis and urgency scoring
 * - Keep business logic pure, no external dependencies
 * - Use domain-specific error types for validation
 * - Stay under 200 lines following @golden-rule patterns
 */

import { LeadRecommendation } from '../../value-objects/lead-management/LeadRecommendation';
import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export class RecommendationPriorityAnalyzer {
  /** Get count of high priority recommendations */
  getHighPriorityCount(recommendations: LeadRecommendation[]): number {
    this.validateRecommendations(recommendations);
    return recommendations.filter(r => r.priority === 'high').length;
  }

  /** Get primary action (highest priority, most urgent) */
  getPrimaryAction(recommendations: LeadRecommendation[]): string {
    this.validateRecommendations(recommendations);
    
    if (recommendations.length === 0) {
      return 'No recommendations available';
    }

    // Find highest priority recommendations
    const highPriority = recommendations.filter(r => r.priority === 'high');
    
    if (highPriority.length > 0) {
      // Among high priority, find most urgent
      const mostUrgent = this.getMostUrgentRecommendation(highPriority);
      return mostUrgent?.action || highPriority[0].action;
    }

    // If no high priority, return first recommendation
    return recommendations[0].action;
  }

  /** Get urgent actions that need immediate attention */
  getUrgentActions(recommendations: LeadRecommendation[]): string[] {
    this.validateRecommendations(recommendations);
    
    return recommendations
      .filter(r => this.isUrgentTimeline(r.timeline))
      .map(r => r.action)
      .slice(0, 5); // Limit to top 5 urgent actions
  }

  /** Get most urgent recommendation from a list */
  getMostUrgentRecommendation(recommendations: LeadRecommendation[]): LeadRecommendation | null {
    if (recommendations.length === 0) return null;

    return recommendations.reduce((mostUrgent, current) => {
      const currentUrgency = this.getTimelineUrgencyScore(current.timeline);
      const mostUrgentScore = this.getTimelineUrgencyScore(mostUrgent.timeline);
      
      return currentUrgency > mostUrgentScore ? current : mostUrgent;
    });
  }

  /** Get timeline urgency score for comparison */
  getTimelineUrgencyScore(timeline: string): number {
    if (!timeline || typeof timeline !== 'string') {
      return 0;
    }

    const timelineLower = timeline.toLowerCase();
    
    if (timelineLower.includes('immediate')) return 100;
    if (timelineLower.includes('hour')) return 80;
    if (timelineLower.includes('day')) return 60;
    if (timelineLower.includes('week')) return 40;
    
    return 20; // Default
  }

  /** Check if timeline indicates urgency */
  private isUrgentTimeline(timeline: string): boolean {
    if (!timeline) return false;
    
    const timelineLower = timeline.toLowerCase();
    return timelineLower.includes('hour') || 
           timelineLower.includes('immediate') ||
           (timelineLower.includes('day') && timelineLower.includes('1'));
  }

  /** Validate recommendations array */
  private validateRecommendations(recommendations: LeadRecommendation[]): void {
    if (!Array.isArray(recommendations)) {
      throw new BusinessRuleViolationError(
        'Recommendations must be provided as an array',
        { 
          operation: 'priorityAnalysis',
          providedType: typeof recommendations 
        }
      );
    }
  }
} 