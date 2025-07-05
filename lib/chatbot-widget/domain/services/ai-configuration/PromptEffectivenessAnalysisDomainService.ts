/**
 * Prompt Effectiveness Analysis Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for conversation effectiveness analysis
 * - No external dependencies, only domain calculations
 * - Keep under 250 lines by focusing on effectiveness metrics
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: effectiveness measurement and scoring
 */

import {
  PromptMetrics,
  EffectivenessAnalysis,
  PERFORMANCE_THRESHOLDS
} from './types/PromptPerformanceTypes';

export class PromptEffectivenessAnalysisDomainService {
  
  /**
   * Analyze conversation effectiveness metrics
   * 
   * AI INSTRUCTIONS:
   * - Core domain method for effectiveness analysis
   * - Calculate comprehensive effectiveness scores
   * - Provide normalized metrics for comparison
   */
  static analyzeEffectiveness(metrics: PromptMetrics): EffectivenessAnalysis {
    return {
      responseRelevance: this.normalizeMetric(metrics.responseRelevance, 1.0),
      entityExtractionAccuracy: this.normalizeMetric(metrics.entityExtractionAccuracy, 1.0),
      leadQualificationAccuracy: this.normalizeMetric(metrics.leadQualificationAccuracy, 1.0),
      conversationProgression: this.normalizeMetric(metrics.conversationProgression, 1.0),
      userEngagement: this.normalizeMetric(metrics.userEngagement, 10.0), // Scale from 10
      conversionRate: this.normalizeMetric(metrics.conversionRate, 1.0),
      averageSessionLength: this.normalizeSessionLength(metrics.averageSessionLength),
      escalationRate: this.normalizeEscalationRate(metrics.escalationRate)
    };
  }

  /**
   * Calculate overall effectiveness score
   * 
   * AI INSTRUCTIONS:
   * - Weighted average of all effectiveness metrics
   * - Higher weights for business-critical metrics
   * - Returns score between 0 and 1
   */
  static calculateOverallEffectivenessScore(analysis: EffectivenessAnalysis): number {
    const weights = {
      responseRelevance: 0.25,        // Critical for user satisfaction
      entityExtractionAccuracy: 0.15, // Important for lead capture
      leadQualificationAccuracy: 0.20, // Business critical
      conversationProgression: 0.15,  // User experience
      userEngagement: 0.10,           // Engagement quality
      conversionRate: 0.10,           // Business outcome
      averageSessionLength: 0.03,     // Minor indicator
      escalationRate: 0.02            // Negative indicator
    };

    return (
      analysis.responseRelevance * weights.responseRelevance +
      analysis.entityExtractionAccuracy * weights.entityExtractionAccuracy +
      analysis.leadQualificationAccuracy * weights.leadQualificationAccuracy +
      analysis.conversationProgression * weights.conversationProgression +
      analysis.userEngagement * weights.userEngagement +
      analysis.conversionRate * weights.conversionRate +
      analysis.averageSessionLength * weights.averageSessionLength +
      (1 - analysis.escalationRate) * weights.escalationRate // Inverse for escalation
    );
  }

