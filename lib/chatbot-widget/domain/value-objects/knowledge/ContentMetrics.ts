/**
 * Content Metrics Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing content analysis metrics
 * - Encapsulates various content measurements and statistics
 * - Follow @golden-rule patterns exactly
 * - Keep focused on content metrics domain concerns only
 * - Use domain-specific validation and business methods
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export interface ContentCompletenessMetrics {
  completenessScore: number;
  missingElements: string[];
}

export interface ContentFreshnessMetrics {
  freshnessScore: number;
  staleItems: number;
  recommendations: string[];
}

export interface ContentReadabilityMetrics {
  averageReadability: number;
  distribution: Record<string, number>;
}

export interface ContentDuplicationMetrics {
  duplicateCount: number;
  duplicateRate: number;
  examples: string[];
}

export interface ContentStructureMetrics {
  structureTypes: Record<string, number>;
  recommendations: string[];
}

export interface ContentGapMetrics {
  gaps: string[];
  coverage: Record<string, number>;
}

export interface ContentMetricsProps {
  completeness: ContentCompletenessMetrics;
  freshness: ContentFreshnessMetrics;
  readability: ContentReadabilityMetrics;
  duplication: ContentDuplicationMetrics;
  structure: ContentStructureMetrics;
  gaps: ContentGapMetrics;
  totalItems: number;
}

export class ContentMetrics {
  private constructor(private readonly props: ContentMetricsProps) {
    this.validateInvariants();
  }
  
  static create(
    completeness: ContentCompletenessMetrics,
    freshness: ContentFreshnessMetrics,
    readability: ContentReadabilityMetrics,
    duplication: ContentDuplicationMetrics,
    structure: ContentStructureMetrics,
    gaps: ContentGapMetrics,
    totalItems: number
  ): ContentMetrics {
    return new ContentMetrics({
      completeness,
      freshness,
      readability,
      duplication,
      structure,
      gaps,
      totalItems
    });
  }
  
  static fromProps(props: ContentMetricsProps): ContentMetrics {
    return new ContentMetrics(props);
  }
  
  // Getters for immutable access
  get completeness(): ContentCompletenessMetrics { return { ...this.props.completeness }; }
  get freshness(): ContentFreshnessMetrics { return { ...this.props.freshness }; }
  get readability(): ContentReadabilityMetrics { return { ...this.props.readability }; }
  get duplication(): ContentDuplicationMetrics { return { ...this.props.duplication }; }
  get structure(): ContentStructureMetrics { return { ...this.props.structure }; }
  get gaps(): ContentGapMetrics { return { ...this.props.gaps }; }
  get totalItems(): number { return this.props.totalItems; }
  
  // Business methods
  hasHighCompleteness(): boolean {
    return this.props.completeness.completenessScore >= 80;
  }
  
  isFresh(): boolean {
    return this.props.freshness.freshnessScore >= 70;
  }
  
  isReadable(): boolean {
    return this.props.readability.averageReadability >= 0.7;
  }
  
  hasExcessiveDuplication(): boolean {
    return this.props.duplication.duplicateRate > 20;
  }
  
  isWellStructured(): boolean {
    const wellStructured = this.props.structure.structureTypes.well_structured || 0;
    return wellStructured > this.props.totalItems * 0.6;
  }
  
  hasSignificantGaps(): boolean {
    return this.props.gaps.gaps.length > 0 && 
           !this.props.gaps.gaps.includes('No significant content gaps identified');
  }
  
  getOverallHealthScore(): number {
    const scores = [
      this.props.completeness.completenessScore,
      this.props.freshness.freshnessScore,
      this.props.readability.averageReadability * 100,
      Math.max(0, 100 - this.props.duplication.duplicateRate),
      this.isWellStructured() ? 80 : 40
    ];
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }
  
  // Serialization
  toPlainObject(): ContentMetricsProps {
    return { ...this.props };
  }
  
  private validateInvariants(): void {
    if (this.props.totalItems < 0) {
      throw new BusinessRuleViolationError(
        'Total items cannot be negative',
        { totalItems: this.props.totalItems }
      );
    }
    
    if (this.props.completeness.completenessScore < 0 || this.props.completeness.completenessScore > 100) {
      throw new BusinessRuleViolationError(
        'Completeness score must be between 0 and 100',
        { completenessScore: this.props.completeness.completenessScore }
      );
    }
    
    if (this.props.freshness.freshnessScore < 0 || this.props.freshness.freshnessScore > 100) {
      throw new BusinessRuleViolationError(
        'Freshness score must be between 0 and 100',
        { freshnessScore: this.props.freshness.freshnessScore }
      );
    }
  }
}