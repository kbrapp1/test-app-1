/**
 * ContentStatisticsService Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle for content statistics
 * - Never exceed 250 lines - refactor into smaller services if needed
 * - Follow @golden-rule patterns exactly
 * - Focus on content analysis and metrics calculation only
 * - Return immutable value objects for statistics
 */

import { ContentType } from '../../value-objects/content/ContentType';

export interface ContentStatistics {
  readonly characterCount: number;
  readonly wordCount: number;
  readonly lineCount: number;
  readonly paragraphCount: number;
  readonly sentenceCount: number;
  readonly hasMarkdownHeaders: boolean;
  readonly hasExcessiveWhitespace: boolean;
  readonly averageWordsPerSentence: number;
  readonly readingTimeMinutes: number;
}

export class ContentStatisticsService {
  private static readonly AVERAGE_READING_SPEED_WPM = 200;

  // AI: Calculate comprehensive content statistics for given content
  calculateStatistics(content: string, _contentType?: ContentType): ContentStatistics {
    this.validateInput(content);
    
    const trimmedContent = content.trim();
    
    return Object.freeze({
      characterCount: content.length,
      wordCount: this.calculateWordCount(trimmedContent),
      lineCount: this.calculateLineCount(content),
      paragraphCount: this.calculateParagraphCount(trimmedContent),
      sentenceCount: this.calculateSentenceCount(trimmedContent),
      hasMarkdownHeaders: this.hasMarkdownHeaders(content),
      hasExcessiveWhitespace: this.hasExcessiveWhitespace(content),
      averageWordsPerSentence: this.calculateAverageWordsPerSentence(trimmedContent),
      readingTimeMinutes: this.calculateReadingTime(trimmedContent)
    });
  }

  // AI: Generate content analysis suggestions based on statistics
  generateSuggestions(statistics: ContentStatistics, maxLength?: number): string[] {
    const suggestions: string[] = [];
    
    if (statistics.hasMarkdownHeaders) {
      suggestions.push('Consider removing markdown headers (##, ###) as they may conflict with system formatting');
    }
    
    if (statistics.hasExcessiveWhitespace) {
      suggestions.push('Remove excessive line breaks for cleaner formatting');
    }
    
    if (maxLength && statistics.characterCount > maxLength * 0.9) {
      suggestions.push(`Content is approaching the ${maxLength} character limit`);
    }
    
    if (statistics.averageWordsPerSentence > 25) {
      suggestions.push('Consider breaking up long sentences for better readability');
    }
    
    if (statistics.paragraphCount === 1 && statistics.wordCount > 100) {
      suggestions.push('Consider breaking content into multiple paragraphs for better structure');
    }
    
    return suggestions;
  }

  // AI: Check if content meets quality thresholds
  assessContentQuality(statistics: ContentStatistics): {
    isHighQuality: boolean;
    qualityScore: number;
    recommendations: string[];
  } {
    let score = 100;
    const recommendations: string[] = [];
    
    // Penalize excessive line breaks
    if (statistics.hasExcessiveWhitespace) {
      score -= 10;
      recommendations.push('Clean up excessive whitespace');
    }
    
    // Penalize markdown headers
    if (statistics.hasMarkdownHeaders) {
      score -= 15;
      recommendations.push('Remove markdown headers');
    }
    
    // Penalize very long sentences
    if (statistics.averageWordsPerSentence > 30) {
      score -= 20;
      recommendations.push('Shorten sentences for clarity');
    }
    
    // Penalize very short content (less than 10 words)
    if (statistics.wordCount < 10 && statistics.wordCount > 0) {
      score -= 25;
      recommendations.push('Consider adding more detail');
    }
    
    return {
      isHighQuality: score >= 70,
      qualityScore: Math.max(0, score),
      recommendations
    };
  }

  // AI: Calculate word count, handling empty content and multiple spaces
  private calculateWordCount(content: string): number {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  // AI: Calculate line count including empty lines
  private calculateLineCount(content: string): number {
    return content.split('\n').length;
  }

  // AI: Calculate paragraph count by splitting on double line breaks
  private calculateParagraphCount(content: string): number {
    if (!content) return 0;
    return content.split(/\n\s*\n/).filter(para => para.trim().length > 0).length;
  }

  // AI: Calculate sentence count using sentence-ending punctuation
  private calculateSentenceCount(content: string): number {
    if (!content) return 0;
    const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    return sentences.length;
  }

  // AI: Check for markdown headers that conflict with system prompts
  private hasMarkdownHeaders(content: string): boolean {
    return /^#{1,6}\s/.test(content);
  }

  // AI: Check for excessive whitespace patterns
  private hasExcessiveWhitespace(content: string): boolean {
    return /\n{3,}/.test(content) || /[ \t]{3,}/.test(content);
  }

  // AI: Calculate average words per sentence for readability assessment
  private calculateAverageWordsPerSentence(content: string): number {
    const wordCount = this.calculateWordCount(content);
    const sentenceCount = this.calculateSentenceCount(content);
    
    if (sentenceCount === 0) return 0;
    return Math.round((wordCount / sentenceCount) * 10) / 10;
  }

  // AI: Estimate reading time based on average reading speed
  private calculateReadingTime(content: string): number {
    const wordCount = this.calculateWordCount(content);
    const minutes = wordCount / ContentStatisticsService.AVERAGE_READING_SPEED_WPM;
    return Math.max(0.1, Math.round(minutes * 10) / 10);
  }

  // AI: Validate input parameters
  private validateInput(content: string): void {
    if (typeof content !== 'string') {
      throw new Error('Content must be a string');
    }
  }
}