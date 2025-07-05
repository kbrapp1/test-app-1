/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Core content analysis and basic coordination
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on basic content analysis operations
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ContentAnalysisResult } from '../types/KnowledgeServiceTypes';
import { KnowledgeQualityService } from '../utilities/KnowledgeQualityService';
import { KnowledgeContentStructureService } from './KnowledgeContentStructureService';

export class KnowledgeContentAnalysisService {

  static async analyzeContent(items: KnowledgeItem[]): Promise<ContentAnalysisResult> {
    const averageLength = KnowledgeContentAnalysisService.calculateAverageContentLength(items);
    const lengthDistribution = KnowledgeContentStructureService.analyzeLengthDistribution(items);
    const complexityScores = KnowledgeContentStructureService.calculateComplexityScores(items);
    const readabilityMetrics = KnowledgeQualityService.calculateReadabilityMetrics(items);
    const topicClusters = KnowledgeContentStructureService.identifyTopicClusters(items);
    const contentDuplication = KnowledgeQualityService.analyzeContentDuplication(items);
    const languagePatterns = KnowledgeContentStructureService.analyzeLanguagePatterns(items);

    return {
      averageLength,
      lengthDistribution,
      complexityScores,
      readabilityMetrics,
      topicClusters,
      contentDuplication,
      languagePatterns
    };
  }

  static calculateAverageContentLength(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    
    const totalLength = items.reduce((sum, item) => sum + (item.content?.length || 0), 0);
    return Math.round(totalLength / items.length);
  }

  // Basic content statistics
  static getContentStatistics(items: KnowledgeItem[]): {
    totalItems: number;
    averageLength: number;
    totalWords: number;
    averageWords: number;
    contentDistribution: Record<string, number>;
  } {
    const totalItems = items.length;
    const averageLength = KnowledgeContentAnalysisService.calculateAverageContentLength(items);
    
    let totalWords = 0;
    items.forEach(item => {
      if (item.content) {
        const words = item.content.split(/\s+/).filter(word => word.length > 0);
        totalWords += words.length;
      }
    });
    
    const averageWords = totalItems > 0 ? Math.round(totalWords / totalItems) : 0;
    const contentDistribution = KnowledgeContentStructureService.analyzeLengthDistribution(items);

    return {
      totalItems,
      averageLength,
      totalWords,
      averageWords,
      contentDistribution
    };
  }

  // Content validation
  static validateContentQuality(items: KnowledgeItem[]): {
    validItems: number;
    invalidItems: number;
    issues: Array<{ itemId: string; issue: string; severity: 'low' | 'medium' | 'high' }>;
  } {
    const issues: Array<{ itemId: string; issue: string; severity: 'low' | 'medium' | 'high' }> = [];
    let validItems = 0;
    let invalidItems = 0;

    items.forEach(item => {
      let hasIssues = false;

      // Check for missing content
      if (!item.content || item.content.trim().length === 0) {
        issues.push({
          itemId: item.id,
          issue: 'Missing content',
          severity: 'high'
        });
        hasIssues = true;
      }

      // Check for very short content
      if (item.content && item.content.length < 50) {
        issues.push({
          itemId: item.id,
          issue: 'Content too short (less than 50 characters)',
          severity: 'medium'
        });
        hasIssues = true;
      }

      // Check for missing title
      if (!item.title || item.title.trim().length === 0) {
        issues.push({
          itemId: item.id,
          issue: 'Missing title',
          severity: 'medium'
        });
        hasIssues = true;
      }

      // Check for missing tags
      if (!item.tags || item.tags.length === 0) {
        issues.push({
          itemId: item.id,
          issue: 'Missing tags',
          severity: 'low'
        });
        hasIssues = true;
      }

      if (hasIssues) {
        invalidItems++;
      } else {
        validItems++;
      }
    });

    return {
      validItems,
      invalidItems,
      issues
    };
  }

  // Content comparison utilities
  static compareContentSets(setA: KnowledgeItem[], setB: KnowledgeItem[]): {
    setAStats: ReturnType<typeof KnowledgeContentAnalysisService.getContentStatistics>;
    setBStats: ReturnType<typeof KnowledgeContentAnalysisService.getContentStatistics>;
    differences: {
      lengthDifference: number;
      wordCountDifference: number;
      itemCountDifference: number;
    };
    recommendations: string[];
  } {
    const setAStats = KnowledgeContentAnalysisService.getContentStatistics(setA);
    const setBStats = KnowledgeContentAnalysisService.getContentStatistics(setB);

    const differences = {
      lengthDifference: setBStats.averageLength - setAStats.averageLength,
      wordCountDifference: setBStats.averageWords - setAStats.averageWords,
      itemCountDifference: setBStats.totalItems - setAStats.totalItems
    };

    const recommendations: string[] = [];

    if (Math.abs(differences.lengthDifference) > 100) {
      recommendations.push(
        differences.lengthDifference > 0 
          ? 'Set B has significantly longer content on average'
          : 'Set A has significantly longer content on average'
      );
    }

    if (Math.abs(differences.wordCountDifference) > 20) {
      recommendations.push(
        differences.wordCountDifference > 0
          ? 'Set B is more verbose on average'
          : 'Set A is more verbose on average'
      );
    }

    if (differences.itemCountDifference !== 0) {
      recommendations.push(
        differences.itemCountDifference > 0
          ? `Set B has ${differences.itemCountDifference} more items`
          : `Set A has ${Math.abs(differences.itemCountDifference)} more items`
      );
    }

    return {
      setAStats,
      setBStats,
      differences,
      recommendations
    };
  }


} 