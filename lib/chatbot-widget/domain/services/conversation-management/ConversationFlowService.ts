/**
 * AI-Driven Conversation Flow Service (Domain)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Process AI-provided conversation flow decisions
 * - Pure domain logic - no infrastructure dependencies
 * - Use AI decisions instead of hard-coded business rules
 * - Follow @golden-rule patterns exactly
 * - Stay under 200-250 lines
 * - Publish domain events for flow state changes
 * - UPDATED: Replaced rule-based flow with AI-driven decisions
 */

import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError';

export interface AIConversationFlowDecision {
  shouldCaptureLeadNow: boolean;
  shouldAskQualificationQuestions: boolean;
  shouldEscalateToHuman: boolean;
  nextBestAction: 'continue_conversation' | 'capture_contact' | 'ask_qualification' | 'request_demo' | 'escalate_human' | 'provide_resources';
  conversationPhase: 'discovery' | 'qualification' | 'demonstration' | 'closing' | 'support' | 'escalation';
  engagementLevel: 'low' | 'medium' | 'high' | 'very_high';
  readinessIndicators: {
    hasContactInfo: boolean;
    showsBuyingIntent: boolean;
    hasDecisionAuthority: boolean;
    hasBudgetIndications: boolean;
    hasTimelineUrgency: boolean;
  };
  flowReasoning: string;
}

export interface ConversationFlowState {
  currentPhase: string;
  messageCount: number;
  engagementScore: number;
  lastFlowDecision: AIConversationFlowDecision | null;
  flowHistory: AIConversationFlowDecision[];
}

export class ConversationFlowService {
  
  /**
   * Process AI-provided conversation flow decision
   * Validates and applies AI decision to conversation state
   */
  static processAIFlowDecision(
    decision: AIConversationFlowDecision,
    currentState: ConversationFlowState
  ): ConversationFlowState {
    // Validate AI decision structure
    this.validateFlowDecision(decision);
    
    // Apply AI decision to conversation state
    const updatedState: ConversationFlowState = {
      ...currentState,
      currentPhase: decision.conversationPhase,
      lastFlowDecision: decision,
      flowHistory: [...currentState.flowHistory, decision]
    };
    
    return updatedState;
  }
  
  /**
   * Determine if lead capture should be triggered
   * Uses AI decision instead of message count rules
   */
  static shouldTriggerLeadCapture(decision: AIConversationFlowDecision): boolean {
    return decision.shouldCaptureLeadNow || decision.nextBestAction === 'capture_contact';
  }
  
  /**
   * Determine if qualification questions should be asked
   * Uses AI contextual understanding instead of timing rules
   */
  static shouldAskQualificationQuestions(decision: AIConversationFlowDecision): boolean {
    return decision.shouldAskQualificationQuestions || decision.nextBestAction === 'ask_qualification';
  }
  
  /**
   * Determine if escalation to human is needed
   * Uses AI analysis instead of keyword/threshold rules
   */
  static shouldEscalateToHuman(decision: AIConversationFlowDecision): boolean {
    return decision.shouldEscalateToHuman || decision.nextBestAction === 'escalate_human';
  }
  
  /**
   * Get conversation readiness score based on AI indicators
   * Replaces manual scoring calculations
   */
  static calculateReadinessScore(indicators: AIConversationFlowDecision['readinessIndicators']): number {
    const weights = {
      hasContactInfo: 25,
      showsBuyingIntent: 30,
      hasDecisionAuthority: 20,
      hasBudgetIndications: 15,
      hasTimelineUrgency: 10
    };
    
    let score = 0;
    if (indicators.hasContactInfo) score += weights.hasContactInfo;
    if (indicators.showsBuyingIntent) score += weights.showsBuyingIntent;
    if (indicators.hasDecisionAuthority) score += weights.hasDecisionAuthority;
    if (indicators.hasBudgetIndications) score += weights.hasBudgetIndications;
    if (indicators.hasTimelineUrgency) score += weights.hasTimelineUrgency;
    
    return score;
  }
  
  /**
   * Get next recommended actions based on AI decision
   */
  static getRecommendedActions(decision: AIConversationFlowDecision): string[] {
    const actions: string[] = [];
    
    if (decision.shouldCaptureLeadNow) {
      actions.push('Capture lead contact information');
    }
    
    if (decision.shouldAskQualificationQuestions) {
      actions.push('Ask qualification questions');
    }
    
    if (decision.shouldEscalateToHuman) {
      actions.push('Escalate to human agent');
    }
    
    switch (decision.nextBestAction) {
      case 'request_demo':
        actions.push('Offer product demonstration');
        break;
      case 'provide_resources':
        actions.push('Share relevant resources');
        break;
      case 'continue_conversation':
        actions.push('Continue natural conversation');
        break;
    }
    
    return actions;
  }
  
  /**
   * Validate AI conversation flow decision structure
   */
  private static validateFlowDecision(decision: AIConversationFlowDecision): void {
    if (typeof decision.shouldCaptureLeadNow !== 'boolean') {
      throw new BusinessRuleViolationError(
        'shouldCaptureLeadNow must be a boolean',
        { decision }
      );
    }
    
    if (typeof decision.shouldAskQualificationQuestions !== 'boolean') {
      throw new BusinessRuleViolationError(
        'shouldAskQualificationQuestions must be a boolean',
        { decision }
      );
    }
    
    if (typeof decision.shouldEscalateToHuman !== 'boolean') {
      throw new BusinessRuleViolationError(
        'shouldEscalateToHuman must be a boolean',
        { decision }
      );
    }
    
    const validActions = ['continue_conversation', 'capture_contact', 'ask_qualification', 'request_demo', 'escalate_human', 'provide_resources'];
    if (!validActions.includes(decision.nextBestAction)) {
      throw new BusinessRuleViolationError(
        `Invalid nextBestAction: ${decision.nextBestAction}`,
        { decision, validActions }
      );
    }
    
    const validPhases = ['discovery', 'qualification', 'demonstration', 'closing', 'support', 'escalation'];
    if (!validPhases.includes(decision.conversationPhase)) {
      throw new BusinessRuleViolationError(
        `Invalid conversationPhase: ${decision.conversationPhase}`,
        { decision, validPhases }
      );
    }
    
    const validEngagementLevels = ['low', 'medium', 'high', 'very_high'];
    if (!validEngagementLevels.includes(decision.engagementLevel)) {
      throw new BusinessRuleViolationError(
        `Invalid engagementLevel: ${decision.engagementLevel}`,
        { decision, validEngagementLevels }
      );
    }
    
    if (!decision.readinessIndicators || typeof decision.readinessIndicators !== 'object') {
      throw new BusinessRuleViolationError(
        'readinessIndicators must be an object',
        { decision }
      );
    }
    
    if (!decision.flowReasoning || typeof decision.flowReasoning !== 'string') {
      throw new BusinessRuleViolationError(
        'flowReasoning must be a non-empty string',
        { decision }
      );
    }
  }
} 