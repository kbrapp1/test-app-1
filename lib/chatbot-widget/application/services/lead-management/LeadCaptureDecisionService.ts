/**
 * AI-Driven Lead Capture Decision Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Process AI-provided lead capture decisions ONLY
 * - No fallback logic - system requires AI decisions for all operations
 * - Follow @golden-rule patterns exactly
 * - Stay under 200-250 lines
 * - Delegate to ConversationFlowService for AI decision processing
 * - UPDATED: Pure API-driven approach with log file tracking only
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ConversationFlowService, AIConversationFlowDecision } from '../../../domain/services/conversation-management/ConversationFlowService';

export class LeadCaptureDecisionService {
  constructor(
    private conversationFlowService: ConversationFlowService
  ) {}

  /**
   * Determine if lead capture should be triggered based on AI decisions
   * Pure API-driven approach - no hardcoded fallbacks
   */
  shouldTriggerLeadCapture(
    session: ChatSession,
    config: ChatbotConfig,
    context: { aiFlowDecision: AIConversationFlowDecision }
  ): boolean {
    // Check if lead already exists to avoid duplicates
    if (session.hasContactInfo()) {
      return false;
    }

    // Use AI decision directly - no fallback logic
    return context.aiFlowDecision.shouldCaptureLeadNow;
  }

  /**
   * Create AI flow context from enhanced context data
   * Maps enhanced context to AI flow decision format for consistency
   */
  createAIFlowContext(enhancedContext: any): { aiFlowDecision: AIConversationFlowDecision } {
    if (!enhancedContext) {
      throw new Error('Enhanced context is required for AI-driven lead capture decisions');
    }

    const leadScore = enhancedContext.leadScore?.totalScore || 0;
    const callToAction = enhancedContext.callToAction || {};

    return {
      aiFlowDecision: {
        shouldCaptureLeadNow: leadScore >= 60, // FIXED: Aligned with AI recommendation threshold (60+)
        shouldAskQualificationQuestions: leadScore >= 30 && leadScore < 70,
        shouldEscalateToHuman: leadScore >= 80 || callToAction.priority === 'high',
        nextBestAction: this.mapCallToActionToNextAction(callToAction),
        conversationPhase: this.determinePhaseFromScore(leadScore),
        engagementLevel: this.determineEngagementFromScore(leadScore),
        flowReasoning: `Lead score: ${leadScore}, CTA: ${callToAction.type || 'none'}`
      }
    };
  }

  private mapCallToActionToNextAction(callToAction: any): 'continue_conversation' | 'capture_contact' | 'ask_qualification' | 'request_demo' | 'escalate_human' | 'provide_resources' {
    switch (callToAction.type) {
      case 'demo_request': return 'request_demo';
      case 'resource_sharing': return 'provide_resources';
      case 'contact_capture': return 'capture_contact';
      case 'qualification': return 'ask_qualification';
      case 'escalation': return 'escalate_human';
      default: return 'continue_conversation';
    }
  }

  private determinePhaseFromScore(score: number): 'discovery' | 'qualification' | 'demonstration' | 'closing' | 'support' | 'escalation' {
    if (score >= 70) return 'qualification';
    if (score >= 40) return 'discovery';
    return 'discovery'; // Changed from 'introduction' to valid enum value
  }

  private determineEngagementFromScore(score: number): 'low' | 'medium' | 'high' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
} 