/**
 * AI INSTRUCTIONS:
 * - Single responsibility: Basic format consistency checking
 * - Keep under 150 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - No complex interfaces or over-engineering
 * - Just pattern checking, nothing more
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class KnowledgeFormatService {

  static checkTitleConsistency(items: KnowledgeItem[]): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;
    
    if (items.length === 0) return { score: 0, issues: ['No items to analyze'] };

    const titlePatterns = {
      hasQuestionMarks: 0,
      hasColons: 0,
      allCaps: 0,
      hasNumbers: 0,
      veryShort: 0,
      veryLong: 0
    };

    items.forEach(item => {
      const title = item.title || '';
      
      if (title.includes('?')) titlePatterns.hasQuestionMarks++;
      if (title.includes(':')) titlePatterns.hasColons++;
      if (title === title.toUpperCase() && title.length > 3) titlePatterns.allCaps++;
      if (/\d/.test(title)) titlePatterns.hasNumbers++;
      if (title.length < 10) titlePatterns.veryShort++;
      if (title.length > 100) titlePatterns.veryLong++;
    });

    const total = items.length;
    
    // Check for inconsistencies
    if (titlePatterns.veryShort > total * 0.3) {
      issues.push('Many titles are very short (< 10 chars)');
      score -= 15;
    }
    
    if (titlePatterns.veryLong > total * 0.1) {
      issues.push('Some titles are very long (> 100 chars)');
      score -= 10;
    }
    
    if (titlePatterns.allCaps > total * 0.2) {
      issues.push('Too many titles in ALL CAPS');
      score -= 20;
    }

    return { score: Math.max(0, score), issues };
  }

  static checkTagConsistency(items: KnowledgeItem[]): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;
    
    if (items.length === 0) return { score: 0, issues: ['No items to analyze'] };

    const tagPatterns = {
      inconsistentCase: 0,
      tooManyTags: 0,
      noTags: 0,
      duplicateTags: 0
    };

    items.forEach(item => {
      const tags = item.tags || [];
      
      if (tags.length === 0) {
        tagPatterns.noTags++;
      } else {
        if (tags.length > 10) tagPatterns.tooManyTags++;
        
        // Check for case inconsistency
        const hasUpperCase = tags.some(tag => /[A-Z]/.test(tag));
        const hasLowerCase = tags.some(tag => /[a-z]/.test(tag));
        if (hasUpperCase && hasLowerCase) tagPatterns.inconsistentCase++;
        
        // Check for duplicates
        if (new Set(tags).size !== tags.length) tagPatterns.duplicateTags++;
      }
    });

    const total = items.length;
    
    if (tagPatterns.noTags > total * 0.2) {
      issues.push('Many items have no tags');
      score -= 25;
    }
    
    if (tagPatterns.tooManyTags > total * 0.1) {
      issues.push('Some items have too many tags (> 10)');
      score -= 15;
    }
    
    if (tagPatterns.inconsistentCase > total * 0.3) {
      issues.push('Inconsistent tag capitalization');
      score -= 20;
    }
    
    if (tagPatterns.duplicateTags > 0) {
      issues.push('Some items have duplicate tags');
      score -= 10;
    }

    return { score: Math.max(0, score), issues };
  }

  static checkContentStructure(items: KnowledgeItem[]): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;
    
    if (items.length === 0) return { score: 0, issues: ['No items to analyze'] };

    const structurePatterns = {
      tooShort: 0,
      noStructure: 0,
      inconsistentFormatting: 0
    };

    items.forEach(item => {
      const content = item.content || '';
      
      if (content.length < 50) {
        structurePatterns.tooShort++;
      }
      
      // Check for basic structure indicators
      const hasHeaders = /#{1,6}\s/.test(content);
      const hasBullets = /^[\s]*[-*+]\s/m.test(content);
      const hasNumbers = /^[\s]*\d+\.\s/m.test(content);
      
      if (!hasHeaders && !hasBullets && !hasNumbers && content.length > 200) {
        structurePatterns.noStructure++;
      }
    });

    const total = items.length;
    
    if (structurePatterns.tooShort > total * 0.4) {
      issues.push('Many items have very short content (< 50 chars)');
      score -= 20;
    }
    
    if (structurePatterns.noStructure > total * 0.3) {
      issues.push('Many items lack clear structure (headers, lists)');
      score -= 25;
    }

    return { score: Math.max(0, score), issues };
  }

  static getOverallFormatScore(items: KnowledgeItem[]): { score: number; breakdown: Record<string, unknown>; allIssues: string[] } {
    const titleCheck = this.checkTitleConsistency(items);
    const tagCheck = this.checkTagConsistency(items);
    const contentCheck = this.checkContentStructure(items);
    
    const overallScore = Math.round(
      (titleCheck.score * 0.3 + tagCheck.score * 0.4 + contentCheck.score * 0.3)
    );
    
    const allIssues = [
      ...titleCheck.issues,
      ...tagCheck.issues,
      ...contentCheck.issues
    ];

    return {
      score: overallScore,
      breakdown: {
        title: titleCheck.score,
        tags: tagCheck.score,
        content: contentCheck.score
      },
      allIssues
    };
  }
} 