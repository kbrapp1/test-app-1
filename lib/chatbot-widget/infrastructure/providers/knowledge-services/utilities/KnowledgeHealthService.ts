/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Basic health scoring
 * - Keep under 100 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - Simple health checks, no complex analysis
 * - Just calculate health scores, nothing more
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class KnowledgeHealthService {
  // Scoring weights (must sum to 100)
  private static readonly TITLE_WEIGHT = 25;
  private static readonly CONTENT_WEIGHT = 40;
  private static readonly TAGS_WEIGHT = 15;
  private static readonly FRESHNESS_WEIGHT = 20;

  // Content thresholds
  private static readonly MIN_TITLE_LENGTH = 5;
  private static readonly MIN_CONTENT_LENGTH = 50;

  // Freshness thresholds (in days)
  private static readonly FRESH_THRESHOLD_DAYS = 30;
  private static readonly MODERATE_THRESHOLD_DAYS = 90;

  static calculateHealthScore(item: KnowledgeItem): number {
    let score = 0;
    
    // Title check (25%)
    if (item.title && item.title.length > this.MIN_TITLE_LENGTH) {
      score += this.TITLE_WEIGHT;
    }
    
    // Content check (40%)
    if (item.content && item.content.length > this.MIN_CONTENT_LENGTH) {
      score += this.CONTENT_WEIGHT;
    }
    
    // Tags check (15%)
    if (item.tags && item.tags.length > 0) {
      score += this.TAGS_WEIGHT;
    }
    
    // Freshness check (20%)
    if (item.lastUpdated) {
      const daysSinceUpdate =
        (Date.now() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < this.FRESH_THRESHOLD_DAYS) {
        score += this.FRESHNESS_WEIGHT;
      } else if (daysSinceUpdate < this.MODERATE_THRESHOLD_DAYS) {
        score += this.FRESHNESS_WEIGHT / 2;
      }
    }
    
    return score;
  }

  static isHealthy(item: KnowledgeItem): boolean {
    return this.calculateHealthScore(item) >= 75;
  }

  static getHealthStatus(score: number): 'excellent' | 'good' | 'needs_attention' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'needs_attention';
    return 'poor';
  }

  static calculateBatchHealth(items: KnowledgeItem[]): {
    averageScore: number;
    healthyCount: number;
    needsAttentionCount: number;
    poorCount: number;
    staleCount: number;
  } {
    const scores = items.map(item => this.calculateHealthScore(item));
    const averageScore = scores.length === 0 ? 0 : scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const healthyCount = scores.filter(score => score >= 75).length;
    const needsAttentionCount = scores.filter(score => score >= 60 && score < 75).length;
    const poorCount = scores.filter(score => score < 60).length;
    
    const staleCount = items.filter(item => {
      if (!item.lastUpdated) return true;
      const daysSinceUpdate = (Date.now() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > this.MODERATE_THRESHOLD_DAYS;
    }).length;
    
    return {
      averageScore: Math.round(averageScore),
      healthyCount,
      needsAttentionCount,
      poorCount,
      staleCount
    };
  }

  static filterHealthy(items: KnowledgeItem[]): KnowledgeItem[] {
    return items.filter(item => this.isHealthy(item));
  }

  static filterNeedsAttention(items: KnowledgeItem[]): KnowledgeItem[] {
    return items.filter(item => {
      const score = this.calculateHealthScore(item);
      return score >= 60 && score < 75;
    });
  }

  static filterPoor(items: KnowledgeItem[]): KnowledgeItem[] {
    return items.filter(item => this.calculateHealthScore(item) < 60);
  }

  static getHealthSummary(items: KnowledgeItem[]): {
    isHealthy: boolean;
    score: number;
    status: string;
    issuesCount: number;
  } {
    const batchHealth = this.calculateBatchHealth(items);
    const issuesCount = batchHealth.needsAttentionCount + batchHealth.poorCount;
    
    return {
      isHealthy: batchHealth.averageScore >= 75,
      score: batchHealth.averageScore,
      status: this.getHealthStatus(batchHealth.averageScore),
      issuesCount
    };
  }
} 