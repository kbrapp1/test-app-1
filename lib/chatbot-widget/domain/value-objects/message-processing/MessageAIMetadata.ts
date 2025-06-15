/**
 * Message AI Metadata Value Object
 * 
 * Handles AI-specific metadata including model information, token usage,
 * entity extraction, and confidence scoring for chat messages.
 */

export interface MessageAIMetadataProps {
  aiModel?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  confidence?: number;
  intentDetected?: string;
  entitiesExtracted: ExtractedEntity[];
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
  start?: number;
  end?: number;
}

export class MessageAIMetadata {
  private constructor(private readonly props: MessageAIMetadataProps) {
    this.validateProps(props);
  }

  static create(props: MessageAIMetadataProps): MessageAIMetadata {
    return new MessageAIMetadata(props);
  }

  static createEmpty(): MessageAIMetadata {
    return new MessageAIMetadata({
      entitiesExtracted: [],
    });
  }

  static createFromTokens(
    aiModel: string,
    promptTokens: number,
    completionTokens: number,
    confidence?: number,
    intentDetected?: string
  ): MessageAIMetadata {
    return new MessageAIMetadata({
      aiModel,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      confidence,
      intentDetected,
      entitiesExtracted: [],
    });
  }

  private validateProps(props: MessageAIMetadataProps): void {
    if (props.promptTokens !== undefined && (typeof props.promptTokens !== 'number' || props.promptTokens < 0)) {
      throw new Error('Prompt tokens must be a non-negative number');
    }

    if (props.completionTokens !== undefined && (typeof props.completionTokens !== 'number' || props.completionTokens < 0)) {
      throw new Error('Completion tokens must be a non-negative number');
    }

    if (props.totalTokens !== undefined && (typeof props.totalTokens !== 'number' || props.totalTokens < 0)) {
      throw new Error('Total tokens must be a non-negative number');
    }

    if (props.confidence !== undefined && (typeof props.confidence !== 'number' || props.confidence < 0 || props.confidence > 1)) {
      throw new Error('Confidence must be a number between 0 and 1');
    }

    if (!Array.isArray(props.entitiesExtracted)) {
      throw new Error('Entities extracted must be an array');
    }

    props.entitiesExtracted.forEach((entity, index) => {
      if (!entity.type?.trim()) {
        throw new Error(`Entity at index ${index} must have a type`);
      }
      if (!entity.value?.trim()) {
        throw new Error(`Entity at index ${index} must have a value`);
      }
      if (typeof entity.confidence !== 'number' || entity.confidence < 0 || entity.confidence > 1) {
        throw new Error(`Entity at index ${index} must have a confidence between 0 and 1`);
      }
    });

    // Validate token consistency
    if (props.promptTokens !== undefined && props.completionTokens !== undefined && props.totalTokens !== undefined) {
      const calculatedTotal = props.promptTokens + props.completionTokens;
      if (props.totalTokens !== calculatedTotal) {
        throw new Error('Total tokens must equal prompt tokens plus completion tokens');
      }
    }
  }

  // Getters
  get aiModel(): string | undefined { return this.props.aiModel; }
  get promptTokens(): number | undefined { return this.props.promptTokens; }
  get completionTokens(): number | undefined { return this.props.completionTokens; }
  get totalTokens(): number | undefined { return this.props.totalTokens; }
  get confidence(): number | undefined { return this.props.confidence; }
  get intentDetected(): string | undefined { return this.props.intentDetected; }
  get entitiesExtracted(): ExtractedEntity[] { return [...this.props.entitiesExtracted]; }

  // Business methods
  addExtractedEntity(entity: ExtractedEntity): MessageAIMetadata {
    return new MessageAIMetadata({
      ...this.props,
      entitiesExtracted: [...this.props.entitiesExtracted, entity],
    });
  }

  updateConfidence(confidence: number): MessageAIMetadata {
    return new MessageAIMetadata({
      ...this.props,
      confidence,
    });
  }

  updateIntent(intentDetected: string): MessageAIMetadata {
    return new MessageAIMetadata({
      ...this.props,
      intentDetected: intentDetected.trim(),
    });
  }

  // Query methods
  hasTokenUsage(): boolean {
    return this.props.promptTokens !== undefined && this.props.completionTokens !== undefined;
  }

  hasEntities(): boolean {
    return this.props.entitiesExtracted.length > 0;
  }

  hasHighConfidence(threshold: number = 0.8): boolean {
    return (this.props.confidence || 0) >= threshold;
  }

  hasIntent(): boolean {
    return !!this.props.intentDetected?.trim();
  }

  getEntitiesByType(type: string): ExtractedEntity[] {
    return this.props.entitiesExtracted.filter(entity => entity.type === type);
  }

  getEntityTypes(): string[] {
    const types = this.props.entitiesExtracted.map(entity => entity.type);
    return [...new Set(types)];
  }

  getProcessingQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const hasHighConfidence = this.hasHighConfidence();
    const hasIntent = this.hasIntent();
    const hasEntities = this.hasEntities();
    
    if (hasHighConfidence && hasIntent && hasEntities) return 'excellent';
    if (hasHighConfidence && (hasIntent || hasEntities)) return 'good';
    if (hasIntent || hasEntities) return 'fair';
    return 'poor';
  }

  equals(other: MessageAIMetadata): boolean {
    return (
      this.props.aiModel === other.props.aiModel &&
      this.props.promptTokens === other.props.promptTokens &&
      this.props.completionTokens === other.props.completionTokens &&
      this.props.confidence === other.props.confidence &&
      this.props.intentDetected === other.props.intentDetected &&
      this.props.entitiesExtracted.length === other.props.entitiesExtracted.length
    );
  }

  toPlainObject(): MessageAIMetadataProps {
    return { ...this.props };
  }
} 