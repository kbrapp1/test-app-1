/**
 * Content Analysis Utilities
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure utilities for text analysis and content processing
 * - Contains algorithms, parsing, and measurement implementations
 * - Follow @golden-rule patterns exactly
 * - Keep under 100 lines with focused responsibility
 * - Pure utility functions with no business logic
 * - Stateless analysis algorithms only
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class ContentAnalysisUtilities {
  
  static calculateAverageContentLength(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    const totalLength = items.reduce((sum, item) => sum + (item.content?.length || 0), 0);
    return Math.round(totalLength / items.length);
  }
  
  static countItemsWithTitles(items: KnowledgeItem[]): number {
    return items.filter(item => item.title?.trim().length > 0).length;
  }
  
  static countItemsWithContent(items: KnowledgeItem[]): number {
    return items.filter(item => item.content?.trim().length > 0).length;
  }
  
  static countItemsWithTags(items: KnowledgeItem[]): number {
    return items.filter(item => item.tags?.length > 0).length;
  }
  
  static countStaleItems(items: KnowledgeItem[], monthsThreshold: number = 6): number {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - (monthsThreshold * 30 * 24 * 60 * 60 * 1000));
    
    return items.filter(item => {
      const lastUpdated = new Date(item.lastUpdated);
      return lastUpdated < staleThreshold;
    }).length;
  }
  
  static calculateReadabilityScore(item: KnowledgeItem): number {
    if (!item.content) return 0;
    
    const sentences = item.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = item.content.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    // Simple readability: shorter sentences = higher readability
    return Math.max(0, Math.min(1, 1 - (avgWordsPerSentence - 10) / 20));
  }
  
  static analyzeContentStructure(item: KnowledgeItem): 'well_structured' | 'partially_structured' | 'unstructured' {
    if (!item.content) return 'unstructured';
    
    const content = item.content;
    const hasHeaders = /^#{1,6}\s+.*$/gm.test(content);
    const hasBullets = /^[-*]\s+/gm.test(content);
    const hasNumbers = /^\d+\.\s+/gm.test(content);
    const structureScore = (hasHeaders ? 1 : 0) + (hasBullets ? 1 : 0) + (hasNumbers ? 1 : 0);
    
    if (structureScore >= 2) return 'well_structured';
    if (structureScore === 1) return 'partially_structured';
    return 'unstructured';
  }
  
  static detectDuplicateContent(items: KnowledgeItem[]): { 
    duplicateGroups: string[][]; 
    duplicateCount: number 
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
    
    return { duplicateGroups, duplicateCount };
  }
  
  static categorizeContentType(content: string): 'technical' | 'procedural' | 'descriptive' | 'conversational' | 'unknown' {
    const lowercaseContent = content.toLowerCase();
    
    if (lowercaseContent.includes('api') || lowercaseContent.includes('configuration') || lowercaseContent.includes('technical')) {
      return 'technical';
    }
    
    if (lowercaseContent.includes('step') || lowercaseContent.includes('process') || lowercaseContent.includes('how to')) {
      return 'procedural';
    }
    
    if (lowercaseContent.includes('description') || lowercaseContent.includes('overview') || lowercaseContent.includes('about')) {
      return 'descriptive';
    }
    
    if (lowercaseContent.includes('?') || lowercaseContent.includes('you') || lowercaseContent.includes('we')) {
      return 'conversational';
    }
    
    return 'unknown';
  }
}