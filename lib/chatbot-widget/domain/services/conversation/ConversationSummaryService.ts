/**
 * Conversation Summary Service
 * 
 * Single responsibility: Generate conversation summaries and overviews
 * Creates structured summaries from conversation data and API analysis
 * Follows DDD patterns with clear business logic separation
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ChatSession } from '../../entities/ChatSession';
import { ConversationSummary } from '../../value-objects/message-processing/ContextAnalysis';
import { MessageValidationUtils } from '../../utilities/MessageValidationUtils';
import { ApiAnalysisData } from './ContextAnalysisService';

export class ConversationSummaryService {
  generateConversationSummary(
    messages: ChatMessage[],
    session: ChatSession,
    apiAnalysisData?: ApiAnalysisData
  ): ConversationSummary {
    const context = session.contextData;
    
    const overview = this.createOverview(messages, context as unknown as Record<string, unknown>);
    const summaryData = this.extractSummaryData(apiAnalysisData, context as unknown as Record<string, unknown>);

    return {
      overview,
      keyTopics: summaryData.keyTopics,
      userNeeds: summaryData.userNeeds,
      painPoints: summaryData.painPoints,
      nextSteps: summaryData.nextSteps,
      qualificationStatus: summaryData.qualificationStatus,
    };
  }

  private createOverview(messages: ChatMessage[], context: Record<string, unknown>): string {
    const userMessages = MessageValidationUtils.getUserMessages(messages);
    const messageStats = MessageValidationUtils.getMessageStatistics(messages);
    
    if (userMessages.length === 0) {
      return 'No user interaction yet';
    }
    
    const conversationMetrics = this.calculateConversationMetrics(context);
    
    return this.buildOverviewText(messageStats, conversationMetrics);
  }

  private calculateConversationMetrics(context: Record<string, unknown>) {
    const hasContactInfo = Boolean(context.email || context.phone);
    const topicsCount = Array.isArray(context.topics) ? context.topics.length : 0;
    
    return {
      hasContactInfo,
      topicsCount
    };
  }

  private buildOverviewText(
    messageStats: ReturnType<typeof MessageValidationUtils.getMessageStatistics>,
    metrics: { hasContactInfo: boolean; topicsCount: number }
  ): string {
    const baseText = `Active conversation with ${messageStats.userMessages} user messages (${messageStats.totalMessages} total). `;
    const contactText = metrics.hasContactInfo ? 'Contact info captured. ' : '';
    const topicsText = metrics.topicsCount > 0 
      ? `${metrics.topicsCount} topics discussed.` 
      : 'Topics being explored.';
    
    return baseText + contactText + topicsText;
  }

  private extractSummaryData(apiAnalysisData?: ApiAnalysisData, context?: Record<string, unknown>) {
    return {
      keyTopics: apiAnalysisData?.entities?.evaluationCriteria || (context?.topics as string[]) || [],
      userNeeds: apiAnalysisData?.entities?.integrationNeeds || [],
      painPoints: apiAnalysisData?.entities?.painPoints || [],
      nextSteps: apiAnalysisData?.conversationFlow?.nextSteps || ['Continue conversation'],
      qualificationStatus: apiAnalysisData?.conversationFlow?.qualificationStatus || 'unknown'
    };
  }
}