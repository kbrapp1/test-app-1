/**
 * Workflow Boundary Mapper
 * 
 * DDD-compliant mapper for transforming between unknown types and boundary DTOs.
 * Provides type safety and validation at application service boundaries.
 */

import { 
  ProcessMessageRequestDto, 
  MessageMetadataDto,
  IntentAnalysisDto,
  JourneyStateDto,
  RelevantKnowledgeItemDto,
  UnifiedAnalysisResultDto,
  WorkflowResponseDto,
  CallToActionDto
} from '../dto/WorkflowBoundaryTypes';
import { ProcessChatMessageRequest } from '../dto/ProcessChatMessageRequest';

export class WorkflowBoundaryMapper {

  /**
   * Convert ProcessChatMessageRequest to ProcessMessageRequestDto
   */
  static toProcessMessageRequest(request: ProcessChatMessageRequest): ProcessMessageRequestDto {
    return {
      userMessage: request.userMessage,
      sessionId: request.sessionId,
      organizationId: request.organizationId,
      metadata: request.metadata ? this.toMessageMetadata(request.metadata) : undefined
    };
  }

  /**
   * Convert metadata with proper date handling
   */
  private static toMessageMetadata(metadata: NonNullable<ProcessChatMessageRequest['metadata']>): MessageMetadataDto {
    return {
      userId: metadata.userId,
      timestamp: metadata.timestamp ? new Date(metadata.timestamp) : undefined,
      clientInfo: metadata.clientInfo
    };
  }

  /**
   * Safely extract intent analysis from unknown result
   */
  static toIntentAnalysis(result: unknown): IntentAnalysisDto {
    if (!this.isObject(result)) {
      return this.createDefaultIntentAnalysis();
    }

    const analysis = this.getProperty(result, 'analysis');
    if (!this.isObject(analysis)) {
      return this.createDefaultIntentAnalysis();
    }

    return {
      primaryIntent: this.getString(analysis, 'primaryIntent') || 'general_inquiry',
      confidence: this.getNumber(analysis, 'primaryConfidence') || 0,
      entities: this.getObject(analysis, 'entities') || {},
      sentiment: this.getSentiment(analysis)
    };
  }

  /**
   * Safely extract journey state from unknown result
   */
  static toJourneyState(result: unknown): JourneyStateDto {
    if (!this.isObject(result)) {
      return this.createDefaultJourneyState();
    }

    const journeyState = this.getProperty(result, 'journeyState');
    if (!this.isObject(journeyState)) {
      return this.createDefaultJourneyState();
    }

    return {
      currentStage: this.getString(journeyState, 'currentStage') || 'initial',
      completedStages: this.getStringArray(journeyState, 'completedStages') || [],
      nextRecommendedStage: this.getString(journeyState, 'nextRecommendedStage'),
      progressPercentage: this.getNumber(journeyState, 'progressPercentage') || 0
    };
  }

  /**
   * Safely extract relevant knowledge from unknown result
   */
  static toRelevantKnowledge(result: unknown): RelevantKnowledgeItemDto[] {
    if (!this.isObject(result)) {
      return [];
    }

    const knowledge = this.getProperty(result, 'relevantKnowledge');
    if (!this.isObject(knowledge)) {
      return [];
    }

    const items = this.getProperty(knowledge, 'items');
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter(this.isObject)
      .map(item => ({
        id: this.getString(item, 'id') || 'unknown',
        title: this.getString(item, 'title') || 'Unknown',
        content: this.getString(item, 'content') || '',
        relevanceScore: this.getNumber(item, 'relevanceScore') || 0
      }));
  }

  /**
   * Safely extract unified analysis from unknown result
   */
  static toUnifiedAnalysis(result: unknown): UnifiedAnalysisResultDto {
    if (!this.isObject(result)) {
      return this.createDefaultUnifiedAnalysis();
    }

    const analysis = this.getProperty(result, 'analysis');
    if (!this.isObject(analysis)) {
      return this.createDefaultUnifiedAnalysis();
    }

    return {
      primaryIntent: this.getString(analysis, 'primaryIntent') || 'general_inquiry',
      primaryConfidence: this.getNumber(analysis, 'primaryConfidence') || 0,
      sentiment: this.getSentiment(analysis),
      emotionalTone: this.getString(analysis, 'emotionalTone'),
      entities: this.getObject(analysis, 'entities') || {}
    };
  }

  /**
   * Safely extract workflow response from unknown result
   */
  static toWorkflowResponse(result: unknown): WorkflowResponseDto {
    if (!this.isObject(result)) {
      return this.createDefaultWorkflowResponse();
    }

    // Try multiple paths for content extraction
    const content = this.extractContent(result);
    const confidence = this.extractConfidence(result);
    const tokenUsage = this.extractTokenUsage(result);

    return {
      content,
      confidence,
      model: this.getString(result, 'model') || 'gpt-4o-mini',
      tokenUsage
    };
  }