  /**
   * Identify effectiveness improvement opportunities
   * 
   * AI INSTRUCTIONS:
   * - Analyze weak points in effectiveness metrics
   * - Prioritize improvements by business impact
   * - Return actionable improvement areas
   */
  static identifyImprovementOpportunities(analysis: EffectivenessAnalysis): EffectivenessImprovement[] {
    const improvements: EffectivenessImprovement[] = [];
    
    // Response relevance improvements
    if (analysis.responseRelevance < PERFORMANCE_THRESHOLDS.responseRelevance) {
      improvements.push({
        metric: 'responseRelevance',
        currentScore: analysis.responseRelevance,
        targetScore: PERFORMANCE_THRESHOLDS.responseRelevance,
        gap: PERFORMANCE_THRESHOLDS.responseRelevance - analysis.responseRelevance,
        priority: this.calculateImprovementPriority('responseRelevance', analysis.responseRelevance),
        recommendations: this.getResponseRelevanceRecommendations(analysis.responseRelevance)
      });
    }

    // Entity extraction improvements
    if (analysis.entityExtractionAccuracy < 0.8) {
      improvements.push({
        metric: 'entityExtractionAccuracy',
        currentScore: analysis.entityExtractionAccuracy,
        targetScore: 0.8,
        gap: 0.8 - analysis.entityExtractionAccuracy,
        priority: this.calculateImprovementPriority('entityExtractionAccuracy', analysis.entityExtractionAccuracy),
        recommendations: this.getEntityExtractionRecommendations(analysis.entityExtractionAccuracy)
      });
    }

    // Lead qualification improvements
    if (analysis.leadQualificationAccuracy < 0.75) {
      improvements.push({
        metric: 'leadQualificationAccuracy',
        currentScore: analysis.leadQualificationAccuracy,
        targetScore: 0.75,
        gap: 0.75 - analysis.leadQualificationAccuracy,
        priority: this.calculateImprovementPriority('leadQualificationAccuracy', analysis.leadQualificationAccuracy),
        recommendations: this.getLeadQualificationRecommendations(analysis.leadQualificationAccuracy)
      });
    }

    // Conversation progression improvements
    if (analysis.conversationProgression < 0.7) {
      improvements.push({
        metric: 'conversationProgression',
        currentScore: analysis.conversationProgression,
        targetScore: 0.7,
        gap: 0.7 - analysis.conversationProgression,
        priority: this.calculateImprovementPriority('conversationProgression', analysis.conversationProgression),
        recommendations: this.getConversationProgressionRecommendations(analysis.conversationProgression)
      });
    }

    // User engagement improvements
    if (analysis.userEngagement < 0.6) {
      improvements.push({
        metric: 'userEngagement',
        currentScore: analysis.userEngagement,
        targetScore: 0.6,
        gap: 0.6 - analysis.userEngagement,
        priority: this.calculateImprovementPriority('userEngagement', analysis.userEngagement),
        recommendations: this.getUserEngagementRecommendations(analysis.userEngagement)
      });
    }

    return improvements.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Normalize metric to 0-1 scale
   */
  private static normalizeMetric(value: number | undefined, maxValue: number): number {
    if (value === undefined || value === null) return 0;
    return Math.min(Math.max(value / maxValue, 0), 1);
  }

  /**
   * Normalize session length to effectiveness score
   */
  private static normalizeSessionLength(sessionLength: number | undefined): number {
    if (!sessionLength) return 0;
    
    // Optimal session length is 3-8 minutes (180-480 seconds)
    const optimal = 300; // 5 minutes
    const max = 480; // 8 minutes
    
    if (sessionLength <= optimal) {
      return sessionLength / optimal;
    } else if (sessionLength <= max) {
      return 1.0 - (0.3 * (sessionLength - optimal) / (max - optimal));
    } else {
      return Math.max(0.4, 0.7 * Math.exp(-(sessionLength - max) / 300));
    }
  }

  /**
   * Normalize escalation rate (lower is better)
   */
  private static normalizeEscalationRate(escalationRate: number | undefined): number {
    if (!escalationRate) return 1.0; // No escalations is perfect
    return Math.max(0, 1 - escalationRate);
  }

  /**
   * Calculate improvement priority
   */
  private static calculateImprovementPriority(metric: string, currentScore: number): number {
    const businessImpact = {
      responseRelevance: 0.9,
      leadQualificationAccuracy: 0.8,
      entityExtractionAccuracy: 0.7,
      conversationProgression: 0.6,
      userEngagement: 0.5,
      conversionRate: 0.8,
      averageSessionLength: 0.3,
      escalationRate: 0.4
    };

    const urgency = 1 - currentScore; // Lower scores are more urgent
    const impact = businessImpact[metric as keyof typeof businessImpact] || 0.5;
    
    return (urgency * 0.6) + (impact * 0.4);
  }

  /**
   * Get response relevance improvement recommendations
   */
  private static getResponseRelevanceRecommendations(currentScore: number): string[] {
    if (currentScore < 0.5) {
      return [
        'Completely revise core persona instructions',
        'Implement context-aware response generation',
        'Add industry-specific response templates',
        'Improve intent classification accuracy'
      ];
    } else if (currentScore < 0.7) {
      return [
        'Refine persona behavioral guidelines',
        'Add more specific context injection rules',
        'Improve knowledge base relevance scoring',
        'Enhance conversation flow logic'
      ];
    } else {
      return [
        'Fine-tune response tone and style',
        'Add more nuanced context understanding',
        'Optimize response length and structure'
      ];
    }
  }

  /**
   * Get entity extraction improvement recommendations
   */
  private static getEntityExtractionRecommendations(currentScore: number): string[] {
    if (currentScore < 0.5) {
      return [
        'Redesign entity extraction prompts',
        'Add comprehensive entity examples',
        'Implement multi-pass extraction strategy',
        'Add validation and correction loops'
      ];
    } else {
      return [
        'Refine entity extraction patterns',
        'Add context-specific entity rules',
        'Improve entity confidence scoring'
      ];
    }
  }

  /**
   * Get lead qualification improvement recommendations
   */
  private static getLeadQualificationRecommendations(currentScore: number): string[] {
    if (currentScore < 0.5) {
      return [
        'Revise lead qualification criteria',
        'Add progressive qualification strategy',
        'Implement qualification confidence scoring',
        'Add qualification validation steps'
      ];
    } else {
      return [
        'Fine-tune qualification thresholds',
        'Add industry-specific qualification rules',
        'Improve qualification timing'
      ];
    }
  }

  /**
   * Get conversation progression improvement recommendations
   */
  private static getConversationProgressionRecommendations(currentScore: number): string[] {
    return [
      'Improve conversation flow management',
      'Add natural transition prompts',
      'Implement conversation stage tracking',
      'Optimize question sequencing'
    ];
  }

  /**
   * Get user engagement improvement recommendations
   */
  private static getUserEngagementRecommendations(currentScore: number): string[] {
    return [
      'Add more engaging conversation starters',
      'Implement personalization strategies',
      'Improve response timing and pacing',
      'Add interactive elements'
    ];
  }
}

// Supporting interfaces
export interface EffectivenessImprovement {
  metric: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  priority: number;
  recommendations: string[];
} 