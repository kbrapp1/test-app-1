/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Tag quality, consistency, and distribution analysis
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on tag quality assessment and improvement recommendations
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeTagCoreAnalysisService } from './KnowledgeTagCoreAnalysisService';

export class KnowledgeTagQualityService {

  // Analyze tag consistency across content
  static analyzeTagConsistency(items: KnowledgeItem[]): { 
    consistencyScore: number; 
    issues: string[]; 
    recommendations: string[] 
  } {
    const tagVariations = new Map<string, Set<string>>();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach((tag: string) => {
          const normalized = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!tagVariations.has(normalized)) {
            tagVariations.set(normalized, new Set());
          }
          tagVariations.get(normalized)!.add(tag);
        });
      }
    });
    
    const inconsistentTags = Array.from(tagVariations.entries())
      .filter(([_, variations]) => variations.size > 1);
    
    const totalTags = Array.from(tagVariations.keys()).length;
    const consistencyScore = totalTags > 0 ? ((totalTags - inconsistentTags.length) / totalTags) * 100 : 100;
    
    inconsistentTags.forEach(([normalized, variations]) => {
      const variationList = Array.from(variations).join(', ');
      issues.push(`Tag variations found: ${variationList}`);
      recommendations.push(`Standardize tag variations for: ${normalized}`);
    });
    
    return {
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      issues: issues.slice(0, 10),
      recommendations: recommendations.slice(0, 10)
    };
  }

  // Identify gaps in tag coverage
  static identifyTagGaps(items: KnowledgeItem[]): { 
    gaps: string[]; 
    coverage: number; 
    suggestions: string[] 
  } {
    const itemsWithTags = items.filter(item => item.tags && item.tags.length > 0);
    const coverage = (itemsWithTags.length / items.length) * 100;
    
    const gaps: string[] = [];
    const suggestions: string[] = [];
    
    if (coverage < 50) {
      gaps.push('Low overall tag coverage');
      suggestions.push('Add tags to untagged content items');
    }
    
    if (coverage < 80) {
      gaps.push('Moderate tag coverage - room for improvement');
      suggestions.push('Review and tag remaining content');
    }
    
    // Analyze content without tags for potential tag suggestions
    const untaggedItems = items.filter(item => !item.tags || item.tags.length === 0);
    if (untaggedItems.length > 0) {
      gaps.push(`${untaggedItems.length} items without tags`);
      suggestions.push('Implement automated tag suggestion for untagged content');
    }
    
    // Check for content categories that might be under-tagged
    const categoryAnalysis = this.analyzeCategoryTagging(items);
    if (categoryAnalysis.underTaggedCategories.length > 0) {
      gaps.push('Some content categories are under-tagged');
      suggestions.push('Focus tagging efforts on under-represented categories');
    }
    
    return {
      gaps,
      coverage: Math.round(coverage * 100) / 100,
      suggestions
    };
  }

  // Analyze tag distribution patterns
  static analyzeTagDistribution(items: KnowledgeItem[]): { 
    distribution: Record<string, number>; 
    balance: string; 
    recommendations: string[] 
  } {
    const tagCounts = KnowledgeTagCoreAnalysisService.calculateTagFrequency(items);
    const totalTags = Object.values(tagCounts).reduce((sum, count) => sum + count, 0);
    
    const distribution: Record<string, number> = {};
    Object.entries(tagCounts).forEach(([tag, count]) => {
      distribution[tag] = Math.round((count / totalTags) * 100 * 100) / 100;
    });
    
    const values = Object.values(distribution);
    const maxUsage = Math.max(...values);
    const minUsage = Math.min(...values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - (totalTags / values.length), 2), 0) / values.length;
    
    let balance = 'balanced';
    const recommendations: string[] = [];
    
    if (maxUsage > 50) {
      balance = 'dominated';
      recommendations.push('Tag distribution is dominated by few tags - diversify tagging');
    } else if (variance > 100) {
      balance = 'uneven';
      recommendations.push('Tag usage is uneven - balance tag distribution');
    }
    
    if (minUsage < 1) {
      recommendations.push('Some tags are rarely used - consider consolidating or removing');
    }
    
    // Additional distribution analysis
    const overusedTags = Object.entries(distribution)
      .filter(([_, percentage]) => percentage > 25)
      .map(([tag, _]) => tag);
    
    if (overusedTags.length > 0) {
      recommendations.push(`Consider splitting overused tags: ${overusedTags.join(', ')}`);
    }
    
    const underusedTags = Object.entries(distribution)
      .filter(([_, percentage]) => percentage < 2)
      .map(([tag, _]) => tag);
    
    if (underusedTags.length > 5) {
      recommendations.push('Many underused tags detected - consider tag consolidation');
    }
    
    return { distribution, balance, recommendations };
  }

  // Comprehensive tag quality assessment
  static assessTagQuality(items: KnowledgeItem[]): {
    overallScore: number;
    qualityMetrics: {
      consistency: number;
      coverage: number;
      distribution: number;
      effectiveness: number;
    };
    issues: string[];
    recommendations: string[];
  } {
    const consistencyAnalysis = this.analyzeTagConsistency(items);
    const gapAnalysis = this.identifyTagGaps(items);
    const distributionAnalysis = this.analyzeTagDistribution(items);
    const effectivenessAnalysis = KnowledgeTagCoreAnalysisService.analyzeTagEffectiveness(items);
    
    // Calculate effectiveness score
    const effectivenessValues = Object.values(effectivenessAnalysis).map(e => e.effectiveness);
    const avgEffectiveness = effectivenessValues.length > 0 
      ? effectivenessValues.reduce((sum, val) => sum + val, 0) / effectivenessValues.length * 100
      : 0;
    
    const distributionScore = distributionAnalysis.balance === 'balanced' ? 85 : 
                             distributionAnalysis.balance === 'uneven' ? 65 : 45;
    
    const qualityMetrics = {
      consistency: consistencyAnalysis.consistencyScore,
      coverage: gapAnalysis.coverage,
      distribution: distributionScore,
      effectiveness: Math.round(avgEffectiveness)
    };
    
    const overallScore = Math.round(
      (qualityMetrics.consistency * 0.25 +
       qualityMetrics.coverage * 0.3 +
       qualityMetrics.distribution * 0.25 +
       qualityMetrics.effectiveness * 0.2)
    );
    
    const allIssues = [
      ...consistencyAnalysis.issues,
      ...gapAnalysis.gaps,
      ...distributionAnalysis.recommendations.filter(r => r.includes('issue') || r.includes('problem'))
    ];
    
    const allRecommendations = [
      ...consistencyAnalysis.recommendations,
      ...gapAnalysis.suggestions,
      ...distributionAnalysis.recommendations
    ];
    
    return {
      overallScore,
      qualityMetrics,
      issues: allIssues.slice(0, 10),
      recommendations: allRecommendations.slice(0, 10)
    };
  }

  // Helper methods
  private static analyzeCategoryTagging(items: KnowledgeItem[]): {
    categoryTagging: Record<string, { total: number; tagged: number; coverage: number }>;
    underTaggedCategories: string[];
  } {
    const categoryStats: Record<string, { total: number; tagged: number }> = {};
    
    items.forEach(item => {
      const category = item.category || 'uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, tagged: 0 };
      }
      categoryStats[category].total++;
      if (item.tags && item.tags.length > 0) {
        categoryStats[category].tagged++;
      }
    });
    
    const categoryTagging: Record<string, { total: number; tagged: number; coverage: number }> = {};
    const underTaggedCategories: string[] = [];
    
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const coverage = (stats.tagged / stats.total) * 100;
      categoryTagging[category] = {
        total: stats.total,
        tagged: stats.tagged,
        coverage: Math.round(coverage * 100) / 100
      };
      
      if (coverage < 60) {
        underTaggedCategories.push(category);
      }
    });
    
    return { categoryTagging, underTaggedCategories };
  }
} 