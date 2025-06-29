/**
 * Recommendation Prioritizer
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Prioritize and filter recommendation lists
 * - Apply business rules for recommendation ranking
 * - Remove duplicates and optimize recommendation sets
 * - Return structured, prioritized recommendation data
 * - Stay under 200-250 lines
 * - Follow @golden-rule patterns exactly
 */

import { 
  LeadRecommendation, 
  RecommendationPriority, 
  RecommendationCategory 
} from '../../../../domain/value-objects/lead-management/LeadRecommendation';

export class RecommendationPrioritizer {
  /**
   * Prioritize and filter recommendations
   */
  static prioritizeRecommendations(
    recommendations: LeadRecommendation[]
  ): LeadRecommendation[] {
    // Remove duplicates based on action
    const uniqueRecommendations = this.removeDuplicates(recommendations);

    // Sort by priority and category
    const sortedRecommendations = this.sortByPriorityAndCategory(uniqueRecommendations);

    // Limit to top recommendations
    return this.limitToTopRecommendations(sortedRecommendations);
  }

  /**
   * Remove duplicate recommendations based on action
   */
  private static removeDuplicates(recommendations: LeadRecommendation[]): LeadRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const key = rec.action.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort recommendations by priority and category
   */
  private static sortByPriorityAndCategory(
    recommendations: LeadRecommendation[]
  ): LeadRecommendation[] {
    const priorityOrder = this.getPriorityOrder();
    const categoryOrder = this.getCategoryOrder();

    return recommendations.sort((a, b) => {
      // First sort by priority (high -> medium -> low)
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by category importance
      const categoryDiff = categoryOrder[b.category] - categoryOrder[a.category];
      if (categoryDiff !== 0) return categoryDiff;

      // Finally sort by timeline urgency
      return this.compareTimelines(a.timeline, b.timeline);
    });
  }

  /**
   * Get priority order mapping
   */
  private static getPriorityOrder(): Record<RecommendationPriority, number> {
    return { 
      high: 3, 
      medium: 2, 
      low: 1 
    };
  }

  /**
   * Get category order mapping
   */
  private static getCategoryOrder(): Record<RecommendationCategory, number> {
    return { 
      sales_action: 4, 
      qualification_improvement: 3, 
      data_improvement: 2, 
      marketing_action: 1 
    };
  }

  /**
   * Compare timelines for urgency
   */
  private static compareTimelines(timelineA: string, timelineB: string): number {
    const urgencyA = this.getTimelineUrgency(timelineA);
    const urgencyB = this.getTimelineUrgency(timelineB);
    
    return urgencyB - urgencyA; // Higher urgency first
  }

  /**
   * Get timeline urgency score
   */
  private static getTimelineUrgency(timeline: string): number {
    const timelineLower = timeline.toLowerCase();
    
    if (timelineLower.includes('immediate')) return 100;
    if (timelineLower.includes('hour')) {
      const hours = this.extractNumber(timelineLower);
      return Math.max(90 - (hours || 1), 50);
    }
    if (timelineLower.includes('day')) {
      const days = this.extractNumber(timelineLower);
      return Math.max(40 - (days || 1) * 5, 10);
    }
    if (timelineLower.includes('week')) {
      const weeks = this.extractNumber(timelineLower);
      return Math.max(20 - (weeks || 1) * 5, 5);
    }
    
    return 1; // Default low urgency
  }

  /**
   * Extract number from timeline string
   */
  private static extractNumber(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  /**
   * Limit to top recommendations
   */
  private static limitToTopRecommendations(
    recommendations: LeadRecommendation[]
  ): LeadRecommendation[] {
    const maxRecommendations = 8; // Reasonable limit for actionability
    
    // Always include all high priority recommendations
    const highPriority = recommendations.filter(r => r.priority === 'high');
    const remaining = recommendations.filter(r => r.priority !== 'high');
    
    const availableSlots = Math.max(0, maxRecommendations - highPriority.length);
    const selectedRemaining = remaining.slice(0, availableSlots);
    
    return [...highPriority, ...selectedRemaining];
  }

  /**
   * Group recommendations by category
   */
  static groupByCategory(
    recommendations: LeadRecommendation[]
  ): Record<RecommendationCategory, LeadRecommendation[]> {
    const grouped: Record<RecommendationCategory, LeadRecommendation[]> = {
      sales_action: [],
      qualification_improvement: [],
      data_improvement: [],
      marketing_action: []
    };

    recommendations.forEach(rec => {
      grouped[rec.category].push(rec);
    });

    return grouped;
  }

  /**
   * Group recommendations by priority
   */
  static groupByPriority(
    recommendations: LeadRecommendation[]
  ): Record<RecommendationPriority, LeadRecommendation[]> {
    const grouped: Record<RecommendationPriority, LeadRecommendation[]> = {
      high: [],
      medium: [],
      low: []
    };

    recommendations.forEach(rec => {
      grouped[rec.priority].push(rec);
    });

    return grouped;
  }

  /**
   * Get urgent recommendations (immediate or within hours)
   */
  static getUrgentRecommendations(
    recommendations: LeadRecommendation[]
  ): LeadRecommendation[] {
    return recommendations.filter(rec => {
      const timeline = rec.timeline.toLowerCase();
      return timeline.includes('immediate') || 
             timeline.includes('hour') ||
             (timeline.includes('day') && this.extractNumber(timeline) === 1);
    });
  }

  /**
   * Get recommendations by type
   */
  static getRecommendationsByType(
    recommendations: LeadRecommendation[],
    type: string
  ): LeadRecommendation[] {
    return recommendations.filter(rec => rec.type === type);
  }

  /**
   * Calculate recommendation distribution
   */
  static getRecommendationDistribution(
    recommendations: LeadRecommendation[]
  ): {
    byPriority: Record<RecommendationPriority, number>;
    byCategory: Record<RecommendationCategory, number>;
    totalCount: number;
  } {
    const byPriority: Record<RecommendationPriority, number> = {
      high: 0,
      medium: 0,
      low: 0
    };

    const byCategory: Record<RecommendationCategory, number> = {
      sales_action: 0,
      qualification_improvement: 0,
      data_improvement: 0,
      marketing_action: 0
    };

    recommendations.forEach(rec => {
      byPriority[rec.priority]++;
      byCategory[rec.category]++;
    });

    return {
      byPriority,
      byCategory,
      totalCount: recommendations.length
    };
  }
} 