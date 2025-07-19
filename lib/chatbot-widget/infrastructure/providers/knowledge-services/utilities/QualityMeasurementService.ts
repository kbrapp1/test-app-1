/**
 * Quality Measurement Service
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure service implementing quality measurement operations
 * - Coordinates between domain services and utilities for quality analysis
 * - Follow @golden-rule patterns exactly
 * - Keep under 120 lines with focused responsibility
 * - Bridge between domain and infrastructure concerns
 * - Implements concrete measurement algorithms
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ContentQualityScore } from '../../../../domain/value-objects/knowledge/ContentQualityScore';
import { ContentMetrics, ContentCompletenessMetrics, ContentFreshnessMetrics, ContentReadabilityMetrics, ContentDuplicationMetrics, ContentStructureMetrics, ContentGapMetrics } from '../../../../domain/value-objects/knowledge/ContentMetrics';
import { QualityAnalysisDomainService } from '../../../../domain/services/knowledge/QualityAnalysisDomainService';
import { ContentAnalysisUtilities } from './ContentAnalysisUtilities';

export class QualityMeasurementService {
  
  static analyzeContentQuality(items: KnowledgeItem[]): ContentQualityScore {
    const thresholds = QualityAnalysisDomainService.determineQualityThresholds();
    
    // Calculate component scores
    const avgLength = ContentAnalysisUtilities.calculateAverageContentLength(items);
    const lengthScore = avgLength > thresholds.lengthThreshold ? 25 : 0;
    
    const completenessMetrics = this.assessContentCompleteness(items);
    const completenessScore = completenessMetrics.completenessScore > thresholds.completenessThreshold ? 25 : 0;
    
    const freshnessMetrics = this.calculateContentFreshness(items);
    const freshnessScore = freshnessMetrics.freshnessScore > thresholds.freshnessThreshold ? 25 : 0;
    
    const structureScore = this.calculateStructureScore(items) > thresholds.structureThreshold ? 25 : 0;
    
    return QualityAnalysisDomainService.analyzeOverallQuality(
      lengthScore,
      completenessScore,
      freshnessScore,
      structureScore
    );
  }
  
  static assessContentCompleteness(items: KnowledgeItem[]): ContentCompletenessMetrics {
    const itemsWithTitles = ContentAnalysisUtilities.countItemsWithTitles(items);
    const itemsWithContent = ContentAnalysisUtilities.countItemsWithContent(items);
    const itemsWithTags = ContentAnalysisUtilities.countItemsWithTags(items);
    
    return QualityAnalysisDomainService.evaluateContentCompleteness(
      items.length,
      itemsWithTitles,
      itemsWithContent,
      itemsWithTags
    );
  }
  
  static calculateContentFreshness(items: KnowledgeItem[]): ContentFreshnessMetrics {
    const staleItems = ContentAnalysisUtilities.countStaleItems(items);
    return QualityAnalysisDomainService.evaluateContentFreshness(items.length, staleItems);
  }
  
  static calculateReadabilityMetrics(items: KnowledgeItem[]): ContentReadabilityMetrics {
    const readabilityScores = items.map(item => ContentAnalysisUtilities.calculateReadabilityScore(item));
    const average = readabilityScores.reduce((sum, score) => sum + score, 0) / readabilityScores.length;
    
    const distribution = { easy: 0, medium: 0, hard: 0 };
    readabilityScores.forEach(score => {
      if (score >= 0.7) distribution.easy++;
      else if (score >= 0.4) distribution.medium++;
      else distribution.hard++;
    });
    
    return { 
      averageReadability: Math.round(average * 100) / 100, 
      distribution 
    };
  }
  
  static analyzeContentDuplication(items: KnowledgeItem[]): ContentDuplicationMetrics {
    const { duplicateGroups, duplicateCount } = ContentAnalysisUtilities.detectDuplicateContent(items);
    const duplicateRate = items.length > 0 ? (duplicateCount / items.length) * 100 : 0;
    
    const examples = duplicateGroups.slice(0, 3).map(group => 
      `${group.length} items with identical content`
    );
    
    return {
      duplicateCount,
      duplicateRate: Math.round(duplicateRate * 100) / 100,
      examples
    };
  }
  
  static analyzeContentStructure(items: KnowledgeItem[]): ContentStructureMetrics {
    const structureTypes: Record<string, number> = {
      'well_structured': 0,
      'partially_structured': 0,
      'unstructured': 0
    };
    
    items.forEach(item => {
      const structureType = ContentAnalysisUtilities.analyzeContentStructure(item);
      structureTypes[structureType]++;
    });
    
    const recommendations: string[] = [];
    
    if (structureTypes.unstructured > items.length * 0.3) {
      recommendations.push('Add structure to unstructured content using headers, bullets, or numbered lists');
    }
    
    if (structureTypes.partially_structured > items.length * 0.4) {
      recommendations.push('Improve content structure by adding more formatting elements');
    }
    
    return { structureTypes, recommendations };
  }
  
  static identifyContentGaps(items: KnowledgeItem[]): ContentGapMetrics {
    const contentTypes: Record<string, number> = {
      'technical': 0,
      'procedural': 0,
      'descriptive': 0,
      'conversational': 0
    };
    
    items.forEach(item => {
      if (item.content) {
        const type = ContentAnalysisUtilities.categorizeContentType(item.content);
        if (type !== 'unknown') {
          contentTypes[type]++;
        }
      }
    });
    
    const totalItems = items.length;
    const coverage: Record<string, number> = {};
    const gaps: string[] = [];
    
    Object.entries(contentTypes).forEach(([type, count]) => {
      const percentage = (count / totalItems) * 100;
      coverage[type] = Math.round(percentage * 100) / 100;
      
      if (percentage < 10) {
        gaps.push(`Low coverage for ${type} content`);
      }
    });
    
    if (gaps.length === 0) {
      gaps.push('No significant content gaps identified');
    }
    
    return { gaps, coverage };
  }
  
  private static calculateStructureScore(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    
    const structuredItems = items.filter(item => {
      const structureType = ContentAnalysisUtilities.analyzeContentStructure(item);
      return structureType !== 'unstructured';
    }).length;
    
    return Math.round((structuredItems / items.length) * 100);
  }
}