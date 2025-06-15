/**
 * Conversation Stage Service
 * 
 * Domain service for determining conversation stages and progression.
 * Single responsibility: Analyze conversation flow and determine current stage.
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ChatSession, SessionContext } from '../../entities/ChatSession';

export class ConversationStageService {
  /**
   * Determine conversation stage
   */
  determineConversationStage(
    messages: ChatMessage[]
  ): 'greeting' | 'discovery' | 'qualification' | 'closing' | 'support' {
    if (messages.length <= 2) return 'greeting';
    
    const hasQualificationMessages = messages.some(m => 
      m.messageType === 'qualification' || m.messageType === 'lead_capture'
    );
    
    if (hasQualificationMessages) return 'qualification';
    
    const userMessages = messages.filter(m => m.isFromUser());
    const hasDetailedQuestions = userMessages.some(m => m.content.length > 100);
    
    if (hasDetailedQuestions) return 'discovery';
    
    const hasClosingKeywords = userMessages.some(m => {
      const content = m.content.toLowerCase();
      return ['buy', 'purchase', 'sign up', 'get started', 'contact'].some(keyword => 
        content.includes(keyword)
      );
    });
    
    if (hasClosingKeywords) return 'closing';
    
    return 'discovery';
  }

  /**
   * Get conversation duration in friendly format
   */
  getConversationDuration(messages: ChatMessage[]): string {
    if (messages.length < 2) return '0 minutes';
    
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const durationMs = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
    const minutes = Math.floor(durationMs / 60000);
    
    if (minutes < 1) return 'less than a minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  }

  /**
   * Create conversation overview
   */
  createOverview(messages: ChatMessage[], context: SessionContext): string {
    const userMessages = messages.filter(m => m.isFromUser());
    const duration = this.getConversationDuration(messages);
    
    if (userMessages.length === 0) {
      return 'No user interaction recorded.';
    }

    const overview = `Conversation with ${userMessages.length} user messages over ${duration}. `;
    const topicsText = context.topics.length > 0 ? 
      `Discussed: ${context.topics.slice(0, 3).join(', ')}.` : '';
    
    return overview + topicsText;
  }

  /**
   * Identify key topics from context
   */
  identifyKeyTopics(userMessages: ChatMessage[], contextTopics: string[]): string[] {
    // This would use MessageAnalysisService in the refactored version
    const messageTopics: string[] = []; // Simplified for now
    const allTopics = Array.from(new Set([...contextTopics, ...messageTopics]));
    return allTopics.slice(0, 5); // Top 5 topics
  }

  /**
   * Suggest next steps based on conversation
   */
  suggestNextSteps(session: ChatSession, messages: ChatMessage[]): string[] {
    const steps: string[] = [];
    const context = session.contextData;
    
    // Simplified analysis for now - would use MessageAnalysisService
    const conversationStage = this.determineConversationStage(messages);

    if (!context.email && !context.phone) {
      steps.push('Capture contact information');
    }

    if (conversationStage === 'discovery') {
      steps.push('Qualify budget and timeline');
    }

    // Check for demo intent (simplified)
    const userMessages = messages.filter(m => m.isFromUser());
    const hasDemoIntent = userMessages.some(m => 
      m.content.toLowerCase().includes('demo')
    );
    
    if (hasDemoIntent) {
      steps.push('Schedule product demonstration');
    }

    // Check for urgency (simplified)
    const hasUrgentKeywords = userMessages.some(m => {
      const content = m.content.toLowerCase();
      return ['urgent', 'asap', 'immediately', 'now', 'today'].some(keyword => 
        content.includes(keyword)
      );
    });
    
    if (hasUrgentKeywords) {
      steps.push('Prioritize immediate follow-up');
    }

    if (steps.length === 0) {
      steps.push('Continue conversation and build rapport');
    }

    return steps;
  }

  /**
   * Assess qualification status
   */
  assessQualificationStatus(session: ChatSession): string {
    const state = session.leadQualificationState;
    
    if (state.qualificationStatus === 'completed' && state.isQualified) {
      return `Qualified (Score: ${state.leadScore}/100)`;
    }
    
    if (state.qualificationStatus === 'in_progress') {
      return `In Progress (${state.currentStep} questions answered)`;
    }
    
    if (state.qualificationStatus === 'not_started') {
      return 'Not started';
    }
    
    return 'Not qualified';
  }

  /**
   * Create conversation summary
   */
  createConversationSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.isFromUser());
    
    if (userMessages.length === 0) {
      return 'No conversation yet.';
    }

    const recentMessages = userMessages.slice(-3);
    const summary = recentMessages
      .map(m => m.content)
      .join(' ')
      .substring(0, 200);
    
    return summary + (summary.length === 200 ? '...' : '');
  }
} 