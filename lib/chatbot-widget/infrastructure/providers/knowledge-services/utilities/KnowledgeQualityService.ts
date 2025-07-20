/**
 * Knowledge Quality Service
 * 
 * AI INSTRUCTIONS:
 * - Refactored infrastructure facade for content quality operations
 * - Delegates to domain services and infrastructure utilities
 * - Keep under 80 lines per @golden-rule patterns
 * - Maintains backward compatibility with existing API
 * - Acts as composition root for quality analysis
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
// import { ContentQualityScore } from '../../../../domain/value-objects/knowledge/ContentQualityScore';
// import { ContentMetrics } from '../../../../domain/value-objects/knowledge/ContentMetrics';
import { QualityMeasurementService } from './QualityMeasurementService';

export class KnowledgeQualityService {

  static analyzeContentQuality(items: KnowledgeItem[]): { 
    qualityScore: number; 
    issues: string[]; 
    strengths: string[] 
  } {
    const qualityScore = QualityMeasurementService.analyzeContentQuality(items);
    
    return {
      qualityScore: qualityScore.overallScore,
      issues: qualityScore.issues,
      strengths: qualityScore.strengths
    };
  }

  static assessContentCompleteness(items: KnowledgeItem[]): { 
    completenessScore: number; 
    missingElements: string[] 
  } {
    const completeness = QualityMeasurementService.assessContentCompleteness(items);
    return {
      completenessScore: completeness.completenessScore,
      missingElements: completeness.missingElements
    };
  }

  static calculateContentFreshness(items: KnowledgeItem[]): { 
    freshnessScore: number; 
    staleItems: number; 
    recommendations: string[] 
  } {
    const freshness = QualityMeasurementService.calculateContentFreshness(items);
    return {
      freshnessScore: freshness.freshnessScore,
      staleItems: freshness.staleItems,
      recommendations: freshness.recommendations
    };
  }

  static calculateReadabilityMetrics(items: KnowledgeItem[]): { 
    averageReadability: number; 
    distribution: Record<string, number> 
  } {
    return QualityMeasurementService.calculateReadabilityMetrics(items);
  }

  static analyzeContentDuplication(items: KnowledgeItem[]): { 
    duplicateCount: number; 
    duplicateRate: number; 
    examples: string[] 
  } {
    const duplication = QualityMeasurementService.analyzeContentDuplication(items);
    return {
      duplicateCount: duplication.duplicateCount,
      duplicateRate: duplication.duplicateRate,
      examples: duplication.examples
    };
  }

  static analyzeContentStructure(items: KnowledgeItem[]): { 
    structureTypes: Record<string, number>; 
    recommendations: string[] 
  } {
    const structure = QualityMeasurementService.analyzeContentStructure(items);
    return {
      structureTypes: structure.structureTypes,
      recommendations: structure.recommendations
    };
  }

  static identifyContentGaps(items: KnowledgeItem[]): { 
    gaps: string[]; 
    coverage: Record<string, number> 
  } {
    const gaps = QualityMeasurementService.identifyContentGaps(items);
    return {
      gaps: gaps.gaps,
      coverage: gaps.coverage
    };
  }

  static calculateReadabilityScore(item: KnowledgeItem): number {
    return QualityMeasurementService.calculateReadabilityMetrics([item]).averageReadability;
  }

} 