/**
 * Intent Configuration Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage intent classification configuration
 * - Handle confidence thresholds and intent detection settings
 * - Keep under 200-250 lines
 * - Focus on intent configuration only
 * - Follow @golden-rule patterns exactly
 */

export interface IntentConfigurationProps {
  confidenceThreshold: number;
  ambiguityThreshold: number;
  enableMultiIntentDetection: boolean;
  enablePersonaInference: boolean;
}

export class IntentConfiguration {
  private constructor(private readonly props: IntentConfigurationProps) {
    this.validateProps(props);
  }

  static create(props: IntentConfigurationProps): IntentConfiguration {
    return new IntentConfiguration(props);
  }

  static createDefault(): IntentConfiguration {
    return new IntentConfiguration({
      confidenceThreshold: 0.7,
      ambiguityThreshold: 0.2,
      enableMultiIntentDetection: true,
      enablePersonaInference: true
    });
  }

  private validateProps(props: IntentConfigurationProps): void {
    if (props.confidenceThreshold < 0 || props.confidenceThreshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    
    if (props.ambiguityThreshold < 0 || props.ambiguityThreshold > 1) {
      throw new Error('Ambiguity threshold must be between 0 and 1');
    }
    
    if (props.confidenceThreshold <= props.ambiguityThreshold) {
      throw new Error('Confidence threshold must be greater than ambiguity threshold');
    }
  }

  // Getters
  get confidenceThreshold(): number { return this.props.confidenceThreshold; }
  get ambiguityThreshold(): number { return this.props.ambiguityThreshold; }
  get enableMultiIntentDetection(): boolean { return this.props.enableMultiIntentDetection; }
  get enablePersonaInference(): boolean { return this.props.enablePersonaInference; }

  // Business methods
  update(updates: Partial<IntentConfigurationProps>): IntentConfiguration {
    return new IntentConfiguration({
      ...this.props,
      ...updates
    });
  }

  updateConfidenceThreshold(threshold: number): IntentConfiguration {
    return this.update({ confidenceThreshold: threshold });
  }

  updateAmbiguityThreshold(threshold: number): IntentConfiguration {
    return this.update({ ambiguityThreshold: threshold });
  }

  enableMultiIntent(): IntentConfiguration {
    return this.update({ enableMultiIntentDetection: true });
  }

  disableMultiIntent(): IntentConfiguration {
    return this.update({ enableMultiIntentDetection: false });
  }

  enablePersona(): IntentConfiguration {
    return this.update({ enablePersonaInference: true });
  }

  disablePersona(): IntentConfiguration {
    return this.update({ enablePersonaInference: false });
  }

  isIntentConfident(score: number): boolean {
    return score >= this.props.confidenceThreshold;
  }

  isIntentAmbiguous(score: number): boolean {
    return score <= this.props.ambiguityThreshold;
  }

  isIntentUncertain(score: number): boolean {
    return score > this.props.ambiguityThreshold && score < this.props.confidenceThreshold;
  }

  getIntentClassification(score: number): 'confident' | 'uncertain' | 'ambiguous' {
    if (this.isIntentConfident(score)) return 'confident';
    if (this.isIntentAmbiguous(score)) return 'ambiguous';
    return 'uncertain';
  }

  isStrictMode(): boolean {
    return this.props.confidenceThreshold >= 0.8;
  }

  isLenientMode(): boolean {
    return this.props.confidenceThreshold <= 0.5;
  }

  getConfidenceRange(): number {
    return this.props.confidenceThreshold - this.props.ambiguityThreshold;
  }

  toPlainObject(): IntentConfigurationProps {
    return { ...this.props };
  }
} 