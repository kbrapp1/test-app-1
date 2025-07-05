/**
 * AI INSTRUCTIONS:
 * - Single responsibility: Basic health monitoring and alerts
 * - Keep under 100 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - Simple monitoring, no complex dashboard objects
 * - Just generate alerts and basic health checks
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeHealthService } from './KnowledgeHealthService';

export interface HealthAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'quality' | 'freshness' | 'completeness';
  message: string;
  count: number;
}

export class KnowledgeMonitoringService {

  static generateHealthAlerts(items: KnowledgeItem[]): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    const health = KnowledgeHealthService.getHealthSummary(items);

    // Quality alerts
    if (health.score < 50) {
      alerts.push({
        severity: 'critical',
        type: 'quality',
        message: 'Content quality critically low',
        count: items.length
      });
    } else if (health.score < 70) {
      alerts.push({
        severity: 'medium',
        type: 'quality',
        message: 'Content quality needs attention',
        count: items.length
      });
    }

    // Freshness alerts
    const staleCount = this.countStaleItems(items);
    if (staleCount > items.length * 0.3) {
      alerts.push({
        severity: 'high',
        type: 'freshness',
        message: 'High percentage of stale content',
        count: staleCount
      });
    }

    // Completeness alerts
    const incompleteCount = this.countIncompleteItems(items);
    if (incompleteCount > items.length * 0.2) {
      alerts.push({
        severity: 'medium',
        type: 'completeness',
        message: 'Many items missing required elements',
        count: incompleteCount
      });
    }

    return alerts.sort((a, b) => this.getSeverityOrder(b.severity) - this.getSeverityOrder(a.severity));
  }

  static quickHealthCheck(items: KnowledgeItem[]): {
    isHealthy: boolean;
    score: number;
    needsAttention: boolean;
    alertCount: number;
  } {
    const health = KnowledgeHealthService.getHealthSummary(items);
    const alerts = this.generateHealthAlerts(items);
    
    return {
      isHealthy: health.score >= 75,
      score: health.score,
      needsAttention: health.score < 75,
      alertCount: alerts.length
    };
  }

  static requiresImmediateAttention(items: KnowledgeItem[]): boolean {
    const alerts = this.generateHealthAlerts(items);
    return alerts.some(alert => alert.severity === 'critical');
  }

  static getHealthStatus(items: KnowledgeItem[]): 'excellent' | 'good' | 'needs_attention' | 'poor' {
    const health = KnowledgeHealthService.getHealthSummary(items);
    
    if (health.score >= 90) return 'excellent';
    if (health.score >= 75) return 'good';
    if (health.score >= 60) return 'needs_attention';
    return 'poor';
  }

  private static countStaleItems(items: KnowledgeItem[]): number {
    return items.filter(item => {
      const daysSinceUpdate = item.lastUpdated ? 
        Math.floor((Date.now() - new Date(item.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)) : 
        365;
      return daysSinceUpdate > 90;
    }).length;
  }

  private static countIncompleteItems(items: KnowledgeItem[]): number {
    return items.filter(item => {
      const hasTitle = item.title && item.title.trim().length > 0;
      const hasContent = item.content && item.content.trim().length > 10;
      const hasTags = item.tags && item.tags.length > 0;
      return !hasTitle || !hasContent || !hasTags;
    }).length;
  }

  private static getSeverityOrder(severity: string): number {
    const order = { critical: 4, high: 3, medium: 2, low: 1 };
    return order[severity as keyof typeof order] || 0;
  }
} 