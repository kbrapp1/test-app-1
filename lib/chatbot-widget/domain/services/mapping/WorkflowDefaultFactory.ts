/**
 * Workflow Default Factory Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for creating default objects
 * - Contains business rules for default values
 * - No external dependencies
 * - Encapsulates default creation business logic
 */

import { 
  IntentAnalysisDto,
  JourneyStateDto,
  UnifiedAnalysisResultDto,
  WorkflowResponseDto,
  CallToActionDto
} from '../../../application/dto/WorkflowBoundaryTypes';

export class WorkflowDefaultFactory {
  /**
   * Create default intent analysis with business-appropriate values
   */
  public createDefaultIntentAnalysis(): IntentAnalysisDto {
    return {
      primaryIntent: 'general_inquiry',
      confidence: 0,
      entities: {},
      sentiment: 'neutral'
    };
  }

  /**
   * Create default journey state for new interactions
   */
  public createDefaultJourneyState(): JourneyStateDto {
    return {
      currentStage: 'initial',
      completedStages: [],
      progressPercentage: 0
    };
  }

  /**
   * Create default unified analysis for fallback scenarios
   */
  public createDefaultUnifiedAnalysis(): UnifiedAnalysisResultDto {
    return {
      primaryIntent: 'general_inquiry',
      primaryConfidence: 0,
      entities: {}
    };
  }

  /**
   * Create default workflow response with helpful fallback message
   */
  public createDefaultWorkflowResponse(): WorkflowResponseDto {
    return {
      content: "I'm having trouble processing your message right now, but I'm here to help! Please try again in a moment.",
      confidence: 0,
      model: 'gpt-4o-mini',
      tokenUsage: this.createDefaultTokenUsage()
    };
  }

  /**
   * Create default call to action for no-action scenarios
   */
  public createDefaultCallToAction(): CallToActionDto {
    return {
      type: 'none',
      text: '',
      priority: 0
    };
  }

  /**
   * Create default token usage for zero-cost scenarios
   */
  public createDefaultTokenUsage(): { promptTokens: number; completionTokens: number; totalTokens: number } {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };
  }

  /**
   * Create default empty entities object
   */
  public createDefaultEntities(): Record<string, unknown> {
    return {};
  }

  /**
   * Create default empty string array
   */
  public createDefaultStringArray(): string[] {
    return [];
  }

  /**
   * Get default values for specific types based on business rules
   */
  public getDefaultForType(type: 'string'): string;
  public getDefaultForType(type: 'number'): number;
  public getDefaultForType(type: 'boolean'): boolean;
  public getDefaultForType(type: 'array'): unknown[];
  public getDefaultForType(type: 'object'): Record<string, unknown>;
  public getDefaultForType(type: string): unknown {
    switch (type) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }

  /**
   * Create default for specific business contexts
   */
  public getBusinessDefaultFor(context: 'confidence'): number;
  public getBusinessDefaultFor(context: 'progress'): number;
  public getBusinessDefaultFor(context: 'priority'): number;
  public getBusinessDefaultFor(context: 'relevance'): number;
  public getBusinessDefaultFor(context: 'sentiment'): 'neutral';
  public getBusinessDefaultFor(context: 'intent'): 'general_inquiry';
  public getBusinessDefaultFor(context: 'stage'): 'initial';
  public getBusinessDefaultFor(context: 'model'): 'gpt-4o-mini';
  public getBusinessDefaultFor(context: string): unknown {
    const businessDefaults = {
      confidence: 0,
      progress: 0,
      priority: 0,
      relevance: 0,
      sentiment: 'neutral',
      intent: 'general_inquiry',
      stage: 'initial',
      model: 'gpt-4o-mini'
    };

    return businessDefaults[context as keyof typeof businessDefaults] ?? null;
  }
}