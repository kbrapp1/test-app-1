/**
 * OpenAI Configuration Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage OpenAI-specific configuration
 * - Handle model, temperature, and token settings
 * - Keep under 200-250 lines
 * - Focus on OpenAI configuration only
 * - Follow @golden-rule patterns exactly
 */

export interface OpenAIConfigurationProps {
  model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  temperature: number;
  maxTokens: number;
}

export class OpenAIConfiguration {
  private constructor(private readonly props: OpenAIConfigurationProps) {
    this.validateProps(props);
  }

  static create(props: OpenAIConfigurationProps): OpenAIConfiguration {
    return new OpenAIConfiguration(props);
  }

  static createDefault(): OpenAIConfiguration {
    return new OpenAIConfiguration({
      model: 'gpt-4o-mini', // Default to mini per user preference
      temperature: 0.3,
      maxTokens: 1000
    });
  }

  private validateProps(props: OpenAIConfigurationProps): void {
    if (props.temperature < 0 || props.temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    if (props.maxTokens < 1 || props.maxTokens > 4096) {
      throw new Error('Max tokens must be between 1 and 4096');
    }
  }

  // Getters
  get model(): string { return this.props.model; }
  get temperature(): number { return this.props.temperature; }
  get maxTokens(): number { return this.props.maxTokens; }

  // Business methods
  update(updates: Partial<OpenAIConfigurationProps>): OpenAIConfiguration {
    return new OpenAIConfiguration({
      ...this.props,
      ...updates
    });
  }

  updateModel(model: OpenAIConfigurationProps['model']): OpenAIConfiguration {
    return this.update({ model });
  }

  updateTemperature(temperature: number): OpenAIConfiguration {
    return this.update({ temperature });
  }

  updateMaxTokens(maxTokens: number): OpenAIConfiguration {
    return this.update({ maxTokens });
  }

  isHighPerformanceModel(): boolean {
    return this.props.model === 'gpt-4o' || this.props.model === 'gpt-4-turbo';
  }

  isMiniModel(): boolean {
    return this.props.model === 'gpt-4o-mini' || this.props.model === 'gpt-3.5-turbo';
  }

  getModelFamily(): 'gpt-4' | 'gpt-3.5' {
    return this.props.model.startsWith('gpt-4') ? 'gpt-4' : 'gpt-3.5';
  }

  getEstimatedCostMultiplier(): number {
    const costMap = {
      'gpt-4o': 1.0,
      'gpt-4o-mini': 0.1,
      'gpt-4-turbo': 0.8,
      'gpt-3.5-turbo': 0.05
    };
    return costMap[this.props.model] || 1.0;
  }

  isCreativeMode(): boolean {
    return this.props.temperature > 0.7;
  }

  isConservativeMode(): boolean {
    return this.props.temperature < 0.3;
  }

  toPlainObject(): OpenAIConfigurationProps {
    return { ...this.props };
  }
} 