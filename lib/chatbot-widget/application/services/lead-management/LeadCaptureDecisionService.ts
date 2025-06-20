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

    // Fallback: Basic engagement check (no AI available)
    return this.shouldTriggerLeadCaptureFallback(session, config);
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
      return ConversationFlowService.getRecommendedActions(context.aiFlowDecision);
    }

    // Fallback: Generate basic actions (no AI available)
    return this.generateSuggestedActionsFallback(session, config, shouldCaptureLeadInfo);
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
      return {
        readinessScore: ConversationFlowService.calculateReadinessScore(context.aiFlowDecision.readinessIndicators),
        phase: context.aiFlowDecision.conversationPhase,
        engagementLevel: context.aiFlowDecision.engagementLevel,
        indicators: context.aiFlowDecision.readinessIndicators
      };
    }

    // Fallback: Basic readiness calculation
    return {
      readinessScore: session.contextData.engagementScore || 0,
      phase: 'discovery',
      engagementLevel: session.contextData.engagementScore > 70 ? 'high' : 'medium',
      indicators: {
        hasContactInfo: session.hasContactInfo(),
        showsBuyingIntent: session.contextData.topics.includes('pricing'),
        hasDecisionAuthority: false, // Cannot determine without AI
        hasBudgetIndications: false, // Cannot determine without AI
        hasTimelineUrgency: false   // Cannot determine without AI
      }
    };
  }

  /**
   * Fallback method for lead capture decision (when AI not available)
   * Maintains backward compatibility
   */
  private shouldTriggerLeadCaptureFallback(session: ChatSession, config: ChatbotConfig): boolean {
    // Check engagement score threshold
    if (session.contextData.engagementScore >= 70) {
      return true;
    }

    // Check session duration (more than 5 minutes of active conversation)
    const sessionDuration = session.getSessionDuration();
    if (sessionDuration >= 5) {
      return true;
    }

    // Check if user shows buying intent
    const buyingIntentTopics = ['pricing', 'trial', 'demo', 'features'];
    const hasBuyingIntent = session.contextData.topics.some(topic => 
      buyingIntentTopics.includes(topic)
    );
    
    return hasBuyingIntent && session.contextData.engagementScore >= 50;
  }

  /**
   * Fallback method for generating actions (when AI not available)
   * Maintains backward compatibility
   */
  private generateSuggestedActionsFallback(
    session: ChatSession,
    config: ChatbotConfig,
    shouldCaptureLeadInfo: boolean
  ): string[] {
    const actions: string[] = [];

    if (shouldCaptureLeadInfo) {
      actions.push('Initiate lead capture flow');
      actions.push('Ask for contact information');
    }

    if (session.contextData.engagementScore > 80) {
      actions.push('Offer product demo');
      actions.push('Connect with sales representative');
    }

    const sessionDuration = session.getSessionDuration();
    if (sessionDuration > 10) {
      actions.push('Suggest scheduling a call');
      actions.push('Provide comprehensive resource links');
    }

    // Check for specific topics that warrant actions
    if (session.contextData.topics.includes('pricing')) {
      actions.push('Provide pricing information');
    }

    if (session.contextData.topics.includes('demo')) {
      actions.push('Schedule product demonstration');
    }

    if (session.contextData.topics.includes('support')) {
      actions.push('Connect with support team');
    }

    // Default actions if none specific
    if (actions.length === 0) {
      actions.push('Continue conversation');
      actions.push('Ask clarifying questions');
    }

    return actions;
  }
} 