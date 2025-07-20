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
import { ContentSimilarityUtilities } from '../../../../domain/utilities/ContentSimilarityUtilities';

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
      if (!item.lastUpdated) return false;
      const lastUpdated = new Date(item.lastUpdated);
      if (isNaN(lastUpdated.getTime())) return false; // Invalid date check
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
    const { duplicateGroups, duplicateCount } = ContentSimilarityUtilities.findExactDuplicates(items);
    
    return {
      duplicateGroups: duplicateGroups.map(group => group.items.map(item => item.id)),
      duplicateCount
    };
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