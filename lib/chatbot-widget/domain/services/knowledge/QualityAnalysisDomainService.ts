/**
 * Quality Analysis Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Domain service containing pure business logic for content quality analysis
 * - No external dependencies, only domain objects and business rules
 * - Follow @golden-rule patterns exactly
 * - Keep under 100 lines with focused responsibility
 * - Use domain-specific business rules and thresholds
 * - Coordinate between value objects for complex analysis
 */

import { KnowledgeItem } from '../interfaces/IKnowledgeRetrievalService';
import { ContentQualityScore } from '../../value-objects/knowledge/ContentQualityScore';
import { ContentMetrics, ContentCompletenessMetrics, ContentFreshnessMetrics } from '../../value-objects/knowledge/ContentMetrics';

export class QualityAnalysisDomainService {
  
  static analyzeOverallQuality(
    lengthScore: number,
    completenessScore: number,
    freshnessScore: number,
    structureScore: number
  ): ContentQualityScore {
    const issues: string[] = [];
    const strengths: string[] = [];
    
    // Apply business rules for quality assessment
    if (lengthScore < 25) {
      issues.push('Content is too short on average');
    } else {
      strengths.push('Good average content length');
    }
    
    if (completenessScore < 25) {
      issues.push('Content completeness needs improvement');
    } else {
      strengths.push('Good content completeness');
    }
    
    if (freshnessScore < 25) {
      issues.push('Content freshness needs improvement');
    } else {
      strengths.push('Content is relatively fresh');
    }
    
    if (structureScore < 25) {
      issues.push('Content structure needs improvement');
    } else {
      strengths.push('Good content structure');
    }
    
    return ContentQualityScore.create(
      lengthScore,
      completenessScore,
      freshnessScore,
      structureScore,
      issues,
      strengths
    );
  }
  
  static evaluateContentCompleteness(
    itemCount: number,
    itemsWithTitles: number,
    itemsWithContent: number,
    itemsWithTags: number
  ): ContentCompletenessMetrics {
    if (itemCount === 0) {
      return {
        completenessScore: 0,
        missingElements: ['No content items found']
      };
    }
    
    const titleScore = (itemsWithTitles / itemCount) * 100;
    const contentScore = (itemsWithContent / itemCount) * 100;
    const tagScore = (itemsWithTags / itemCount) * 100;
    
    const completenessScore = Math.round((titleScore + contentScore + tagScore) / 3);
    const missingElements: string[] = [];
    
    // Business rules for identifying missing elements
    if (completenessScore < 95) missingElements.push('Some items missing titles or content');
    if (completenessScore < 80) missingElements.push('Many items missing tags');
    if (completenessScore < 90) missingElements.push('Some items missing categories');
    
    return { completenessScore, missingElements };
  }
  
  static evaluateContentFreshness(
    totalItems: number,
    staleItems: number
  ): ContentFreshnessMetrics {
    if (totalItems === 0) {
      return {
        freshnessScore: 0,
        staleItems: 0,
        recommendations: ['Add content items to assess freshness']
      };
    }
    
    const freshnessScore = Math.round(((totalItems - staleItems) / totalItems) * 100);
    const recommendations: string[] = [];
    
    // Business rules for freshness recommendations
    if (freshnessScore < 70) {
      recommendations.push('Update stale content to improve freshness');
    }
    
    if (staleItems > totalItems * 0.3) {
      recommendations.push('Establish a regular content review schedule');
    }
    
    return { freshnessScore, staleItems, recommendations };
  }
  
  static determineQualityThresholds(): {
    lengthThreshold: number;
    completenessThreshold: number;
    freshnessThreshold: number;
    structureThreshold: number;
  } {
    // Business domain thresholds
    return {
      lengthThreshold: 200,
      completenessThreshold: 80,
      freshnessThreshold: 70,
      structureThreshold: 60
    };
  }
}