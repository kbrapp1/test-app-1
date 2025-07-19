/**
 * Workflow Data Extractor Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for data extraction business logic
 * - Contains business rules for data interpretation
 * - No external dependencies beyond domain objects
 * - Encapsulates extraction business logic
 */

import { 
  IntentAnalysisDto,
  JourneyStateDto,
  RelevantKnowledgeItemDto,
  UnifiedAnalysisResultDto,
  WorkflowResponseDto,
  CallToActionDto
} from '../../../application/dto/WorkflowBoundaryTypes';
import { MappingResult } from '../../value-objects/mapping/MappingResult';
import { WorkflowTypeValidator } from './WorkflowTypeValidator';
import { WorkflowDefaultFactory } from './WorkflowDefaultFactory';

export class WorkflowDataExtractor {
  private readonly validator: WorkflowTypeValidator;
  private readonly factory: WorkflowDefaultFactory;

  constructor() {
    this.validator = new WorkflowTypeValidator();
    this.factory = new WorkflowDefaultFactory();
  }

  /**
   * Extract intent analysis with business validation
   */
  public extractIntentAnalysis(result: unknown): MappingResult<IntentAnalysisDto> {
    if (!this.validator.isObject(result)) {
      return MappingResult.success(this.factory.createDefaultIntentAnalysis());
    }

    const analysis = result['analysis'];
    if (!this.validator.isObject(analysis)) {
      return MappingResult.success(this.factory.createDefaultIntentAnalysis());
    }

    const primaryIntent = this.extractStringWithDefault(analysis, 'primaryIntent', 'general_inquiry');
    const confidence = this.extractNumberWithDefault(analysis, 'primaryConfidence', 0);
    const entities = this.extractEntitiesWithDefault(analysis, 'entities');
    const sentiment = this.extractSentimentWithDefault(analysis, 'sentiment');

    return MappingResult.success({
      primaryIntent,
      confidence,
      entities,
      sentiment
    });
  }

  /**
   * Extract journey state with business validation
   */
  public extractJourneyState(result: unknown): MappingResult<JourneyStateDto> {
    if (!this.validator.isObject(result)) {
      return MappingResult.success(this.factory.createDefaultJourneyState());
    }

    const journeyState = result['journeyState'];
    if (!this.validator.isObject(journeyState)) {
      return MappingResult.success(this.factory.createDefaultJourneyState());
    }

    const currentStage = this.extractStringWithDefault(journeyState, 'currentStage', 'initial');
    const completedStages = this.extractStringArrayWithDefault(journeyState, 'completedStages');
    const nextRecommendedStage = this.extractOptionalString(journeyState, 'nextRecommendedStage');
    const progressPercentage = this.extractNumberWithDefault(journeyState, 'progressPercentage', 0);

    return MappingResult.success({
      currentStage,
      completedStages,
      nextRecommendedStage,
      progressPercentage
    });
  }

  /**
   * Extract relevant knowledge with business validation
   */
  public extractRelevantKnowledge(result: unknown): MappingResult<RelevantKnowledgeItemDto[]> {
    if (!this.validator.isObject(result)) {
      return MappingResult.success([]);
    }

    const knowledge = result['relevantKnowledge'];
    if (!this.validator.isObject(knowledge)) {
      return MappingResult.success([]);
    }

    const items = knowledge['items'];
    if (!Array.isArray(items)) {
      return MappingResult.success([]);
    }

    const validItems = items
      .filter(this.validator.isObject.bind(this.validator))
      .map(item => this.extractKnowledgeItem(item))
      .filter(Boolean) as RelevantKnowledgeItemDto[];

    return MappingResult.success(validItems);
  }

  /**
   * Extract unified analysis with business validation
   */
  public extractUnifiedAnalysis(result: unknown): MappingResult<UnifiedAnalysisResultDto> {
    if (!this.validator.isObject(result)) {
      return MappingResult.success(this.factory.createDefaultUnifiedAnalysis());
    }

    const analysis = result['analysis'];
    if (!this.validator.isObject(analysis)) {
      return MappingResult.success(this.factory.createDefaultUnifiedAnalysis());
    }

    const primaryIntent = this.extractStringWithDefault(analysis, 'primaryIntent', 'general_inquiry');
    const primaryConfidence = this.extractNumberWithDefault(analysis, 'primaryConfidence', 0);
    const sentiment = this.extractOptionalSentiment(analysis, 'sentiment');
    const emotionalTone = this.extractOptionalString(analysis, 'emotionalTone');
    const entities = this.extractEntitiesWithDefault(analysis, 'entities');

    return MappingResult.success({
      primaryIntent,
      primaryConfidence,
      sentiment,
      emotionalTone,
      entities
    });
  }

  /**
   * Extract call to action with business validation
   */
  public extractCallToAction(result: unknown): MappingResult<CallToActionDto | undefined> {
    if (!this.validator.isObject(result)) {
      return MappingResult.success(undefined);
    }

    const callToAction = result['callToAction'];
    if (!this.validator.isObject(callToAction)) {
      return MappingResult.success(undefined);
    }

    const type = this.extractStringWithDefault(callToAction, 'type', 'none');
    const text = this.extractCallToActionText(callToAction);
    const priority = this.extractNumberWithDefault(callToAction, 'priority', 0);

    return MappingResult.success({
      type,
      text,
      priority
    });
  }

  // Private helper methods for extraction

  private extractStringWithDefault(obj: Record<string, unknown>, key: string, defaultValue: string): string {
    const value = obj[key];
    return this.validator.isString(value) ? value : defaultValue;
  }

  private extractNumberWithDefault(obj: Record<string, unknown>, key: string, defaultValue: number): number {
    const value = obj[key];
    return this.validator.isNumber(value) ? value : defaultValue;
  }

  private extractStringArrayWithDefault(obj: Record<string, unknown>, key: string): string[] {
    const value = obj[key];
    return this.validator.isStringArray(value) ? value : [];
  }

  private extractOptionalString(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key];
    return this.validator.isString(value) ? value : undefined;
  }

  private extractOptionalSentiment(obj: Record<string, unknown>, key: string): 'positive' | 'neutral' | 'negative' | undefined {
    const value = obj[key];
    return this.validator.isValidSentiment(value) ? value : undefined;
  }

  private extractEntitiesWithDefault(obj: Record<string, unknown>, key: string): Record<string, unknown> {
    const value = obj[key];
    return this.validator.isValidEntityObject(value) ? value : {};
  }

  private extractSentimentWithDefault(obj: Record<string, unknown>, key: string): 'positive' | 'neutral' | 'negative' {
    const value = obj[key];
    return this.validator.isValidSentiment(value) ? value : 'neutral';
  }

  private extractKnowledgeItem(item: Record<string, unknown>): RelevantKnowledgeItemDto | null {
    const id = this.extractStringWithDefault(item, 'id', 'unknown');
    const title = this.extractStringWithDefault(item, 'title', 'Unknown');
    const content = this.extractStringWithDefault(item, 'content', '');
    const relevanceScore = this.extractNumberWithDefault(item, 'relevanceScore', 0);

    // Business rule: Knowledge items must have valid content
    if (!content && !title) {
      return null;
    }

    return { id, title, content, relevanceScore };
  }

  private extractCallToActionText(obj: Record<string, unknown>): string {
    // Try multiple text field names for flexibility
    const message = obj['message'];
    const text = obj['text'];
    
    if (this.validator.isString(message)) return message;
    if (this.validator.isString(text)) return text;
    
    return '';
  }
}