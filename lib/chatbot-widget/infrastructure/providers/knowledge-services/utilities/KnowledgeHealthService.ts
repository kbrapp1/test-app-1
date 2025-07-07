/**
 * AI INSTRUCTIONS: Utility service for knowledge item health scoring.
 * Static methods for simple health checks. @golden-rule: <100 lines.
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class KnowledgeHealthService {

  static calculateHealthScore(item: KnowledgeItem): number {
    let score = 0;
    
    // Title check (25%)
    if (item.title && item.title.length > 5) {
      score += 25;
    }
    
    // Content check (40%)
    if (item.content && item.content.length > 50) {
      score += 40;
    }
    
    // Tags check (15%)
    if (item.tags && item.tags.length > 0) {
      score += 15;
    }
    
    // Freshness check (20%)
    if (item.lastUpdated) {
      const daysSinceUpdate = (Date.now() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) {
        score += 20;
      } else if (daysSinceUpdate < 90) {
        score += 10;
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
      return daysSinceUpdate > 90;
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