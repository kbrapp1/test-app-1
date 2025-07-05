/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Analyze content patterns and language structures
 * - Keep business logic pure, no external dependencies
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on pattern detection and language analysis
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeFormatService } from '../utilities/KnowledgeFormatService';

export class KnowledgeContentPatternService {

  // Language Pattern Analysis
  static analyzeLanguagePatterns(items: KnowledgeItem[]): Record<string, number> {
    const patterns: Record<string, number> = {
      'question_based': 0,
      'list_based': 0,
      'narrative': 0,
      'technical': 0,
      'conversational': 0
    };
    
    items.forEach(item => {
      if (item.content) {
        const content = item.content.toLowerCase();
        
        if (content.includes('?') || content.includes('how') || content.includes('what') || content.includes('why')) {
          patterns.question_based++;
        }
        
        if (content.includes('•') || content.includes('-') || content.includes('1.') || content.includes('2.')) {
          patterns.list_based++;
        }
        
        if (content.includes('first') || content.includes('then') || content.includes('finally')) {
          patterns.narrative++;
        }
        
        if (content.includes('api') || content.includes('code') || content.includes('function')) {
          patterns.technical++;
        }
        
        if (content.includes('you') || content.includes('your') || content.includes('we')) {
          patterns.conversational++;
        }
      }
    });
    
    return patterns;
  }

  // Content Flow Analysis
  static analyzeContentFlow(items: KnowledgeItem[]): { flowTypes: Record<string, number>; coherenceScore: number } {
    const flowTypes: Record<string, number> = {
      'linear': 0,
      'branching': 0,
      'circular': 0,
      'fragmented': 0
    };
    
    let totalCoherence = 0;
    
    items.forEach(item => {
      if (!item.content) return;
      
      const content = item.content;
      const flowScore = this.calculateFlowScore(content);
      totalCoherence += flowScore;
      
      if (flowScore >= 0.8) flowTypes.linear++;
      else if (flowScore >= 0.6) flowTypes.branching++;
      else if (flowScore >= 0.4) flowTypes.circular++;
      else flowTypes.fragmented++;
    });
    
    const coherenceScore = items.length > 0 ? totalCoherence / items.length : 0;
    
    return { flowTypes, coherenceScore: Math.round(coherenceScore * 100) / 100 };
  }

  // Content Pattern Identification
  static identifyContentPatterns(items: KnowledgeItem[]): { patterns: Record<string, number>; insights: string[] } {
    const patterns: Record<string, number> = {
      'how_to_guides': 0,
      'reference_docs': 0,
      'explanatory': 0,
      'troubleshooting': 0,
      'conceptual': 0
    };
    
    const insights: string[] = [];
    
    items.forEach(item => {
      if (!item.content) return;
      
      const content = item.content.toLowerCase();
      const title = item.title?.toLowerCase() || '';
      
      if (this.isHowToGuide(content, title)) patterns.how_to_guides++;
      else if (this.isReferenceDoc(content, title)) patterns.reference_docs++;
      else if (this.isExplanatory(content, title)) patterns.explanatory++;
      else if (this.isTroubleshooting(content, title)) patterns.troubleshooting++;
      else patterns.conceptual++;
    });
    
    // Generate insights based on patterns
    const totalItems = items.length;
    if (patterns.how_to_guides > totalItems * 0.4) {
      insights.push('High concentration of how-to guides - consider adding more reference material');
    }
    
    if (patterns.reference_docs > totalItems * 0.5) {
      insights.push('Heavy focus on reference documentation - consider adding more practical examples');
    }
    
    if (patterns.troubleshooting < totalItems * 0.1) {
      insights.push('Low troubleshooting content - consider adding FAQ and problem-solving guides');
    }
    
    return { patterns, insights };
  }

  // Structural Consistency Analysis
  static calculateStructuralConsistency(items: KnowledgeItem[]): { consistencyScore: number; inconsistencies: string[] } {
    const inconsistencies: string[] = [];
    let consistencyScore = 100;
    
    // Check title consistency
    const titleFormats = this.analyzeTitleFormats(items);
    if (titleFormats.variability > 0.5) {
      inconsistencies.push('Inconsistent title formatting detected');
      consistencyScore -= 15;
    }
    
    // Check content structure consistency
    const structureFormats = this.analyzeStructureFormats(items);
    if (structureFormats.variability > 0.6) {
      inconsistencies.push('Inconsistent content structure patterns');
      consistencyScore -= 20;
    }
    
    // Check tag consistency
    const tagFormats = this.analyzeTagFormats(items);
    if (tagFormats.variability > 0.4) {
      inconsistencies.push('Inconsistent tagging patterns');
      consistencyScore -= 10;
    }
    
    return { 
      consistencyScore: Math.max(0, consistencyScore),
      inconsistencies 
    };
  }

  // Helper Methods
  private static calculateFlowScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 0.5;
    
    // Simple flow score based on transition words and sentence connectivity
    const transitionWords = ['however', 'therefore', 'furthermore', 'meanwhile', 'consequently', 'additionally'];
    let transitionCount = 0;
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      transitionWords.forEach(word => {
        if (lowerSentence.includes(word)) transitionCount++;
      });
    });
    
    return Math.min(transitionCount / (sentences.length * 0.3), 1.0);
  }

  private static isHowToGuide(content: string, title: string): boolean {
    return title.includes('how to') || 
           content.includes('step') || 
           content.includes('first') || 
           content.includes('guide');
  }

  private static isReferenceDoc(content: string, title: string): boolean {
    return title.includes('reference') || 
           title.includes('api') || 
           content.includes('parameter') || 
           content.includes('function');
  }

  private static isExplanatory(content: string, title: string): boolean {
    return title.includes('what is') || 
           title.includes('understand') || 
           content.includes('explain') || 
           content.includes('because');
  }

  private static isTroubleshooting(content: string, title: string): boolean {
    return title.includes('troubleshoot') || 
           title.includes('fix') || 
           title.includes('error') || 
           content.includes('problem') || 
           content.includes('issue');
  }

  // Delegate format analysis to simple format service
  private static analyzeTitleFormats(items: KnowledgeItem[]): { variability: number } {
    const titleCheck = KnowledgeFormatService.checkTitleConsistency(items);
    return { variability: (100 - titleCheck.score) / 100 };
  }

  private static analyzeStructureFormats(items: KnowledgeItem[]): { variability: number } {
    const contentCheck = KnowledgeFormatService.checkContentStructure(items);
    return { variability: (100 - contentCheck.score) / 100 };
  }

  private static analyzeTagFormats(items: KnowledgeItem[]): { variability: number } {
    const tagCheck = KnowledgeFormatService.checkTagConsistency(items);
    return { variability: (100 - tagCheck.score) / 100 };
  }
} 