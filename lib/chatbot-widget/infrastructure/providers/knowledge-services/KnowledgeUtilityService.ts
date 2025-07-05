/**
 * Knowledge Content Gap Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Content gap analysis and identification
 * - Keep business logic pure, no external dependencies
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on identifying content gaps and providing recommendations
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeContentHashingService } from './utilities/KnowledgeContentHashingService';
import { KnowledgeValidationService } from './utilities/KnowledgeValidationService';
import { KnowledgeGroupingService } from './utilities/KnowledgeGroupingService';
import { KnowledgeFormatService } from './utilities/KnowledgeFormatService';

export interface ContentGap {
  type: 'topic' | 'source' | 'format' | 'quality';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedItems: number;
  recommendations: string[];
}

export class KnowledgeUtilityService {

  // Backward compatibility - delegate to specialized services
  static generateContentHash(content: string): string {
    return KnowledgeContentHashingService.generateContentHash(content);
  }

  static generateItemContentHash(item: KnowledgeItem): string {
    return KnowledgeContentHashingService.generateItemContentHash(item);
  }

  // Content Gap Analysis Utilities
  static identifyContentGaps(items: KnowledgeItem[]): ContentGap[] {
    const gaps: ContentGap[] = [];
    
    // Analyze topic coverage
    const topicGaps = this.analyzeTopicGaps(items);
    gaps.push(...topicGaps);
    
    // Analyze source diversity
    const sourceGaps = this.analyzeSourceGaps(items);
    gaps.push(...sourceGaps);
    
    // Analyze content format gaps
    const formatGaps = this.analyzeFormatGaps(items);
    gaps.push(...formatGaps);
    
    // Analyze quality gaps
    const qualityGaps = this.analyzeQualityGaps(items);
    gaps.push(...qualityGaps);
    
    return gaps.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  // Backward compatibility - delegate to specialized services
  static validateContentQuality(items: KnowledgeItem[]) {
    return KnowledgeValidationService.validateContentQuality(items);
  }

  // Private Helper Methods
  private static analyzeTopicGaps(items: KnowledgeItem[]): ContentGap[] {
    const gaps: ContentGap[] = [];
    const allTags = items.flatMap(item => item.tags || []);
    const tagCounts = new Map<string, number>();
    
    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    // Identify under-represented topics
    const totalItems = items.length;
    const underRepresentedThreshold = Math.max(1, Math.floor(totalItems * 0.05)); // 5% threshold

    tagCounts.forEach((count, tag) => {
      if (count < underRepresentedThreshold) {
        gaps.push({
          type: 'topic',
          description: `Low coverage for topic: ${tag}`,
          severity: count === 1 ? 'high' : 'medium',
          affectedItems: count,
          recommendations: [
            `Add more content related to ${tag}`,
            `Consider creating comprehensive guides for ${tag}`,
            `Review existing ${tag} content for quality improvements`
          ]
        });
      }
    });

    return gaps;
  }

  private static analyzeSourceGaps(items: KnowledgeItem[]): ContentGap[] {
    const gaps: ContentGap[] = [];
    const sources = new Set(items.map(item => item.source || 'unknown'));
    
    if (sources.size < 3) {
      gaps.push({
        type: 'source',
        description: 'Limited source diversity',
        severity: 'medium',
        affectedItems: items.length,
        recommendations: [
          'Diversify content sources',
          'Add content from different perspectives',
          'Include multiple authoritative sources'
        ]
      });
    }

    return gaps;
  }

  private static analyzeFormatGaps(items: KnowledgeItem[]): ContentGap[] {
    const gaps: ContentGap[] = [];
    const avgLength = items.reduce((sum, item) => sum + (item.content?.length || 0), 0) / items.length;
    
    if (avgLength < 100) {
      gaps.push({
        type: 'format',
        description: 'Content too brief on average',
        severity: 'medium',
        affectedItems: items.filter(item => (item.content?.length || 0) < 100).length,
        recommendations: [
          'Expand brief content with more details',
          'Add examples and explanations',
          'Include context and background information'
        ]
      });
    }

    return gaps;
  }

  private static analyzeQualityGaps(items: KnowledgeItem[]): ContentGap[] {
    const gaps: ContentGap[] = [];
    const itemsWithoutTags = items.filter(item => !item.tags || item.tags.length === 0);
    
    if (itemsWithoutTags.length > items.length * 0.2) { // More than 20% without tags
      gaps.push({
        type: 'quality',
        description: 'Many items lack proper tagging',
        severity: 'high',
        affectedItems: itemsWithoutTags.length,
        recommendations: [
          'Add relevant tags to untagged content',
          'Review and improve tagging consistency',
          'Implement automated tagging where possible'
        ]
      });
    }

    return gaps;
  }

  private static getSeverityWeight(severity: 'low' | 'medium' | 'high'): number {
    switch (severity) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  // Backward compatibility - delegate to simple utility services
  static groupItemsByField(items: KnowledgeItem[], field: keyof KnowledgeItem): Record<string, number> {
    return KnowledgeGroupingService.groupByField(items, field);
  }

  static calculateTagDistribution(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeGroupingService.groupByTags(items);
  }

  static calculateContentLengthDistribution(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeGroupingService.groupByContentLength(items);
  }

  static analyzeTitleFormats(items: KnowledgeItem[]): { variability: number } {
    const titleCheck = KnowledgeFormatService.checkTitleConsistency(items);
    return { variability: (100 - titleCheck.score) / 100 };
  }

  static analyzeStructureFormats(items: KnowledgeItem[]): { variability: number } {
    const contentCheck = KnowledgeFormatService.checkContentStructure(items);
    return { variability: (100 - contentCheck.score) / 100 };
  }

  static analyzeTagFormats(items: KnowledgeItem[]): { variability: number } {
    const tagCheck = KnowledgeFormatService.checkTagConsistency(items);
    return { variability: (100 - tagCheck.score) / 100 };
  }
} 