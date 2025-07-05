/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Core tag analysis including frequency, clustering, and effectiveness
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on fundamental tag analysis operations
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { TagAnalysisResult } from '../types/KnowledgeServiceTypes';

export class KnowledgeTagCoreAnalysisService {

  static async analyzeTags(items: KnowledgeItem[]): Promise<TagAnalysisResult> {
    const tagFrequency = this.calculateTagFrequency(items);
    const tagCooccurrence = this.analyzeTagCooccurrence(items);
    const tagClusters = this.identifyTagClusters(items);
    const unusedTags = this.identifyUnusedTags(items);
    const tagEffectiveness = this.analyzeTagEffectiveness(items);
    const suggestedTags = this.generateTagSuggestions(items);

    return {
      tagFrequency,
      tagCooccurrence,
      tagClusters,
      unusedTags,
      tagEffectiveness,
      suggestedTags
    };
  }

  // Tag frequency analysis
  static calculateTagFrequency(items: KnowledgeItem[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach((tag: string) => {
          frequency[tag] = (frequency[tag] || 0) + 1;
        });
      }
    });
    
    return frequency;
  }

  // Tag co-occurrence analysis
  static analyzeTagCooccurrence(items: KnowledgeItem[]): Record<string, Record<string, number>> {
    const cooccurrence: Record<string, Record<string, number>> = {};
    
    items.forEach(item => {
      if (item.tags && item.tags.length > 1) {
        for (let i = 0; i < item.tags.length; i++) {
          for (let j = i + 1; j < item.tags.length; j++) {
            const tag1 = item.tags[i];
            const tag2 = item.tags[j];
            
            if (!cooccurrence[tag1]) cooccurrence[tag1] = {};
            if (!cooccurrence[tag2]) cooccurrence[tag2] = {};
            
            cooccurrence[tag1][tag2] = (cooccurrence[tag1][tag2] || 0) + 1;
            cooccurrence[tag2][tag1] = (cooccurrence[tag2][tag1] || 0) + 1;
          }
        }
      }
    });
    
    return cooccurrence;
  }

  // Tag clustering analysis
  static identifyTagClusters(items: KnowledgeItem[]): Array<{ cluster: string[]; strength: number }> {
    const cooccurrence = this.analyzeTagCooccurrence(items);
    const clusters: Array<{ cluster: string[]; strength: number }> = [];
    
    // Simple clustering based on high co-occurrence
    Object.entries(cooccurrence).forEach(([tag, cooccurringTags]) => {
      const strongConnections = Object.entries(cooccurringTags)
        .filter(([_, count]) => count >= 3)
        .map(([otherTag, count]) => ({ tag: otherTag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      if (strongConnections.length >= 2) {
        const cluster = [tag, ...strongConnections.map(c => c.tag)];
        const strength = strongConnections.reduce((sum, c) => sum + c.count, 0);
        clusters.push({ cluster, strength });
      }
    });
    
    return clusters.sort((a, b) => b.strength - a.strength).slice(0, 10);
  }

  // Tag effectiveness analysis
  static analyzeTagEffectiveness(items: KnowledgeItem[]): Record<string, { usage: number; effectiveness: number }> {
    const tagEffectiveness: Record<string, { usage: number; effectiveness: number }> = {};
    
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach((tag: string) => {
          if (!tagEffectiveness[tag]) {
            tagEffectiveness[tag] = { usage: 0, effectiveness: 0 };
          }
          tagEffectiveness[tag].usage++;
          tagEffectiveness[tag].effectiveness += this.calculateItemQuality(item);
        });
      }
    });
    
    // Calculate average effectiveness
    Object.keys(tagEffectiveness).forEach(tag => {
      tagEffectiveness[tag].effectiveness = 
        Math.round((tagEffectiveness[tag].effectiveness / tagEffectiveness[tag].usage) * 100) / 100;
    });
    
    return tagEffectiveness;
  }

  // Get popular tags with statistics
  static getPopularTags(items: KnowledgeItem[]): Array<{ tag: string; count: number; percentage: number }> {
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

  // Generate tag suggestions
  static generateTagSuggestions(items: KnowledgeItem[]): string[] {
    const suggestions: string[] = [];
    
    // Find items without tags that could benefit from common tags
    const commonTags = this.getPopularTags(items).slice(0, 5).map(t => t.tag);
    
    items.forEach(item => {
      if (!item.tags || item.tags.length === 0) {
        if (item.content) {
          commonTags.forEach(tag => {
            if (item.content!.toLowerCase().includes(tag.toLowerCase())) {
              suggestions.push(`Add '${tag}' tag to item: ${item.title || item.id}`);
            }
          });
        }
      }
    });
    
    return suggestions.slice(0, 10);
  }

  // Identify unused tags
  static identifyUnusedTags(items: KnowledgeItem[]): string[] {
    const allPossibleTags = this.generatePossibleTags(items);
    const usedTags = new Set(items.flatMap(item => item.tags || []));
    
    return allPossibleTags.filter(tag => !usedTags.has(tag));
  }

  // Helper methods
  private static generatePossibleTags(items: KnowledgeItem[]): string[] {
    const possibleTags = new Set<string>();
    
    items.forEach(item => {
      if (item.content) {
        const words = item.content.toLowerCase().split(/\s+/);
        words.forEach((word: string) => {
          if (word.length > 3 && !this.isCommonWord(word)) {
            possibleTags.add(word);
          }
        });
      }
    });
    
    return Array.from(possibleTags);
  }

  private static isCommonWord(word: string): boolean {
    const commonWords = ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'];
    return commonWords.includes(word.toLowerCase());
  }

  private static calculateItemQuality(item: KnowledgeItem): number {
    let quality = 0;
    
    if (item.content && item.content.length > 100) quality += 0.3;
    if (item.tags && item.tags.length > 0) quality += 0.2;
    if (item.title && item.title.length > 10) quality += 0.2;
    if (item.source) quality += 0.1;
    if (item.relevanceScore > 0.5) quality += 0.2;
    
    return Math.min(quality, 1.0);
  }
} 