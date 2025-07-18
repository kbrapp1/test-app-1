/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Generate knowledge insights and recommendations
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Delegate complex calculations to separate methods
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeUtilityService } from '../KnowledgeUtilityService';
import { KnowledgeQualityAnalysisService } from './KnowledgeQualityAnalysisService';
import { 
  KnowledgeInsights, 
  UsagePattern,
  ContentGap 
} from '../types/KnowledgeServiceTypes';

export class KnowledgeInsightsService {

  static async generateInsights(items: KnowledgeItem[]): Promise<KnowledgeInsights> {
    const contentGaps = this.identifyContentGaps(items);
    const popularTags = this.identifyPopularTags(items);
    const contentPatterns = this.analyzeContentPatterns(items);
    const sourceEffectiveness = KnowledgeQualityAnalysisService.analyzeSourceEffectiveness(items);
    const recommendations = this.generateRecommendations(items, contentGaps, popularTags);
    const qualityIssues = KnowledgeQualityAnalysisService.identifyQualityIssues(items);
    const optimizationOpportunities = KnowledgeQualityAnalysisService.identifyOptimizationOpportunities(items);

    return {
      contentGaps,
      popularTags,
      contentPatterns,
      sourceEffectiveness,
      recommendations,
      qualityIssues,
      optimizationOpportunities
    };
  }

  // Content Gap Analysis
  private static identifyContentGaps(items: KnowledgeItem[]): ContentGap[] {
    // Delegate to KnowledgeUtilityService and transform to match expected interface
    const utilityGaps = KnowledgeUtilityService.identifyContentGaps(items);
    
    return utilityGaps.map(gap => ({
      type: gap.type === 'topic' ? 'categorization' : gap.type,
      description: gap.description,
      severity: gap.severity,
      suggestions: gap.recommendations
    }));
  }

  private static identifyContentGapsLegacy(items: KnowledgeItem[]): ContentGap[] {
    const gaps: ContentGap[] = [];
    
    const topicCoverage = this.analyzeTopicCoverage(items);
    const sourceCoverage = this.analyzeSourceCoverage(items);
    const tagCoverage = this.analyzeTagCoverage(items);
    
    if (topicCoverage.gapScore > 0.3) {
      gaps.push({
        type: 'topic',
        description: 'Missing content in key topic areas',
        severity: 'medium',
        suggestions: topicCoverage.suggestions
      });
    }
    
    if (sourceCoverage.gapScore > 0.4) {
      gaps.push({
        type: 'source',
        description: 'Limited source diversity',
        severity: 'low',
        suggestions: sourceCoverage.suggestions
      });
    }
    
    if (tagCoverage.gapScore > 0.5) {
      gaps.push({
        type: 'categorization',
        description: 'Poor content categorization',
        severity: 'high',
        suggestions: tagCoverage.suggestions
      });
    }
    
    return gaps;
  }

  private static identifyPopularTags(items: KnowledgeItem[]): Array<{ tag: string; count: number; percentage: number }> {
    const tagCounts: Record<string, number> = {};
    const totalItems = items.length;
    
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / totalItems) * 100 * 100) / 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static analyzeContentPatterns(items: KnowledgeItem[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];
    
    const lengthPattern = this.analyzeLengthPattern(items);
    const structurePattern = this.analyzeStructurePattern(items);
    const updatePattern = this.analyzeUpdatePattern(items);
    
    patterns.push(lengthPattern, structurePattern, updatePattern);
    
    return patterns.filter(pattern => pattern.confidence > 0.6);
  }

  // Source Effectiveness Analysis - Delegated to Quality Analysis Service

  private static generateRecommendations(
    items: KnowledgeItem[], 
    contentGaps: ContentGap[], 
    popularTags: Array<{ tag: string; count: number; percentage: number }>
  ): string[] {
    const recommendations: string[] = [];
    
    if (contentGaps.length > 0) {
      recommendations.push(`Address ${contentGaps.length} content gaps to improve coverage`);
    }
    
    const itemsWithoutTags = items.filter(item => !item.tags || item.tags.length === 0);
    if (itemsWithoutTags.length > items.length * 0.2) {
      recommendations.push('Tag more content items to improve discoverability');
    }
    
    const staleItems = items.filter(item => {
      const updatedAt = new Date(item.lastUpdated);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return updatedAt < sixMonthsAgo;
    });
    
    if (staleItems.length > items.length * 0.3) {
      recommendations.push('Update stale content to maintain relevance');
    }
    
    if (popularTags.length > 0 && popularTags[0].percentage < 30) {
      recommendations.push('Improve tag consistency across content');
    }
    
    return recommendations;
  }

  // Quality Issues and Optimization Opportunities - Delegated to Quality Analysis Service

  // Helper methods for gap analysis
  private static analyzeTopicCoverage(_items: KnowledgeItem[]): { gapScore: number; suggestions: string[] } {
    const suggestions = [
      'Diversify content across different topics',
      'Create content for underrepresented areas',
      'Balance topic distribution'
    ];
    
    return { gapScore: 0.3, suggestions };
  }

  private static analyzeSourceCoverage(items: KnowledgeItem[]): { gapScore: number; suggestions: string[] } {
    const sources = new Set(items.map(item => item.source || 'unknown'));
    const sourceCount = sources.size;
    const gapScore = sourceCount < 3 ? 0.6 : 0.2;
    
    const suggestions = [
      'Add content from more diverse sources',
      'Include different types of documentation',
      'Expand source variety'
    ];
    
    return { gapScore, suggestions };
  }

  private static analyzeTagCoverage(items: KnowledgeItem[]): { gapScore: number; suggestions: string[] } {
    const itemsWithTags = items.filter(item => item.tags && item.tags.length > 0);
    const coverageRate = itemsWithTags.length / Math.max(items.length, 1);
    const gapScore = 1 - coverageRate;
    
    const suggestions = [
      'Add tags to untagged content',
      'Improve content categorization',
      'Create consistent tagging strategy'
    ];
    
    return { gapScore, suggestions };
  }

  // Pattern analysis methods - Simplified implementations
  private static analyzeLengthPattern(items: KnowledgeItem[]): UsagePattern {
    const avgLength = items.reduce((sum, item) => sum + (item.content?.length || 0), 0) / items.length;
    return {
      type: 'content_length',
      description: `Average content length: ${Math.round(avgLength)} characters`,
      frequency: Math.round(avgLength),
      confidence: 0.8
    };
  }

  private static analyzeStructurePattern(items: KnowledgeItem[]): UsagePattern {
    const structured = items.filter(item => item.content?.includes('•') || item.content?.includes('-')).length;
    return {
      type: 'content_structure',
      description: 'List-based content structure',
      frequency: structured,
      confidence: structured / Math.max(items.length, 1)
    };
  }

  private static analyzeUpdatePattern(items: KnowledgeItem[]): UsagePattern {
    const recent = items.filter(item => {
      const updated = new Date(item.lastUpdated);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return updated >= monthAgo;
    }).length;
    return {
      type: 'update_frequency',
      description: 'Regular content updates',
      frequency: recent,
      confidence: recent / Math.max(items.length, 1)
    };
  }

} 