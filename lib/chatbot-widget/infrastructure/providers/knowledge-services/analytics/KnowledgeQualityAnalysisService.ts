/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Analyze knowledge quality issues and optimization opportunities
 * - Keep business logic pure, no external dependencies
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on quality assessment and improvement recommendations
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ContentSimilarityUtilities } from '../../../../domain/utilities/ContentSimilarityUtilities';

export class KnowledgeQualityAnalysisService {

  // Quality Issue Identification
  static identifyQualityIssues(items: KnowledgeItem[]): Array<{ issue: string; count: number; severity: string }> {
    const issues: Array<{ issue: string; count: number; severity: string }> = [];
    
    const missingContent = items.filter(item => !item.content || item.content.trim().length === 0);
    if (missingContent.length > 0) {
      issues.push({
        issue: 'Items missing content',
        count: missingContent.length,
        severity: 'high'
      });
    }
    
    const missingTags = items.filter(item => !item.tags || item.tags.length === 0);
    if (missingTags.length > 0) {
      issues.push({
        issue: 'Items missing tags',
        count: missingTags.length,
        severity: 'medium'
      });
    }
    
    const shortContent = items.filter(item => item.content && item.content.length < 50);
    if (shortContent.length > 0) {
      issues.push({
        issue: 'Items with very short content',
        count: shortContent.length,
        severity: 'low'
      });
    }
    
    const duplicates = this.findDuplicateContent(items);
    if (duplicates.length > 0) {
      issues.push({
        issue: 'Duplicate content detected',
        count: duplicates.length,
        severity: 'medium'
      });
    }
    
    return issues;
  }

  // Optimization Opportunities
  static identifyOptimizationOpportunities(items: KnowledgeItem[]): string[] {
    const opportunities: string[] = [];
    
    const duplicates = this.findDuplicateContent(items);
    if (duplicates.length > 0) {
      opportunities.push(`Consolidate ${duplicates.length} duplicate content items`);
    }
    
    const inconsistentTags = this.findInconsistentTags(items);
    if (inconsistentTags.length > 0) {
      opportunities.push(`Standardize ${inconsistentTags.length} inconsistent tag formats`);
    }
    
    const underutilizedSources = this.findUnderutilizedSources(items);
    if (underutilizedSources.length > 0) {
      opportunities.push(`Expand content from ${underutilizedSources.length} underutilized sources`);
    }
    
    return opportunities;
  }

  // Source Effectiveness Analysis
  static analyzeSourceEffectiveness(items: KnowledgeItem[]): Record<string, { count: number; avgQuality: number; effectiveness: string }> {
    const sourceMetrics: Record<string, { count: number; qualitySum: number; effectiveness: string }> = {};
    
    items.forEach(item => {
      const source = item.source || 'unknown';
      const quality = this.calculateItemQuality(item);
      
      if (!sourceMetrics[source]) {
        sourceMetrics[source] = { count: 0, qualitySum: 0, effectiveness: 'unknown' };
      }
      
      sourceMetrics[source].count++;
      sourceMetrics[source].qualitySum += quality;
    });
    
    const result: Record<string, { count: number; avgQuality: number; effectiveness: string }> = {};
    
    Object.entries(sourceMetrics).forEach(([source, metrics]) => {
      const avgQuality = metrics.qualitySum / metrics.count;
      let effectiveness = 'low';
      
      if (avgQuality >= 0.8) effectiveness = 'high';
      else if (avgQuality >= 0.6) effectiveness = 'medium';
      
      result[source] = {
        count: metrics.count,
        avgQuality: Math.round(avgQuality * 100) / 100,
        effectiveness
      };
    });
    
    return result;
  }

  // Helper Methods
  private static calculateItemQuality(item: KnowledgeItem): number {
    let qualityScore = 0;
    
    if (item.content && item.content.length > 50) qualityScore += 0.3;
    if (item.tags && item.tags.length > 0) qualityScore += 0.3;
    if (item.title && item.title.length > 10) qualityScore += 0.2;
    if (item.relevanceScore && item.relevanceScore > 0.7) qualityScore += 0.2;
    
    return Math.min(qualityScore, 1.0);
  }

  private static findDuplicateContent(items: KnowledgeItem[]): string[] {
    const { duplicateIds } = ContentSimilarityUtilities.findExactDuplicates(items);
    return duplicateIds;
  }

  private static findInconsistentTags(items: KnowledgeItem[]): string[] {
    const tagVariations = new Map<string, Set<string>>();
    const inconsistent: string[] = [];
    
    items.forEach(item => {
      if (!item.tags) return;
      
      item.tags.forEach((tag: string) => {
        const normalized = tag.toLowerCase().replace(/[-_\s]/g, '');
        if (!tagVariations.has(normalized)) {
          tagVariations.set(normalized, new Set());
        }
        tagVariations.get(normalized)!.add(tag);
      });
    });
    
    tagVariations.forEach((variations, _normalized) => {
      if (variations.size > 1) {
        inconsistent.push(...Array.from(variations));
      }
    });
    
    return inconsistent;
  }

  private static findUnderutilizedSources(items: KnowledgeItem[]): string[] {
    const sourceCounts = new Map<string, number>();
    const totalItems = items.length;
    
    items.forEach(item => {
      const source = item.source || 'unknown';
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });
    
    const underutilized: string[] = [];
    const threshold = Math.max(1, Math.floor(totalItems * 0.05)); // 5% threshold
    
    sourceCounts.forEach((count, source) => {
      if (count < threshold && source !== 'unknown') {
        underutilized.push(source);
      }
    });
    
    return underutilized;
  }
} 