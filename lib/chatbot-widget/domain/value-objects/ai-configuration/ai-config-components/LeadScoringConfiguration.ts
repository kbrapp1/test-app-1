/**
 * Lead Scoring Configuration Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage lead scoring configuration
 * - Handle scoring weights and advanced scoring settings
 * - Keep under 200-250 lines
 * - Focus on lead scoring configuration only
 * - Follow @golden-rule patterns exactly
 */

export interface LeadScoringConfigurationProps {
  enableAdvancedScoring: boolean;
  entityCompletenessWeight: number;
  personaConfidenceWeight: number;
  journeyProgressionWeight: number;
}

export class LeadScoringConfiguration {
  private constructor(private readonly props: LeadScoringConfigurationProps) {
    this.validateProps(props);
  }

  static create(props: LeadScoringConfigurationProps): LeadScoringConfiguration {
    return new LeadScoringConfiguration(props);
  }

  static createDefault(): LeadScoringConfiguration {
    return new LeadScoringConfiguration({
      enableAdvancedScoring: true,
      entityCompletenessWeight: 0.3,
      personaConfidenceWeight: 0.2,
      journeyProgressionWeight: 0.25
    });
  }

  private validateProps(props: LeadScoringConfigurationProps): void {
    const weights = [
      props.entityCompletenessWeight,
      props.personaConfidenceWeight,
      props.journeyProgressionWeight
    ];
    
    weights.forEach((weight, index) => {
      if (weight < 0 || weight > 1) {
        throw new Error(`Weight ${index + 1} must be between 0 and 1`);
      }
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight > 1) {
      throw new Error('Total weights cannot exceed 1.0');
    }
  }

  // Getters
  get enableAdvancedScoring(): boolean { return this.props.enableAdvancedScoring; }
  get entityCompletenessWeight(): number { return this.props.entityCompletenessWeight; }
  get personaConfidenceWeight(): number { return this.props.personaConfidenceWeight; }
  get journeyProgressionWeight(): number { return this.props.journeyProgressionWeight; }

  // Business methods
  update(updates: Partial<LeadScoringConfigurationProps>): LeadScoringConfiguration {
    return new LeadScoringConfiguration({
      ...this.props,
      ...updates
    });
  }

  enableAdvanced(): LeadScoringConfiguration {
    return this.update({ enableAdvancedScoring: true });
  }

  disableAdvanced(): LeadScoringConfiguration {
    return this.update({ enableAdvancedScoring: false });
  }

  updateWeights(weights: {
    entityCompleteness?: number;
    personaConfidence?: number;
    journeyProgression?: number;
  }): LeadScoringConfiguration {
    return this.update({
      entityCompletenessWeight: weights.entityCompleteness ?? this.props.entityCompletenessWeight,
      personaConfidenceWeight: weights.personaConfidence ?? this.props.personaConfidenceWeight,
      journeyProgressionWeight: weights.journeyProgression ?? this.props.journeyProgressionWeight
    });
  }

  updateEntityWeight(weight: number): LeadScoringConfiguration {
    return this.update({ entityCompletenessWeight: weight });
  }

  updatePersonaWeight(weight: number): LeadScoringConfiguration {
    return this.update({ personaConfidenceWeight: weight });
  }

  updateJourneyWeight(weight: number): LeadScoringConfiguration {
    return this.update({ journeyProgressionWeight: weight });
  }

  getTotalWeights(): number {
    return this.props.entityCompletenessWeight + 
           this.props.personaConfidenceWeight + 
           this.props.journeyProgressionWeight;
  }

  getRemainingWeight(): number {
    return 1.0 - this.getTotalWeights();
  }

  calculateScore(metrics: {
    entityCompleteness: number;
    personaConfidence: number;
    journeyProgression: number;
  }): number {
    if (!this.props.enableAdvancedScoring) {
      return (metrics.entityCompleteness + metrics.personaConfidence + metrics.journeyProgression) / 3;
    }

    return (
      metrics.entityCompleteness * this.props.entityCompletenessWeight +
      metrics.personaConfidence * this.props.personaConfidenceWeight +
      metrics.journeyProgression * this.props.journeyProgressionWeight
    );
  }

  isEntityFocused(): boolean {
    return this.props.entityCompletenessWeight > 0.4;
  }

  isPersonaFocused(): boolean {
    return this.props.personaConfidenceWeight > 0.4;
  }

  isJourneyFocused(): boolean {
    return this.props.journeyProgressionWeight > 0.4;
  }

  isBalanced(): boolean {
    const weights = [
      this.props.entityCompletenessWeight,
      this.props.personaConfidenceWeight,
      this.props.journeyProgressionWeight
    ];
    
    const max = Math.max(...weights);
    const min = Math.min(...weights);
    return (max - min) <= 0.2;
  }

  toPlainObject(): LeadScoringConfigurationProps {
    return { ...this.props };
  }
} 