/**
 * AI-Driven Lead Capture Decision Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Process AI-provided lead capture decisions
 * - Use AI conversation flow decisions instead of business rule thresholds
 * - Follow @golden-rule patterns exactly
 * - Stay under 200-250 lines
 * - Delegate to ConversationFlowService for AI decision processing
 * - UPDATED: Replaced rule-based decisions with AI-driven approach
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ConversationFlowService, AIConversationFlowDecision } from '../../../domain/services/conversation-management/ConversationFlowService';

export interface LeadCaptureDecisionContext {
  session: ChatSession;
  config: ChatbotConfig;
  aiFlowDecision?: AIConversationFlowDecision;
  enhancedContext?: any; // From unified processing result
}

export class LeadCaptureDecisionService {
  
  /**
   * Determine if lead capture should be triggered
   * Uses AI decision when available, fallback to basic checks when not
   */
  shouldTriggerLeadCapture(
    session: ChatSession, 
    config: ChatbotConfig, 
    context?: { aiFlowDecision?: AIConversationFlowDecision }
  ): boolean {
    // Check if lead already captured
    if (session.hasContactInfo()) {
      return false;
    }

    // Use AI decision when available (preferred approach)
    if (context?.aiFlowDecision) {
      return ConversationFlowService.shouldTriggerLeadCapture(context.aiFlowDecision);
    }

    // No fallback - AI service is required for lead capture decisions
    throw new Error('AI flow decision is required for lead capture determination');
  }

  /**
   * Generate suggested next actions based on AI flow decisions
   * Uses AI recommendations when available, fallback to basic logic when not
   */
  generateSuggestedActions(
    session: ChatSession,
    config: ChatbotConfig,
    shouldCaptureLeadInfo: boolean,
    context?: { aiFlowDecision?: AIConversationFlowDecision }
  ): string[] {
    // Use AI-recommended actions when available (preferred approach)
    if (context?.aiFlowDecision) {
      const actions: string[] = [];
      const nextAction = ConversationFlowService.getNextBestAction(context.aiFlowDecision);
      
      if (ConversationFlowService.shouldTriggerLeadCapture(context.aiFlowDecision)) {
        actions.push('Initiate lead capture flow');
      }
      
      if (ConversationFlowService.shouldAskQualificationQuestions(context.aiFlowDecision)) {
        actions.push('Ask qualification questions');
      }
      
      if (ConversationFlowService.shouldEscalateToHuman(context.aiFlowDecision)) {
        actions.push('Escalate to human agent');
      }
      
      switch (nextAction) {
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
      
      return actions.length > 0 ? actions : ['Continue conversation'];
    }

    // No fallback - AI service is required for action generation
    throw new Error('AI flow decision is required for action generation');
  }

  /**
   * Check if qualification questions should be asked
   * Uses AI decision when available
   */
  shouldAskQualificationQuestions(
    session: ChatSession,
    context?: { aiFlowDecision?: AIConversationFlowDecision }
  ): boolean {
    // Use AI decision when available
    if (context?.aiFlowDecision) {
      return ConversationFlowService.shouldAskQualificationQuestions(context.aiFlowDecision);
    }

    // Fallback: Check if already in qualification process
    return session.leadQualificationState.qualificationStatus === 'not_started' &&
           session.contextData.engagementScore >= 60;
  }

  /**
   * Check if escalation to human is needed
   * Uses AI decision when available
   */
  shouldEscalateToHuman(
    session: ChatSession,
    context?: { aiFlowDecision?: AIConversationFlowDecision }
  ): boolean {
    // Use AI decision when available
    if (context?.aiFlowDecision) {
      return ConversationFlowService.shouldEscalateToHuman(context.aiFlowDecision);
    }

    // Fallback: Basic escalation triggers
    return session.getSessionDuration() > 15; // Long session indicates need for human intervention
  }

  /**
   * Get conversation readiness metrics
   * Uses AI indicators when available
   * 
   * AI INSTRUCTIONS:
   * - Uses derived readiness indicators from domain service
   * - Follow @golden-rule.mdc error handling patterns
   * - Provide sensible fallbacks when AI data is incomplete
   */
  getConversationReadiness(
    session: ChatSession,
    context?: { aiFlowDecision?: AIConversationFlowDecision }
  ): {
    readinessScore: number;
    phase: string;
    engagementLevel: string;
    indicators: Record<string, boolean>;
  } {
    if (context?.aiFlowDecision) {
      // Use derived readiness indicators from domain service
      const readinessIndicators = ConversationFlowService.getReadinessIndicators(context.aiFlowDecision);
      
      return {
        readinessScore: ConversationFlowService.calculateReadinessScore(context.aiFlowDecision),
        phase: ConversationFlowService.getConversationPhase(context.aiFlowDecision),
        engagementLevel: ConversationFlowService.getEngagementLevel(context.aiFlowDecision),
        indicators: {
          hasContactInfo: readinessIndicators.hasContactInfo,
          showsBuyingIntent: readinessIndicators.showsBuyingIntent,
          hasDecisionAuthority: readinessIndicators.hasDecisionAuthority,
          hasBudgetIndications: readinessIndicators.hasBudgetIndications,
          hasTimelineUrgency: readinessIndicators.hasTimelineUrgency
        }
      };
    }

    // Fallback to basic calculation when AI decision not available
    const engagementScore = session.contextData.engagementScore || 0;
    const sessionDuration = session.getSessionDuration();

    return {
      readinessScore: Math.min(engagementScore, 100),
      phase: 'discovery',
      engagementLevel: engagementScore > 70 ? 'high' : engagementScore > 40 ? 'medium' : 'low',
      indicators: {
        hasContactInfo: session.hasContactInfo(),
        showsBuyingIntent: session.contextData.topics?.includes('pricing') || false,
        hasDecisionAuthority: false,
        hasBudgetIndications: false,
        hasTimelineUrgency: sessionDuration > 10
      }
    };
  }

  // Removed fallback methods - system now requires AI service for all decisions
} 