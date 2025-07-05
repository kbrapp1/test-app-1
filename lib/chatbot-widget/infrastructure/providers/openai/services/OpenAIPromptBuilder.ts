/**
 * OpenAI Prompt Builder - 2025 Gold Standard Implementation
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate prompt building services for OpenAI integration
 * - Maintain single responsibility for prompt orchestration
 * - Keep business logic pure, delegate to specialized services
 * - Follow @golden-rule patterns exactly
 * - Under 250 lines following DDD application service patterns
 * - Coordinate domain services without containing business logic
 */

import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { IntentClassificationContext } from '../../../../domain/services/interfaces/IIntentClassificationService';
import { ConversationAnalysisBuilder } from './ConversationAnalysisBuilder';
import { PromptTemplateService } from './PromptTemplateService';
import { BehavioralPatternAnalyzer } from './BehavioralPatternAnalyzer';
import { IntentInferenceService } from './IntentInferenceService';

export class OpenAIPromptBuilder {

  /**
   * Build 2025 gold standard unified processing prompt
   */
  static buildUnifiedProcessingPrompt(conversationHistory: ChatMessage[]): string {
    // Get the base template
    let prompt = PromptTemplateService.buildUnifiedProcessingTemplate();
    
    // Add entity extraction instructions
    prompt += PromptTemplateService.buildEntityExtractionTemplate();
    
    // Add persona inference guidance
    prompt += PromptTemplateService.buildPersonaInferenceTemplate();
    
    // Add sentiment analysis framework
    prompt += PromptTemplateService.buildSentimentAnalysisTemplate();
    
    // Add conversation flow intelligence
    prompt += PromptTemplateService.buildConversationFlowTemplate();
    
    // Add lead scoring framework
    prompt += PromptTemplateService.buildLeadScoringTemplate();
    
    // Add response excellence standards
    prompt += PromptTemplateService.buildResponseExcellenceTemplate();
    
    // Add conversation context analysis if history exists
    if (conversationHistory.length > 0) {
      prompt += ConversationAnalysisBuilder.buildConversationContextAnalysis(conversationHistory);
    }
    
    // Add reasoning process template
    prompt += PromptTemplateService.buildReasoningProcessTemplate();

    return prompt;
  }

  /**
   * Build system prompt for basic intent classification (legacy support)
   */
  static buildBasicSystemPrompt(context: IntentClassificationContext): string {
    return PromptTemplateService.buildBasicSystemPrompt(context);
  }

  /**
   * Build entity extraction prompt for standalone use
   */
  static buildEntityExtractionPrompt(): string {
    return PromptTemplateService.buildEntityExtractionPrompt();
  }

  /**
   * Extract behavioral signals from conversation history
   */
  static extractBehaviorSignals(conversationHistory: ChatMessage[]): string[] {
    return BehavioralPatternAnalyzer.extractBehaviorSignals(conversationHistory);
  }

  /**
   * Analyze engagement progression patterns
   */
  static analyzeEngagementProgression(conversationHistory: ChatMessage[]): {
    trend: string;
    quality: string;
    depth: string;
  } {
    return BehavioralPatternAnalyzer.analyzeEngagementProgression(conversationHistory);
  }

  /**
   * Identify conversation momentum indicators
   */
  static identifyMomentumIndicators(conversationHistory: ChatMessage[]): string[] {
    return BehavioralPatternAnalyzer.identifyMomentumIndicators(conversationHistory);
  }

  /**
   * Assess conversation readiness for next action
   */
  static assessActionReadiness(conversationHistory: ChatMessage[]): {
    readyForDemo: boolean;
    readyForContact: boolean;
    readyForEscalation: boolean;
    confidence: number;
  } {
    return BehavioralPatternAnalyzer.assessActionReadiness(conversationHistory);
  }

  /**
   * Infer intent from message content
   */
  static inferIntentFromMessage(content: string): string {
    return IntentInferenceService.inferIntentFromMessage(content);
  }

  /**
   * Infer sentiment from message content
   */
  static inferSentiment(content: string): string {
    return IntentInferenceService.inferSentiment(content);
  }

