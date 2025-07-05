/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Basic content quality assessment
 * - Keep under 120 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - Simple quality scoring, no complex analysis
 * - Just assess basic quality factors
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class KnowledgeQualityService {

  static analyzeContentQuality(items: KnowledgeItem[]): { 
    qualityScore: number; 
    issues: string[]; 
    strengths: string[] 
  } {
    const issues: string[] = [];
    const strengths: string[] = [];
    let qualityScore = 0;
    
    // Length assessment
    const avgLength = this.getAverageContentLength(items);
    if (avgLength > 200) {
      qualityScore += 25;
      strengths.push('Good average content length');
    } else {
      issues.push('Content is too short on average');
    }
    
    // Completeness assessment
    const completeness = this.getCompletenessScore(items);
    if (completeness > 80) {
      qualityScore += 25;
      strengths.push('Good content completeness');
    } else {
      issues.push('Content completeness needs improvement');
    }
    
    // Freshness assessment
    const freshness = this.getFreshnessScore(items);
    if (freshness > 70) {
      qualityScore += 25;
      strengths.push('Content is relatively fresh');
    } else {
      issues.push('Content freshness needs improvement');
    }
    
    // Structure assessment
    const structure = this.getStructureScore(items);
    if (structure > 60) {
      qualityScore += 25;
      strengths.push('Good content structure');
    } else {
      issues.push('Content structure needs improvement');
    }
    
    return { qualityScore, issues, strengths };
  }

  static assessContentCompleteness(items: KnowledgeItem[]): { 
    completenessScore: number; 
    missingElements: string[] 
  } {
    if (items.length === 0) {
      return { completenessScore: 0, missingElements: ['No content items found'] };
    }

    const missingElements: string[] = [];
    const completenessScore = this.getCompletenessScore(items);

    if (completenessScore < 95) missingElements.push('Some items missing titles or content');
    if (completenessScore < 80) missingElements.push('Many items missing tags');
    if (completenessScore < 90) missingElements.push('Some items missing categories');

    return { completenessScore, missingElements };
  }

  static calculateContentFreshness(items: KnowledgeItem[]): { 
    freshnessScore: number; 
    staleItems: number; 
    recommendations: string[] 
  } {
    if (items.length === 0) {
      return { freshnessScore: 0, staleItems: 0, recommendations: ['Add content items to assess freshness'] };
    }

    const staleItems = this.countStaleItems(items);
    const freshnessScore = Math.round(((items.length - staleItems) / items.length) * 100);
    const recommendations: string[] = [];

    if (freshnessScore < 70) {
      recommendations.push('Update stale content to improve freshness');
    }
    if (staleItems > items.length * 0.3) {
      recommendations.push('Establish a regular content review schedule');
    }

    return { freshnessScore, staleItems, recommendations };
  }

  static calculateReadabilityMetrics(items: KnowledgeItem[]): { 
    averageReadability: number; 
    distribution: Record<string, number> 
  } {
    const readabilityScores = items.map(item => this.getReadabilityScore(item));
    const average = readabilityScores.reduce((sum, score) => sum + score, 0) / readabilityScores.length;
    
    const distribution = { easy: 0, medium: 0, hard: 0 };
    readabilityScores.forEach(score => {
      if (score >= 0.7) distribution.easy++;
      else if (score >= 0.4) distribution.medium++;
      else distribution.hard++;
    });
    
    return { averageReadability: Math.round(average * 100) / 100, distribution };
  }

  static analyzeContentDuplication(items: KnowledgeItem[]): { 
    duplicateCount: number; 
    duplicateRate: number; 
    examples: string[] 
  } {
    const contentMap = new Map<string, string[]>();
    
    items.forEach(item => {
      if (item.content) {
        const normalized = item.content.toLowerCase().trim();
        if (!contentMap.has(normalized)) {
          contentMap.set(normalized, []);
        }
        contentMap.get(normalized)!.push(item.id);
      }
    });
    
    const duplicateGroups = Array.from(contentMap.values()).filter(group => group.length > 1);
    const duplicateCount = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);
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

  static analyzeContentStructure(items: KnowledgeItem[]): { 
    structureTypes: Record<string, number>; 
    recommendations: string[] 
  } {
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

  static identifyContentGaps(items: KnowledgeItem[]): { 
    gaps: string[]; 
    coverage: Record<string, number> 
  } {
    // Simple gap analysis based on content patterns
    const contentTypes = this.analyzeContentTypes(items);
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

  static calculateReadabilityScore(item: KnowledgeItem): number {
    return this.getReadabilityScore(item);
  }

  private static getAverageContentLength(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    const totalLength = items.reduce((sum, item) => sum + (item.content?.length || 0), 0);
    return Math.round(totalLength / items.length);
  }

  private static getCompletenessScore(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    
    const itemsWithTitles = items.filter(item => item.title?.trim().length > 0).length;
    const itemsWithContent = items.filter(item => item.content?.trim().length > 0).length;
    const itemsWithTags = items.filter(item => item.tags?.length > 0).length;
    
    const titleScore = (itemsWithTitles / items.length) * 100;
    const contentScore = (itemsWithContent / items.length) * 100;
    const tagScore = (itemsWithTags / items.length) * 100;
    
    return Math.round((titleScore + contentScore + tagScore) / 3);
  }

  private static getFreshnessScore(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    const staleItems = this.countStaleItems(items);
    return Math.round(((items.length - staleItems) / items.length) * 100);
  }

  private static getStructureScore(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    
    const structuredItems = items.filter(item => {
      if (!item.content) return false;
      const content = item.content;
      const hasHeaders = /^#{1,6}\s+.*$/gm.test(content);
      const hasBullets = /^[-*]\s+/gm.test(content);
      const hasNumbers = /^\d+\.\s+/gm.test(content);
      return hasHeaders || hasBullets || hasNumbers;
    }).length;
    
    return Math.round((structuredItems / items.length) * 100);
  }

  private static countStaleItems(items: KnowledgeItem[]): number {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000)); // 6 months
    
    return items.filter(item => {
      const lastUpdated = new Date(item.lastUpdated);
      return lastUpdated < staleThreshold;
    }).length;
  }

  private static getReadabilityScore(item: KnowledgeItem): number {
    if (!item.content) return 0;
    
    const sentences = item.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = item.content.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    // Simple readability: shorter sentences = higher readability
    return Math.max(0, Math.min(1, 1 - (avgWordsPerSentence - 10) / 20));
  }

  private static analyzeContentTypes(items: KnowledgeItem[]): Record<string, number> {
    const types: Record<string, number> = {
      'technical': 0,
      'procedural': 0,
      'descriptive': 0,
      'conversational': 0
    };

    items.forEach(item => {
      if (!item.content) return;
      
      const content = item.content.toLowerCase();
      
      if (content.includes('api') || content.includes('configuration') || content.includes('technical')) {
        types.technical++;
      }
      
      if (content.includes('step') || content.includes('process') || content.includes('how to')) {
        types.procedural++;
      }
      
      if (content.includes('description') || content.includes('overview') || content.includes('about')) {
        types.descriptive++;
      }
      
      if (content.includes('?') || content.includes('you') || content.includes('we')) {
        types.conversational++;
      }
    });

    return types;
  }
} 