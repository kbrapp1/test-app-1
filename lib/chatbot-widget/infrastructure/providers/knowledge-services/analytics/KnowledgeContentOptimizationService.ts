/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Coordinate content optimization operations
 * - Keep business logic pure, no external dependencies
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on coordinating optimization services and providing unified API
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { 
  KnowledgeOptimizationRecommendationService, 
  OptimizationRecommendation 
} from './KnowledgeOptimizationRecommendationService';
import { 
  KnowledgeOptimizationPlanningService, 
  OptimizationPlan, 
  ContentOptimizationMetrics 
} from './KnowledgeOptimizationPlanningService';

export class KnowledgeContentOptimizationService {

  // Delegate to recommendation service
  static generateOptimizationRecommendations(items: KnowledgeItem[]): OptimizationRecommendation[] {
    return KnowledgeOptimizationRecommendationService.generateOptimizationRecommendations(items);
  }

  // Delegate to planning service
  static generateOptimizationPlan(items: KnowledgeItem[]): OptimizationPlan {
    return KnowledgeOptimizationPlanningService.generateOptimizationPlan(items);
  }

  // Delegate to planning service
  static calculateOptimizationMetrics(items: KnowledgeItem[]): ContentOptimizationMetrics {
    return KnowledgeOptimizationPlanningService.calculateOptimizationMetrics(items);
  }

  // Delegate to recommendation service
  static generateActionItems(items: KnowledgeItem[]): Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    timeline: string;
    successMetrics: string[];
  }> {
    return KnowledgeOptimizationRecommendationService.generateActionItems(items);
  }

  // Delegate to recommendation service
  static analyzeImprovementOpportunities(items: KnowledgeItem[]): {
    contentGaps: Array<{
      gap: string;
      severity: 'high' | 'medium' | 'low';
      recommendation: string;
    }>;
    qualityIssues: Array<{
      issue: string;
      affectedItems: number;
      solution: string;
    }>;
    structuralImprovements: Array<{
      improvement: string;
      benefit: string;
      difficulty: 'easy' | 'moderate' | 'challenging';
    }>;
  } {
    return KnowledgeOptimizationRecommendationService.analyzeImprovementOpportunities(items);
  }

  // Delegate to planning service
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
    return KnowledgeOptimizationPlanningService.createImplementationRoadmap(items);
  }

  // Delegate to planning service
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
    return KnowledgeOptimizationPlanningService.calculateOptimizationROI(items);
  }

  // Comprehensive optimization analysis (coordination method)
  static performComprehensiveOptimizationAnalysis(items: KnowledgeItem[]): {
    recommendations: OptimizationRecommendation[];
    plan: OptimizationPlan;
    metrics: ContentOptimizationMetrics;
    roadmap: {
      phases: Array<{
        phase: string;
        duration: string;
        goals: string[];
        deliverables: string[];
        successCriteria: string[];
      }>;
      timeline: string;
      resources: string[];
    };
    roi: {
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
    };
  } {
    return {
      recommendations: this.generateOptimizationRecommendations(items),
      plan: this.generateOptimizationPlan(items),
      metrics: this.calculateOptimizationMetrics(items),
      roadmap: this.createImplementationRoadmap(items),
      roi: this.calculateOptimizationROI(items)
    };
  }
} 