  /**
   * Assess engagement level from message content
   */
  static assessEngagementLevel(content: string): string {
    return IntentInferenceService.assessEngagementLevel(content);
  }

  /**
   * Determine conversation phase based on intent progression
   */
  static determineConversationPhase(recentIntents: string[]): string {
    return IntentInferenceService.determineConversationPhase(recentIntents);
  }

  /**
   * Calculate intent confidence score
   */
  static calculateIntentConfidence(content: string, inferredIntent: string): number {
    return IntentInferenceService.calculateIntentConfidence(content, inferredIntent);
  }

  /**
   * Build comprehensive conversation analysis
   */
  static buildConversationAnalysis(conversationHistory: ChatMessage[]): string {
    return ConversationAnalysisBuilder.buildConversationContextAnalysis(conversationHistory);
  }

  /**
   * Build prompt template sections
   */
  static buildPromptSections() {
    return {
      unifiedProcessing: PromptTemplateService.buildUnifiedProcessingTemplate(),
      entityExtraction: PromptTemplateService.buildEntityExtractionTemplate(),
      personaInference: PromptTemplateService.buildPersonaInferenceTemplate(),
      sentimentAnalysis: PromptTemplateService.buildSentimentAnalysisTemplate(),
      conversationFlow: PromptTemplateService.buildConversationFlowTemplate(),
      leadScoring: PromptTemplateService.buildLeadScoringTemplate(),
      responseExcellence: PromptTemplateService.buildResponseExcellenceTemplate(),
      reasoningProcess: PromptTemplateService.buildReasoningProcessTemplate()
    };
  }

  /**
   * Get comprehensive behavioral analysis
   */
  static getComprehensiveBehavioralAnalysis(conversationHistory: ChatMessage[]) {
    return {
      behaviorSignals: BehavioralPatternAnalyzer.extractBehaviorSignals(conversationHistory),
      engagementProgression: BehavioralPatternAnalyzer.analyzeEngagementProgression(conversationHistory),
      momentumIndicators: BehavioralPatternAnalyzer.identifyMomentumIndicators(conversationHistory),
      actionReadiness: BehavioralPatternAnalyzer.assessActionReadiness(conversationHistory)
    };
  }

  /**
   * Get conversation intelligence summary
   */
  static getConversationIntelligence(conversationHistory: ChatMessage[]) {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    const recentIntents = userMessages.slice(-5).map(m => 
      IntentInferenceService.inferIntentFromMessage(m.content)
    );
    
    return {
      messageCount: conversationHistory.length,
      userMessageCount: userMessages.length,
      recentIntents,
      conversationPhase: IntentInferenceService.determineConversationPhase(recentIntents),
      behavioralAnalysis: this.getComprehensiveBehavioralAnalysis(conversationHistory),
      conversationAnalysis: ConversationAnalysisBuilder.buildConversationContextAnalysis(conversationHistory)
    };
  }

  /**
   * Build context-aware prompt for specific conversation state
   */
  static buildContextAwarePrompt(
    conversationHistory: ChatMessage[],
    focusArea?: 'qualification' | 'demo' | 'closing' | 'support'
  ): string {
    let prompt = this.buildUnifiedProcessingPrompt(conversationHistory);
    
    // Add focus-specific guidance
    if (focusArea) {
      prompt += this.buildFocusAreaGuidance(focusArea);
    }
    
    return prompt;
  }

  /**
   * Build focus area specific guidance
   */
  private static buildFocusAreaGuidance(focusArea: string): string {
    switch (focusArea) {
      case 'qualification':
        return '\n\n## Current Focus: Lead Qualification\nPrioritize gathering business context, authority assessment, and timeline understanding.';
      case 'demo':
        return '\n\n## Current Focus: Demonstration\nFocus on showcasing relevant features and gathering specific use case requirements.';
      case 'closing':
        return '\n\n## Current Focus: Closing\nGuide toward next steps, contact capture, or meeting scheduling.';
      case 'support':
        return '\n\n## Current Focus: Support\nProvide helpful assistance while identifying escalation opportunities.';
      default:
        return '';
    }
  }
} 