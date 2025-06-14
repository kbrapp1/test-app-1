/**
 * Lead Capture Decision Service
 * 
 * Application service for determining when to trigger lead capture.
 * Single responsibility: Handle lead capture decision logic and suggested actions.
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';

export class LeadCaptureDecisionService {
  /**
   * Determine if lead capture should be triggered
   */
  shouldTriggerLeadCapture(session: ChatSession, config: ChatbotConfig): boolean {
    // Check if lead already captured
    if (session.hasContactInfo()) {
      return false;
    }

    // Check if already in qualification process
    if (session.leadQualificationState.qualificationStatus === 'in_progress' || 
        session.leadQualificationState.qualificationStatus === 'completed') {
      return false;
    }

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
    
    if (hasBuyingIntent && session.contextData.engagementScore >= 50) {
      return true;
    }

    return false;
  }

  /**
   * Generate suggested next actions based on session state
   */
  generateSuggestedActions(
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

    if (session.leadQualificationState.answeredQuestions.length > 0) {
      const progress = session.leadQualificationState.answeredQuestions.length / config.leadQualificationQuestions.length;
      if (progress > 0.5) {
        actions.push('Continue qualification process');
      }
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