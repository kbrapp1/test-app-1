/**
 * Content Quality Score Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing content quality assessment
 * - Encapsulates quality score with business rules and thresholds
 * - Follow @golden-rule patterns exactly
 * - Keep focused on quality score domain concerns only
 * - Use domain-specific validation and business methods
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export interface ContentQualityScoreProps {
  qualityScore: number;
  issues: string[];
  strengths: string[];
  lengthScore: number;
  completenessScore: number;
  freshnessScore: number;
  structureScore: number;
}

export class ContentQualityScore {
  private constructor(private readonly props: ContentQualityScoreProps) {
    this.validateInvariants();
  }
  
  static create(
    lengthScore: number,
    completenessScore: number,
    freshnessScore: number,
    structureScore: number,
    issues: string[] = [],
    strengths: string[] = []
  ): ContentQualityScore {
    const qualityScore = lengthScore + completenessScore + freshnessScore + structureScore;
    
    return new ContentQualityScore({
      qualityScore,
      issues: [...issues],
      strengths: [...strengths],
      lengthScore,
      completenessScore,
      freshnessScore,
      structureScore
    });
  }
  
  static fromProps(props: ContentQualityScoreProps): ContentQualityScore {
    return new ContentQualityScore(props);
  }
  
  // Getters for immutable access
  get overallScore(): number { return this.props.qualityScore; }
  get issues(): string[] { return [...this.props.issues]; }
  get strengths(): string[] { return [...this.props.strengths]; }
  get lengthScore(): number { return this.props.lengthScore; }
  get completenessScore(): number { return this.props.completenessScore; }
  get freshnessScore(): number { return this.props.freshnessScore; }
  get structureScore(): number { return this.props.structureScore; }
  
  // Business methods
  isHighQuality(): boolean {
    return this.props.qualityScore >= 80;
  }
  
  isLowQuality(): boolean {
    return this.props.qualityScore < 50;
  }
  
  needsImprovement(): boolean {
    return this.props.qualityScore < 70;
  }
  
  getQualityLevel(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (this.props.qualityScore >= 90) return 'excellent';
    if (this.props.qualityScore >= 70) return 'good';
    if (this.props.qualityScore >= 50) return 'fair';
    return 'poor';
  }
  
  hasIssues(): boolean {
    return this.props.issues.length > 0;
  }
  
  hasStrengths(): boolean {
    return this.props.strengths.length > 0;
  }
  
  // Serialization
  toPlainObject(): ContentQualityScoreProps {
    return { ...this.props };
  }
  
  private validateInvariants(): void {
    if (this.props.qualityScore < 0 || this.props.qualityScore > 100) {
      throw new BusinessRuleViolationError(
        'Quality score must be between 0 and 100',
        { qualityScore: this.props.qualityScore }
      );
    }
    
    if (this.props.lengthScore < 0 || this.props.lengthScore > 25) {
      throw new BusinessRuleViolationError(
        'Length score must be between 0 and 25',
        { lengthScore: this.props.lengthScore }
      );
    }
    
    if (this.props.completenessScore < 0 || this.props.completenessScore > 25) {
      throw new BusinessRuleViolationError(
        'Completeness score must be between 0 and 25',
        { completenessScore: this.props.completenessScore }
      );
    }
  }
}