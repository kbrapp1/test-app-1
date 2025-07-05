/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Analyze knowledge content structure and organization
 * - Keep business logic pure, no external dependencies
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on content structure, hierarchy, and clustering analysis
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeContentPatternService } from './KnowledgeContentPatternService';

export class KnowledgeContentStructureService {

  static analyzeLengthDistribution(items: KnowledgeItem[]): Record<string, number> {
    const distribution = { short: 0, medium: 0, long: 0, very_long: 0 };
    
    items.forEach(item => {
      const length = item.content?.length || 0;
      if (length <= 500) distribution.short++;
      else if (length <= 2000) distribution.medium++;
      else if (length <= 5000) distribution.long++;
      else distribution.very_long++;
    });
    
    return distribution;
  }

  static calculateComplexityScores(items: KnowledgeItem[]): { average: number; distribution: Record<string, number> } {
    const scores = items.map(item => this.calculateContentComplexity(item));
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const distribution = { low: 0, medium: 0, high: 0 };
    scores.forEach(score => {
      if (score <= 0.3) distribution.low++;
      else if (score <= 0.7) distribution.medium++;
      else distribution.high++;
    });
    
    return { average: Math.round(average * 100) / 100, distribution };
  }

  static identifyTopicClusters(items: KnowledgeItem[]): Array<{ topic: string; items: number; keywords: string[] }> {
    const clusters: Array<{ topic: string; items: number; keywords: string[] }> = [];
    
    // Simple clustering based on common keywords
    const keywordGroups = this.groupByKeywords(items);
    
    Object.entries(keywordGroups).forEach(([keyword, itemIds]) => {
      if (itemIds.length >= 3) { // Minimum cluster size
        clusters.push({
          topic: keyword,
          items: itemIds.length,
          keywords: [keyword]
        });
      }
    });
    
    return clusters.sort((a, b) => b.items - a.items).slice(0, 10);
  }

  // Language Pattern Analysis - Delegate to Pattern Service
  static analyzeLanguagePatterns(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeContentPatternService.analyzeLanguagePatterns(items);
  }

  static analyzeContentStructure(items: KnowledgeItem[]): { structureTypes: Record<string, number>; recommendations: string[] } {
    const structureTypes: Record<string, number> = {
      'well_structured': 0,
      'partially_structured': 0,
      'unstructured': 0
    };
    
    const recommendations: string[] = [];
    
    items.forEach(item => {
      if (!item.content) return;
      
      const content = item.content;
      const hasHeaders = /^#{1,6}\s+.*$/gm.test(content);
      const hasBullets = /^[-*]\s+/gm.test(content);
      const hasNumbers = /^\d+\.\s+/gm.test(content);
      const structureScore = (hasHeaders ? 1 : 0) + (hasBullets ? 1 : 0) + (hasNumbers ? 1 : 0);
      
      if (structureScore >= 2) structureTypes.well_structured++;
      else if (structureScore === 1) structureTypes.partially_structured++;
      else structureTypes.unstructured++;
    });
    
    if (structureTypes.unstructured > items.length * 0.3) {
      recommendations.push('Add structure to unstructured content using headers, bullets, or numbered lists');
    }
    
    if (structureTypes.partially_structured > items.length * 0.4) {
      recommendations.push('Improve content structure by adding more formatting elements');
    }
    
    return { structureTypes, recommendations };
  }

  // Helper methods
  private static calculateContentComplexity(item: KnowledgeItem): number {
    if (!item.content) return 0;
    
    const content = item.content;
    const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    const words = content.split(/\s+/).filter((w: string) => w.length > 0);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const avgWordLength = words.reduce((sum: number, word: string) => sum + word.length, 0) / Math.max(words.length, 1);
    
    // Simple complexity score based on sentence length and word length
    const complexity = Math.min((avgWordsPerSentence / 20) + (avgWordLength / 10), 1.0);
    return Math.round(complexity * 100) / 100;
  }