  /**
   * Safely extract call to action from unknown result
   */
  static toCallToAction(result: unknown): CallToActionDto | undefined {
    if (!this.isObject(result)) {
      return undefined;
    }

    const callToAction = this.getProperty(result, 'callToAction');
    if (!this.isObject(callToAction)) {
      return undefined;
    }

    return {
      type: this.getString(callToAction, 'type') || 'none',
      text: this.getString(callToAction, 'message') || this.getString(callToAction, 'text') || '',
      priority: this.getNumber(callToAction, 'priority') || 0
    };
  }

  // Private helper methods for type safety

  private static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private static getProperty(obj: Record<string, unknown>, key: string): unknown {
    return obj[key];
  }

  private static getString(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
  }

  private static getNumber(obj: Record<string, unknown>, key: string): number | undefined {
    const value = obj[key];
    return typeof value === 'number' ? value : undefined;
  }

  private static getObject(obj: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
    const value = obj[key];
    return this.isObject(value) ? value : undefined;
  }

  private static getStringArray(obj: Record<string, unknown>, key: string): string[] | undefined {
    const value = obj[key];
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      return value as string[];
    }
    return undefined;
  }

  private static getSentiment(obj: Record<string, unknown>): 'positive' | 'neutral' | 'negative' | undefined {
    const sentiment = this.getString(obj, 'sentiment');
    if (sentiment === 'positive' || sentiment === 'neutral' || sentiment === 'negative') {
      return sentiment;
    }
    return undefined;
  }

  private static extractContent(result: Record<string, unknown>): string {
    // Try multiple content extraction paths
    const response = this.getObject(result, 'response');
    if (response) {
      const content = this.getString(response, 'content');
      if (content) return content;
    }

    const analysis = this.getObject(result, 'analysis');
    if (analysis) {
      const responseObj = this.getObject(analysis, 'response');
      if (responseObj) {
        const content = this.getString(responseObj, 'content');
        if (content) return content;
      }
    }

    // Try choices array (OpenAI format)
    const choices = this.getProperty(result, 'choices');
    if (Array.isArray(choices) && choices.length > 0) {
      const firstChoice = choices[0];
      if (this.isObject(firstChoice)) {
        const message = this.getObject(firstChoice, 'message');
        if (message) {
          const functionCall = this.getObject(message, 'function_call');
          if (functionCall) {
            const args = this.getString(functionCall, 'arguments');
            if (args) {
              try {
                const parsed = JSON.parse(args);
                if (this.isObject(parsed)) {
                  const responseContent = this.getObject(parsed, 'response');
                  if (responseContent) {
                    const content = this.getString(responseContent, 'content');
                    if (content) return content;
                  }
                }
              } catch {
                // Continue to fallback
              }
            }
          }
        }
      }
    }

    return "I'm having trouble processing your message right now, but I'm here to help! Please try again in a moment.";
  }

  private static extractConfidence(result: Record<string, unknown>): number {
    const analysis = this.getObject(result, 'analysis');
    if (analysis) {
      const confidence = this.getNumber(analysis, 'primaryConfidence');
      if (confidence !== undefined) return confidence;
    }

    // Try function call path
    const choices = this.getProperty(result, 'choices');
    if (Array.isArray(choices) && choices.length > 0) {
      const firstChoice = choices[0];
      if (this.isObject(firstChoice)) {
        const message = this.getObject(firstChoice, 'message');
        if (message) {
          const functionCall = this.getObject(message, 'function_call');
          if (functionCall) {
            const args = this.getString(functionCall, 'arguments');
            if (args) {
              try {
                const parsed = JSON.parse(args);
                if (this.isObject(parsed)) {
                  const analysisObj = this.getObject(parsed, 'analysis');
                  if (analysisObj) {
                    const confidence = this.getNumber(analysisObj, 'primaryConfidence');
                    if (confidence !== undefined) return confidence;
                  }
                }
              } catch {
                // Continue to fallback
              }
            }
          }
        }
      }
    }

    return 0;
  }

  private static extractTokenUsage(result: Record<string, unknown>): { promptTokens: number; completionTokens: number; totalTokens: number } {
    const usage = this.getObject(result, 'usage');
    if (usage) {
      const promptTokens = this.getNumber(usage, 'prompt_tokens') || 0;
      const completionTokens = this.getNumber(usage, 'completion_tokens') || 0;
      const totalTokens = this.getNumber(usage, 'total_tokens') || promptTokens + completionTokens;

      return { promptTokens, completionTokens, totalTokens };
    }

    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  // Default object creators

  private static createDefaultIntentAnalysis(): IntentAnalysisDto {
    return {
      primaryIntent: 'general_inquiry',
      confidence: 0,
      entities: {},
      sentiment: 'neutral'
    };
  }

  private static createDefaultJourneyState(): JourneyStateDto {
    return {
      currentStage: 'initial',
      completedStages: [],
      progressPercentage: 0
    };
  }

  private static createDefaultUnifiedAnalysis(): UnifiedAnalysisResultDto {
    return {
      primaryIntent: 'general_inquiry',
      primaryConfidence: 0,
      entities: {}
    };
  }

  private static createDefaultWorkflowResponse(): WorkflowResponseDto {
    return {
      content: "I'm having trouble processing your message right now, but I'm here to help! Please try again in a moment.",
      confidence: 0,
      model: 'gpt-4o-mini',
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };
  }
}