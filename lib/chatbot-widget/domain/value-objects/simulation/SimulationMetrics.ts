import { ChatMessage } from '../../entities/ChatMessage';
import { PerformanceMetrics, QualityAssessment } from './SimulationResults';

export class SimulationMetrics {
  private constructor() {}

  static calculatePerformanceMetrics(
    messages: ChatMessage[],
    startTime: Date,
    endTime?: Date
  ): PerformanceMetrics {
    const duration = SimulationMetrics.calculateDurationInSeconds(startTime, endTime);
    const botMessages = messages.filter(msg => msg.messageType === 'bot');
    
    const averageResponseTime = botMessages.reduce((sum, msg) => {
      return sum + (msg.processingTime || 1000); // Default 1s if not recorded
    }, 0) / Math.max(botMessages.length, 1);

    return {
      averageResponseTime,
      totalDuration: duration,
      messagesPerMinute: duration > 0 ? (messages.length / duration) * 60 : 0,
      errorCount: botMessages.filter(msg => msg.contextMetadata.errorType).length,
    };
  }

  static calculateQualityAssessment(messages: ChatMessage[]): QualityAssessment {
    const userMessages = messages.filter(msg => msg.messageType === 'user');
    const botMessages = messages.filter(msg => msg.messageType === 'bot');
    
    // Basic heuristics for quality scoring
    const relevanceScore = botMessages.length > 0 ? 75 : 0; // Default reasonable score
    const accuracyScore = SimulationMetrics.calculateAccuracyScore(botMessages);
    const userSatisfactionScore = SimulationMetrics.calculateSatisfactionScore(userMessages, botMessages, messages);
    const knowledgeBaseUtilization = SimulationMetrics.calculateKnowledgeUtilization(botMessages);

    return {
      relevanceScore,
      accuracyScore,
      userSatisfactionScore,
      knowledgeBaseUtilization,
    };
  }

  private static calculateDurationInSeconds(startTime: Date, endTime?: Date): number {
    const end = endTime || new Date();
    return Math.floor((end.getTime() - startTime.getTime()) / 1000);
  }

  private static calculateAccuracyScore(botMessages: ChatMessage[]): number {
    if (botMessages.length === 0) return 0;
    
    const accurateMessages = botMessages.filter(msg => !msg.contextMetadata.errorType).length;
    return (accurateMessages / botMessages.length) * 100;
  }

  private static calculateSatisfactionScore(
    userMessages: ChatMessage[],
    botMessages: ChatMessage[],
    allMessages: ChatMessage[]
  ): number {
    if (userMessages.length === 0 || botMessages.length === 0) return 0;
    
    // Base score on response ratio and conversation length
    const responseRatio = botMessages.length / userMessages.length;
    const conversationLength = allMessages.length;
    
    let score = 50; // Base score
    
    // Good response ratio (1:1 or close)
    if (responseRatio >= 0.8 && responseRatio <= 1.2) score += 20;
    
    // Reasonable conversation length
    if (conversationLength >= 4 && conversationLength <= 20) score += 20;
    
    // Bonus for lead qualification questions being answered
    if (SimulationMetrics.hasLeadInformation(userMessages)) score += 10;
    
    return Math.min(score, 100);
  }

  private static calculateKnowledgeUtilization(botMessages: ChatMessage[]): number {
    // Simplified calculation - could be enhanced with semantic analysis
    const messagesWithKnowledge = botMessages.filter(msg => 
      msg.content.length > 50 && // Substantial responses
      !msg.content.toLowerCase().includes('i don\'t know') &&
      !msg.content.toLowerCase().includes('i\'m not sure')
    );
    
    if (botMessages.length === 0) return 0;
    return (messagesWithKnowledge.length / botMessages.length) * 100;
  }

  private static hasLeadInformation(userMessages: ChatMessage[]): boolean {
    // Check if any user messages contain email or phone patterns
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    
    return userMessages.some(msg => 
      emailPattern.test(msg.content) || phonePattern.test(msg.content)
    );
  }

  static analyzeConversationFlow(messages: ChatMessage[]): {
    hasGoodFlow: boolean;
    averageMessageLength: number;
    responseConsistency: number;
  } {
    if (messages.length === 0) {
      return { hasGoodFlow: false, averageMessageLength: 0, responseConsistency: 0 };
    }

    const averageMessageLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length;
    
    // Check for consistent response patterns
    const botMessages = messages.filter(msg => msg.messageType === 'bot');
    const responseLengths = botMessages.map(msg => msg.content.length);
    const avgResponseLength = responseLengths.reduce((sum, len) => sum + len, 0) / Math.max(responseLengths.length, 1);
    
    // Calculate consistency (lower variance = higher consistency)
    const variance = responseLengths.reduce((sum, len) => sum + Math.pow(len - avgResponseLength, 2), 0) / Math.max(responseLengths.length, 1);
    const responseConsistency = Math.max(0, 100 - (variance / 100)); // Normalize to 0-100
    
    const hasGoodFlow = averageMessageLength > 20 && averageMessageLength < 500 && responseConsistency > 50;
    
    return {
      hasGoodFlow,
      averageMessageLength,
      responseConsistency: Math.min(responseConsistency, 100),
    };
  }
} 