  private static groupByKeywords(items: KnowledgeItem[]): Record<string, string[]> {
    const keywordGroups: Record<string, string[]> = {};
    
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach((tag: string) => {
          if (!keywordGroups[tag]) {
            keywordGroups[tag] = [];
          }
          keywordGroups[tag].push(item.id);
        });
      }
    });
    
    return keywordGroups;
  }

  // Advanced structure analysis methods
  static analyzeContentHierarchy(items: KnowledgeItem[]): { hierarchyLevels: Record<string, number>; recommendations: string[] } {
    const hierarchyLevels: Record<string, number> = {
      'no_hierarchy': 0,
      'single_level': 0,
      'multi_level': 0,
      'deep_hierarchy': 0
    };
    
    const recommendations: string[] = [];
    
    items.forEach(item => {
      if (!item.content) return;
      
      const content = item.content;
      const headerMatches = content.match(/^#{1,6}\s+.*$/gm) || [];
      const headerLevels = headerMatches.map(header => header.match(/^#{1,6}/)?.[0].length || 0);
      const uniqueLevels = new Set(headerLevels).size;
      
      if (uniqueLevels === 0) hierarchyLevels.no_hierarchy++;
      else if (uniqueLevels === 1) hierarchyLevels.single_level++;
      else if (uniqueLevels <= 3) hierarchyLevels.multi_level++;
      else hierarchyLevels.deep_hierarchy++;
    });
    
    if (hierarchyLevels.no_hierarchy > items.length * 0.5) {
      recommendations.push('Add hierarchical structure with headers to improve content organization');
    }
    
    if (hierarchyLevels.deep_hierarchy > items.length * 0.2) {
      recommendations.push('Consider simplifying overly complex hierarchies');
    }
    
    return { hierarchyLevels, recommendations };
  }

  static analyzeContentFlow(items: KnowledgeItem[]): { flowTypes: Record<string, number>; coherenceScore: number } {
    const flowTypes: Record<string, number> = {
      'logical_flow': 0,
      'chronological_flow': 0,
      'categorical_flow': 0,
      'random_flow': 0
    };
    
    let totalCoherenceScore = 0;
    
    items.forEach(item => {
      if (!item.content) return;
      
      const content = item.content.toLowerCase();
      let flowScore = 0;
      
      // Check for logical flow indicators
      if (content.includes('therefore') || content.includes('because') || content.includes('thus') || content.includes('consequently')) {
        flowTypes.logical_flow++;
        flowScore += 1;
      }
      
      // Check for chronological flow indicators
      if (content.includes('first') || content.includes('then') || content.includes('next') || content.includes('finally')) {
        flowTypes.chronological_flow++;
        flowScore += 1;
      }
      
      // Check for categorical flow indicators
      if (content.includes('additionally') || content.includes('furthermore') || content.includes('also') || content.includes('moreover')) {
        flowTypes.categorical_flow++;
        flowScore += 1;
      }
      
      if (flowScore === 0) {
        flowTypes.random_flow++;
      }
      
      totalCoherenceScore += Math.min(flowScore, 1);
    });
    
    const coherenceScore = items.length > 0 ? (totalCoherenceScore / items.length) * 100 : 0;
    
    return {
      flowTypes,
      coherenceScore: Math.round(coherenceScore * 100) / 100
    };
  }

  // Content Pattern Identification - Delegate to Pattern Service
  static identifyContentPatterns(items: KnowledgeItem[]): { patterns: Record<string, number>; insights: string[] } {
    return KnowledgeContentPatternService.identifyContentPatterns(items);
  }

  // Structural Consistency Analysis - Delegate to Pattern Service
  static calculateStructuralConsistency(items: KnowledgeItem[]): { consistencyScore: number; inconsistencies: string[] } {
    return KnowledgeContentPatternService.calculateStructuralConsistency(items);
  }
} 