// Domain services (moved business logic to domain layer)
import { IntentPatternRecognitionService } from '../../../../domain/services/ai-configuration/IntentPatternRecognitionService';
import { ConversationAnalyticsDomainService } from '../../../../domain/services/ai-configuration/ConversationAnalyticsDomainService';
import { IntentAnalysisResult, IntentAnalysisResultBuilder } from '../../../../domain/value-objects/intent/IntentAnalysisResult';

/**
 * Intent Inference Service - Infrastructure Layer
 * 
 * Infrastructure facade that coordinates domain services for intent analysis
 * - Delegates to domain services following DDD patterns
 * - Maintains existing API for backward compatibility
 * - Orchestrates complete intent analysis workflow
 * - Under 50 lines following DDD patterns
 */
export class IntentInferenceService {

  /** Infer intent from message content using domain services */
  static inferIntentFromMessage(content: string): string {
    return IntentPatternRecognitionService.inferIntentFromMessage(content);
  }

  /** Infer sentiment from message content using domain services */
  static inferSentiment(content: string): string {
    return ConversationAnalyticsDomainService.inferSentiment(content);
  }

  /** Assess engagement level from message content using domain services */
  static assessEngagementLevel(content: string): string {
    return ConversationAnalyticsDomainService.assessEngagementLevel(content);
  }

  /** Determine conversation phase based on intent progression using domain services */
  static determineConversationPhase(recentIntents: string[]): string {
    return ConversationAnalyticsDomainService.determineConversationPhase(recentIntents);
  }

  /** Calculate intent confidence score using domain services */
  static calculateIntentConfidence(content: string, inferredIntent: string): number {
    return ConversationAnalyticsDomainService.calculateIntentConfidence(content, inferredIntent);
  }

  /** Complete intent analysis - returns comprehensive analysis result */
  static analyzeIntent(content: string, recentIntents: string[] = []): IntentAnalysisResult {
    const intent = this.inferIntentFromMessage(content);
    const sentiment = this.inferSentiment(content);
    const engagementLevel = this.assessEngagementLevel(content);
    const conversationPhase = this.determineConversationPhase(recentIntents);
    const confidence = this.calculateIntentConfidence(content, intent);

    return new IntentAnalysisResultBuilder()
      .withIntent(intent)
      .withSentiment(sentiment)
      .withEngagementLevel(engagementLevel)
      .withConversationPhase(conversationPhase)
      .withConfidence(confidence)
      .build();
  }
}