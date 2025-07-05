/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Basic knowledge base comparison
 * - Keep under 100 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - Simple comparisons, no complex analysis
 * - Just compare basic metrics, nothing more
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeHealthService } from './KnowledgeHealthService';

export class KnowledgeComparisonService {

  static compareBasics(currentItems: KnowledgeItem[], previousItems: KnowledgeItem[]): {
    itemsAdded: number;
    itemsRemoved: number;
    netGrowth: number;
    growthRate: number;
  } {
    const itemsAdded = Math.max(0, currentItems.length - previousItems.length);
    const itemsRemoved = Math.max(0, previousItems.length - currentItems.length);
    const netGrowth = currentItems.length - previousItems.length;
    const growthRate = previousItems.length > 0 
      ? ((currentItems.length - previousItems.length) / previousItems.length) * 100 
      : 0;

    return {
      itemsAdded,
      itemsRemoved,
      netGrowth,
      growthRate
    };
  }

  static compareHealth(currentItems: KnowledgeItem[], previousItems: KnowledgeItem[]): {
    currentScore: number;
    previousScore: number;
    improvement: number;
    trend: 'improving' | 'declining' | 'stable';
  } {
    const currentHealth = KnowledgeHealthService.getHealthSummary(currentItems);
    const previousHealth = KnowledgeHealthService.getHealthSummary(previousItems);
    
    const improvement = currentHealth.score - previousHealth.score;
    
    let trend: 'improving' | 'declining' | 'stable';
    if (improvement > 5) trend = 'improving';
    else if (improvement < -5) trend = 'declining';
    else trend = 'stable';

    return {
      currentScore: currentHealth.score,
      previousScore: previousHealth.score,
      improvement,
      trend
    };
  }

  static getComparisonSummary(currentItems: KnowledgeItem[], previousItems: KnowledgeItem[]): {
    growth: ReturnType<typeof KnowledgeComparisonService.compareBasics>;
    health: ReturnType<typeof KnowledgeComparisonService.compareHealth>;
    recommendations: string[];
  } {
    const growth = this.compareBasics(currentItems, previousItems);
    const health = this.compareHealth(currentItems, previousItems);
    const recommendations = this.getBasicRecommendations(growth, health);

    return {
      growth,
      health,
      recommendations
    };
  }

  private static getBasicRecommendations(
    growth: { netGrowth: number; growthRate: number },
    health: { improvement: number; trend: string }
  ): string[] {
    const recommendations: string[] = [];

    if (growth.netGrowth < 0) {
      recommendations.push('Consider adding more content');
    }

    if (growth.growthRate > 50) {
      recommendations.push('Rapid growth - ensure quality controls');
    }

    if (health.trend === 'declining') {
      recommendations.push('Focus on improving content quality');
    }

    if (health.improvement < -10) {
      recommendations.push('Review content maintenance processes');
    }

    if (health.trend === 'improving') {
      recommendations.push('Continue current improvement practices');
    }

    return recommendations.slice(0, 5);
  }

  static isImproving(currentItems: KnowledgeItem[], previousItems: KnowledgeItem[]): boolean {
    const health = this.compareHealth(currentItems, previousItems);
    return health.trend === 'improving';
  }

  static isGrowing(currentItems: KnowledgeItem[], previousItems: KnowledgeItem[]): boolean {
    const growth = this.compareBasics(currentItems, previousItems);
    return growth.netGrowth > 0;
  }
} 