/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Generate content optimization recommendations
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on analyzing content and generating actionable recommendations
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeQualityService } from '../utilities/KnowledgeQualityService';
import { KnowledgeContentStructureService } from './KnowledgeContentStructureService';

export interface OptimizationRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  recommendation: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  affectedItems?: number;
  estimatedImprovement?: number;
}

export class KnowledgeOptimizationRecommendationService {

  // Generate content optimization recommendations
  static generateOptimizationRecommendations(items: KnowledgeItem[]): OptimizationRecommendation[] {
    const qualityAnalysis = KnowledgeQualityService.analyzeContentQuality(items);
    const structureAnalysis = KnowledgeContentStructureService.analyzeContentStructure(items);
    const patternAnalysis = KnowledgeContentStructureService.identifyContentPatterns(items);
    const consistencyAnalysis = KnowledgeContentStructureService.calculateStructuralConsistency(items);

    const recommendations: OptimizationRecommendation[] = [];

    // Quality-based recommendations
    if (qualityAnalysis.qualityScore < 70) {
      recommendations.push({
        priority: 'high',
        category: 'Quality',
        recommendation: 'Improve content quality by addressing readability and structure issues',
        impact: 'Significantly improves user experience and content effectiveness',
        effort: 'medium',
        affectedItems: items.length,
        estimatedImprovement: 25
      });
    }

    // Structure-based recommendations
    const unstructuredCount = structureAnalysis.structureTypes.unstructured || 0;
    if (unstructuredCount > items.length * 0.3) {
      recommendations.push({
        priority: 'medium',
        category: 'Structure',
        recommendation: 'Add headers, bullets, and numbered lists to unstructured content',
        impact: 'Improves content scanability and comprehension',
        effort: 'low',
        affectedItems: unstructuredCount,
        estimatedImprovement: 15
      });
    }

    // Pattern-based recommendations
    if (patternAnalysis.patterns.images < items.length * 0.1) {
      recommendations.push({
        priority: 'low',
        category: 'Visual Content',
        recommendation: 'Add more images and diagrams to improve visual appeal',
        impact: 'Enhances user engagement and content retention',
        effort: 'medium',
        affectedItems: items.length - patternAnalysis.patterns.images,
        estimatedImprovement: 10
      });
    }

    // Consistency-based recommendations
    if (consistencyAnalysis.consistencyScore < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'Consistency',
        recommendation: 'Standardize content formatting and structure across all items',
        impact: 'Creates professional appearance and improves user experience',
        effort: 'high',
        affectedItems: items.length,
        estimatedImprovement: 20
      });
    }

    // Tag-based recommendations
    const untaggedItems = items.filter(item => !item.tags || item.tags.length === 0);
    if (untaggedItems.length > items.length * 0.2) {
      recommendations.push({
        priority: 'medium',
        category: 'Metadata',
        recommendation: 'Add relevant tags to improve content discoverability',
        impact: 'Enhances content organization and searchability',
        effort: 'low',
        affectedItems: untaggedItems.length,
        estimatedImprovement: 12
      });
    }

    // Length-based recommendations
    const shortItems = items.filter(item => (item.content?.length || 0) < 100);
    if (shortItems.length > items.length * 0.3) {
      recommendations.push({
        priority: 'low',
        category: 'Content Depth',
        recommendation: 'Expand short content items to provide more comprehensive information',
        impact: 'Increases content value and user satisfaction',
        effort: 'high',
        affectedItems: shortItems.length,
        estimatedImprovement: 18
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Analyze improvement opportunities by category
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
    const recommendations = this.generateOptimizationRecommendations(items);
    
    const contentGaps = this.identifyContentGaps(items);
    const qualityIssues = this.identifyQualityIssues(items);
    const structuralImprovements = this.identifyStructuralImprovements(recommendations);

    return {
      contentGaps,
      qualityIssues,
      structuralImprovements
    };
  }

  // Generate specific action items from recommendations
  static generateActionItems(items: KnowledgeItem[]): Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    timeline: string;
    successMetrics: string[];
  }> {
    const recommendations = this.generateOptimizationRecommendations(items);
    
    return recommendations.map(rec => ({
      action: `Implement ${rec.category} improvements`,
      description: rec.recommendation,
      priority: rec.priority,
      effort: rec.effort,
      timeline: this.getTimelineForEffort(rec.effort),
      successMetrics: this.getSuccessMetrics(rec.category)
    }));
  }

  // Helper methods
  private static identifyContentGaps(items: KnowledgeItem[]): Array<{
    gap: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }> {
    const gaps = [];
    const categories = new Set(items.map(item => item.category));
    
    if (categories.size < 3) {
      gaps.push({
        gap: 'Limited content categories',
        severity: 'medium' as const,
        recommendation: 'Expand content to cover more topic areas'
      });
    }

    const untaggedItems = items.filter(item => !item.tags || item.tags.length === 0);
    if (untaggedItems.length > items.length * 0.3) {
      gaps.push({
        gap: 'Poor content tagging',
        severity: 'high' as const,
        recommendation: 'Add comprehensive tags to improve discoverability'
      });
    }

    return gaps;
  }

  private static identifyQualityIssues(items: KnowledgeItem[]): Array<{
    issue: string;
    affectedItems: number;
    solution: string;
  }> {
    const issues = [];
    
    const shortItems = items.filter(item => (item.content?.length || 0) < 50);
    if (shortItems.length > 0) {
      issues.push({
        issue: 'Content too short',
        affectedItems: shortItems.length,
        solution: 'Expand content with more detailed information'
      });
    }

    const untitledItems = items.filter(item => !item.title || item.title.trim().length === 0);
    if (untitledItems.length > 0) {
      issues.push({
        issue: 'Missing titles',
        affectedItems: untitledItems.length,
        solution: 'Add descriptive titles to all content items'
      });
    }

    return issues;
  }

  private static identifyStructuralImprovements(recommendations: OptimizationRecommendation[]): Array<{
    improvement: string;
    benefit: string;
    difficulty: 'easy' | 'moderate' | 'challenging';
  }> {
    return recommendations
      .filter(rec => rec.category === 'Structure' || rec.category === 'Consistency')
      .map(rec => ({
        improvement: rec.recommendation,
        benefit: rec.impact,
        difficulty: rec.effort === 'low' ? 'easy' as const : 
                   rec.effort === 'medium' ? 'moderate' as const : 'challenging' as const
      }));
  }

  private static getTimelineForEffort(effort: string): string {
    switch (effort) {
      case 'low': return '1-2 weeks';
      case 'medium': return '1-2 months';
      case 'high': return '3-6 months';
      default: return '1-2 weeks';
    }
  }

  private static getSuccessMetrics(category: string): string[] {
    const metricsMap: Record<string, string[]> = {
      'Quality': ['Content quality score > 80%', 'User satisfaction increase', 'Reduced support tickets'],
      'Structure': ['Improved content scanability', 'Reduced time to find information', 'Higher engagement'],
      'Consistency': ['Uniform formatting across content', 'Professional appearance', 'Brand consistency'],
      'Metadata': ['Improved search results', 'Better content discovery', 'Increased content usage'],
      'Visual Content': ['Higher engagement rates', 'Improved retention', 'Better user experience'],
      'Content Depth': ['Increased content value', 'Longer session duration', 'Higher user satisfaction']
    };
    
    return metricsMap[category] || ['Improved content effectiveness', 'Better user experience'];
  }
} 