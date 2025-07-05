/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Create optimization plans and calculate metrics
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on planning optimization strategies and measuring potential impact
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeQualityService } from '../utilities/KnowledgeQualityService';
import { KnowledgeContentStructureService } from './KnowledgeContentStructureService';
import { KnowledgeOptimizationRecommendationService, OptimizationRecommendation } from './KnowledgeOptimizationRecommendationService';

export interface OptimizationPlan {
  quickWins: OptimizationRecommendation[];
  mediumTermGoals: OptimizationRecommendation[];
  longTermStrategies: OptimizationRecommendation[];
  priorityActions: OptimizationRecommendation[];
}

export interface ContentOptimizationMetrics {
  currentScore: number;
  potentialScore: number;
  improvementOpportunity: number;
  keyAreas: Array<{
    area: string;
    currentScore: number;
    targetScore: number;
    impact: number;
  }>;
}

export class KnowledgeOptimizationPlanningService {

  // Generate comprehensive optimization plan
  static generateOptimizationPlan(items: KnowledgeItem[]): OptimizationPlan {
    const recommendations = KnowledgeOptimizationRecommendationService.generateOptimizationRecommendations(items);

    const quickWins = recommendations.filter(rec => 
      rec.effort === 'low' && (rec.estimatedImprovement || 0) >= 10
    );

    const mediumTermGoals = recommendations.filter(rec => 
      rec.effort === 'medium' && rec.priority !== 'low'
    );

    const longTermStrategies = recommendations.filter(rec => 
      rec.effort === 'high' || rec.priority === 'low'
    );

    const priorityActions = recommendations.filter(rec => 
      rec.priority === 'high'
    );

    return {
      quickWins,
      mediumTermGoals,
      longTermStrategies,
      priorityActions
    };
  }

  // Calculate optimization metrics and potential improvements
  static calculateOptimizationMetrics(items: KnowledgeItem[]): ContentOptimizationMetrics {
    const qualityAnalysis = KnowledgeQualityService.analyzeContentQuality(items);
    const structureAnalysis = KnowledgeContentStructureService.analyzeContentStructure(items);
    const consistencyAnalysis = KnowledgeContentStructureService.calculateStructuralConsistency(items);
    const freshnessAnalysis = KnowledgeQualityService.calculateContentFreshness(items);

    const currentScore = Math.round(
      (qualityAnalysis.qualityScore * 0.3 +
       consistencyAnalysis.consistencyScore * 0.25 +
       freshnessAnalysis.freshnessScore * 0.25 +
       this.calculateStructureScore(structureAnalysis, items.length) * 0.2)
    );

    // Calculate potential score after optimizations
    const potentialScore = Math.min(95, currentScore + 25); // Cap at 95 to be realistic

    const improvementOpportunity = potentialScore - currentScore;

    const keyAreas = [
      {
        area: 'Content Quality',
        currentScore: qualityAnalysis.qualityScore,
        targetScore: Math.min(90, qualityAnalysis.qualityScore + 20),
        impact: 30
      },
      {
        area: 'Structure Consistency',
        currentScore: consistencyAnalysis.consistencyScore,
        targetScore: Math.min(85, consistencyAnalysis.consistencyScore + 15),
        impact: 25
      },
      {
        area: 'Content Freshness',
        currentScore: freshnessAnalysis.freshnessScore,
        targetScore: Math.min(90, freshnessAnalysis.freshnessScore + 20),
        impact: 25
      },
      {
        area: 'Structural Organization',
        currentScore: this.calculateStructureScore(structureAnalysis, items.length),
        targetScore: Math.min(85, this.calculateStructureScore(structureAnalysis, items.length) + 15),
        impact: 20
      }
    ];

    return {
      currentScore,
      potentialScore,
      improvementOpportunity,
      keyAreas
    };
  }

  // Create detailed implementation roadmap
  static createImplementationRoadmap(items: KnowledgeItem[]): {
    phases: Array<{
      phase: string;
      duration: string;
      goals: string[];
      deliverables: string[];
      successCriteria: string[];
    }>;
    timeline: string;
    resources: string[];
  } {
    const plan = this.generateOptimizationPlan(items);
    
    const phases = [
      {
        phase: 'Phase 1: Quick Wins',
        duration: '2-4 weeks',
        goals: plan.quickWins.map(rec => rec.recommendation),
        deliverables: [
          'Improved content tagging',
          'Basic structure improvements',
          'Quick quality fixes'
        ],
        successCriteria: [
          'Content quality score increase by 10%',
          'Improved content discoverability',
          'Reduced user friction'
        ]
      },
      {
        phase: 'Phase 2: Medium-term Improvements',
        duration: '1-3 months',
        goals: plan.mediumTermGoals.map(rec => rec.recommendation),
        deliverables: [
          'Comprehensive content restructuring',
          'Quality standardization',
          'Enhanced metadata'
        ],
        successCriteria: [
          'Content quality score increase by 20%',
          'Consistent user experience',
          'Improved content effectiveness'
        ]
      },
      {
        phase: 'Phase 3: Strategic Enhancements',
        duration: '3-6 months',
        goals: plan.longTermStrategies.map(rec => rec.recommendation),
        deliverables: [
          'Complete content overhaul',
          'Advanced optimization features',
          'Comprehensive quality system'
        ],
        successCriteria: [
          'Content quality score > 85%',
          'Optimal user experience',
          'Best-in-class content quality'
        ]
      }
    ];

    return {
      phases,
      timeline: '6-12 months total implementation',
      resources: [
        'Content strategy team',
        'Technical writing resources',
        'Quality assurance process',
        'User feedback system'
      ]
    };
  }

  // Calculate ROI and impact projections
  static calculateOptimizationROI(items: KnowledgeItem[]): {
    expectedBenefits: Array<{
      benefit: string;
      quantifiedImpact: string;
      timeframe: string;
    }>;
    investmentRequired: Array<{
      area: string;
      effort: string;
      resources: string;
    }>;
    roi: {
      shortTerm: string;
      mediumTerm: string;
      longTerm: string;
    };
  } {
    const metrics = this.calculateOptimizationMetrics(items);
    
    const expectedBenefits = [
      {
        benefit: 'Improved user satisfaction',
        quantifiedImpact: `${metrics.improvementOpportunity}% increase in content effectiveness`,
        timeframe: '3-6 months'
      },
      {
        benefit: 'Reduced support burden',
        quantifiedImpact: '20-30% reduction in content-related queries',
        timeframe: '2-4 months'
      },
      {
        benefit: 'Enhanced content discoverability',
        quantifiedImpact: '40-50% improvement in content usage',
        timeframe: '1-3 months'
      }
    ];

    const investmentRequired = [
      {
        area: 'Content improvement',
        effort: 'Medium',
        resources: '2-3 content specialists, 1-2 months'
      },
      {
        area: 'Quality assurance',
        effort: 'Low',
        resources: '1 QA specialist, ongoing'
      },
      {
        area: 'Process optimization',
        effort: 'High',
        resources: '1 process analyst, 3-4 months'
      }
    ];

    return {
      expectedBenefits,
      investmentRequired,
      roi: {
        shortTerm: '150-200% within 3 months',
        mediumTerm: '250-300% within 6 months',
        longTerm: '400-500% within 12 months'
      }
    };
  }

  // Helper methods
  private static calculateStructureScore(structureAnalysis: any, totalItems: number): number {
    const wellStructured = structureAnalysis.structureTypes?.well_structured || 0;
    return Math.round((wellStructured / totalItems) * 100);
  }
} 