/**
 * AI INSTRUCTIONS:
 * - Single responsibility: Basic content analysis
 * - Keep under 120 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - Simple analysis, no complex metrics
 * - Just analyze content structure, nothing more
 */

import {
  ProductSection,
  ContentAnalysisResult,
  ChunkingStrategy,
  DEFAULT_CHUNKING_STRATEGY
} from '../types/KnowledgeServiceTypes';

export class KnowledgeAnalysisService {

  static analyzeContent(content: string): ContentAnalysisResult {
    const sections = this.identifySections(content);
    const totalLength = content.length;
    const averageSectionLength = sections.length > 0 ? totalLength / sections.length : totalLength;
    
    const hasHeaders = /^(#{1,6}\s+.*|^\d+\.\s+.*|^[A-Z][^.]*:)/gm.test(content);
    const hasBullets = /^[-*]\s+/gm.test(content);
    const hasNumberedLists = /^\d+\.\s+/gm.test(content);
    
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const readabilityScore = this.calculateReadability(avgWordsPerSentence);
    const complexityScore = Math.min(100, avgWordsPerSentence * 3);
    
    return {
      sections,
      totalSections: sections.length,
      averageSectionLength,
      hasStructuredContent: hasHeaders || hasBullets || hasNumberedLists,
      averageLength: totalLength,
      lengthDistribution: {
        'short': sections.filter(s => s.content.length < 500).length,
        'medium': sections.filter(s => s.content.length >= 500 && s.content.length < 1500).length,
        'long': sections.filter(s => s.content.length >= 1500).length
      },
      complexityScores: {
        average: complexityScore,
        distribution: {
          'low': complexityScore < 30 ? 1 : 0,
          'medium': complexityScore >= 30 && complexityScore < 60 ? 1 : 0,
          'high': complexityScore >= 60 ? 1 : 0
        }
      },
      readabilityMetrics: {
        averageReadability: readabilityScore,
        distribution: {
          'easy': readabilityScore > 70 ? 1 : 0,
          'medium': readabilityScore >= 30 && readabilityScore <= 70 ? 1 : 0,
          'difficult': readabilityScore < 30 ? 1 : 0
        }
      },
      topicClusters: [
        {
          topic: 'main_content',
          items: 1,
          keywords: this.extractKeywords(content)
        }
      ],
      contentDuplication: {
        duplicateCount: 0,
        duplicateRate: 0,
        examples: []
      },
      languagePatterns: {
        'english': 1.0
      }
    };
  }

  private static identifySections(content: string): ProductSection[] {
    const sections: ProductSection[] = [];
    const headerPattern = /^(#{1,6}\s+.*|^\d+\.\s+.*|^[A-Z][^.]*:)/gm;
    const headerMatches = Array.from(content.matchAll(headerPattern));
    
    if (headerMatches.length > 1) {
      for (let i = 0; i < headerMatches.length; i++) {
        const currentMatch = headerMatches[i];
        const nextMatch = headerMatches[i + 1];
        
        const startIndex = currentMatch.index!;
        const endIndex = nextMatch ? nextMatch.index! : content.length;
        
        const sectionContent = content.slice(startIndex, endIndex).trim();
        const title = currentMatch[0].replace(/^#{1,6}\s+|^\d+\.\s+|:$/g, '').trim();
        
        sections.push({
          title: title || undefined,
          content: sectionContent
        });
      }
    } else {
      sections.push({
        title: 'Content',
        content: content
      });
    }
    
    return sections;
  }

  private static calculateReadability(avgWordsPerSentence: number): number {
    // Simple readability approximation
    if (avgWordsPerSentence < 10) return 90;
    if (avgWordsPerSentence < 15) return 70;
    if (avgWordsPerSentence < 20) return 50;
    if (avgWordsPerSentence < 25) return 30;
    return 10;
  }

  private static extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
} 