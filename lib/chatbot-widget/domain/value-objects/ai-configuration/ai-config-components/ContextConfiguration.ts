/**
 * Context Configuration Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage context window configuration
 * - Handle token allocation and context management
 * - Keep under 200-250 lines
 * - Focus on context configuration only
 * - Follow @golden-rule patterns exactly
 */

export interface ContextConfigurationProps {
  maxTokens: number;
  systemPromptTokens: number;
  responseReservedTokens: number;
  summaryTokens: number;
}

export class ContextConfiguration {
  private constructor(private readonly props: ContextConfigurationProps) {
    this.validateProps(props);
  }

  static create(props: ContextConfigurationProps): ContextConfiguration {
    return new ContextConfiguration(props);
  }

  static createDefault(): ContextConfiguration {
    return new ContextConfiguration({
      maxTokens: 12000,
      systemPromptTokens: 500,
      responseReservedTokens: 3000,
      summaryTokens: 200
    });
  }

  private validateProps(props: ContextConfigurationProps): void {
    if (props.maxTokens < 1000) {
      throw new Error('Max tokens must be at least 1000');
    }
    
    const totalReserved = props.systemPromptTokens + props.responseReservedTokens + props.summaryTokens;
    if (totalReserved >= props.maxTokens) {
      throw new Error('Reserved tokens cannot exceed max tokens');
    }
    
    if (props.systemPromptTokens < 100) {
      throw new Error('System prompt tokens must be at least 100');
    }
    
    if (props.responseReservedTokens < 500) {
      throw new Error('Response reserved tokens must be at least 500');
    }
  }

  // Getters
  get maxTokens(): number { return this.props.maxTokens; }
  get systemPromptTokens(): number { return this.props.systemPromptTokens; }
  get responseReservedTokens(): number { return this.props.responseReservedTokens; }
  get summaryTokens(): number { return this.props.summaryTokens; }

  // Business methods
  update(updates: Partial<ContextConfigurationProps>): ContextConfiguration {
    return new ContextConfiguration({
      ...this.props,
      ...updates
    });
  }

  updateMaxTokens(maxTokens: number): ContextConfiguration {
    return this.update({ maxTokens });
  }

  updateSystemPromptTokens(systemPromptTokens: number): ContextConfiguration {
    return this.update({ systemPromptTokens });
  }

  updateResponseReservedTokens(responseReservedTokens: number): ContextConfiguration {
    return this.update({ responseReservedTokens });
  }

  updateSummaryTokens(summaryTokens: number): ContextConfiguration {
    return this.update({ summaryTokens });
  }

  getAvailableTokens(): number {
    return this.props.maxTokens - 
           this.props.systemPromptTokens - 
           this.props.responseReservedTokens - 
           this.props.summaryTokens;
  }

  getTotalReservedTokens(): number {
    return this.props.systemPromptTokens + 
           this.props.responseReservedTokens + 
           this.props.summaryTokens;
  }

  getUtilizationPercentage(): number {
    return (this.getTotalReservedTokens() / this.props.maxTokens) * 100;
  }

  canAccommodateMessage(messageTokens: number): boolean {
    return messageTokens <= this.getAvailableTokens();
  }

  isHighCapacity(): boolean {
    return this.props.maxTokens >= 16000;
  }

  isLowCapacity(): boolean {
    return this.props.maxTokens <= 4000;
  }

  getRecommendedBatchSize(): number {
    const available = this.getAvailableTokens();
    if (available >= 8000) return 10;
    if (available >= 4000) return 5;
    if (available >= 2000) return 3;
    return 1;
  }

  toPlainObject(): ContextConfigurationProps {
    return { ...this.props };
  }
} 