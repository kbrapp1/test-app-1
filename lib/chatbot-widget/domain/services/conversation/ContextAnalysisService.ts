/**
 * Context Analysis Service
 * 
 * Single responsibility: Analyze conversation context using API-provided data
 * Processes OpenAI analysis data and generates context insights
 * Follows DDD patterns with clear separation from infrastructure concerns
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ChatSession } from '../../entities/ChatSession';
import { ContextAnalysis, ContextAnalysisValueObject } from '../../value-objects/message-processing/ContextAnalysis';
import { MessageValidationUtils } from '../../utilities/MessageValidationUtils';

/** API-provided analysis data from OpenAI */
export interface ApiAnalysisData {
  entities?: {
    urgency?: 'low' | 'medium' | 'high';
    painPoints?: string[];
    integrationNeeds?: string[];
    evaluationCriteria?: string[];
    company?: string;
    role?: string;
    budget?: string;
    timeline?: string;
    teamSize?: string;
    industry?: string;
    contactMethod?: string;
    visitorName?: string;
    email?: string;
    phone?: string;
  };
  personaInference?: {
    role?: string;
    industry?: string;
    evidence?: string[];
  };
  leadScore?: {
    scoreBreakdown?: {
      engagementLevel?: number;
    };
  };
  conversationFlow?: {
    currentStage?: string;
    nextSteps?: string[];
    qualificationStatus?: string;
  };
}

export class ContextAnalysisService {
  analyzeContext(
    messages: ChatMessage[], 
    session?: ChatSession,
    apiAnalysisData?: ApiAnalysisData
  ): ContextAnalysis {
    const userMessages = MessageValidationUtils.getUserMessages(messages);
    
    if (userMessages.length === 0) {
      return ContextAnalysisValueObject.createDefault().toPlainObject();
    }

    const analysisData = this.extractAnalysisData(apiAnalysisData);
    const engagementLevel = this.calculateEngagementLevel(userMessages, analysisData);

    const analysis = new ContextAnalysisValueObject(
      analysisData.topics,
      analysisData.interests,
      'neutral', // Sentiment from API
      engagementLevel,
      'unknown', // Intent from separate classification
      analysisData.urgency,
      'discovery' // Stage from API
    );

    return analysis.toPlainObject();
  }

  private extractAnalysisData(apiAnalysisData?: ApiAnalysisData) {
    return {
      topics: apiAnalysisData?.entities?.evaluationCriteria || [],
      interests: apiAnalysisData?.personaInference?.evidence || [],
      urgency: apiAnalysisData?.entities?.urgency || 'low' as const
    };
  }

  private calculateEngagementLevel(
    userMessages: ChatMessage[],
    analysisData: { topics: string[] }
  ): 'low' | 'medium' | 'high' {
    // Try API-provided engagement first
    const apiEngagement = this.getApiEngagementLevel();
    if (apiEngagement) {
      return apiEngagement;
    }

    // Fallback to message-based calculation
    return this.calculateEngagementFromMessages(userMessages, analysisData.topics);
  }

  private getApiEngagementLevel(): 'low' | 'medium' | 'high' | null {
    // This would be populated if API provides engagement data
    // Currently returning null to use fallback calculation
    return null;
  }

  private calculateEngagementFromMessages(
    userMessages: ChatMessage[],
    topics: string[]
  ): 'low' | 'medium' | 'high' {
    const messageCount = userMessages.length;
    const topicCount = topics.length;
    
    if (messageCount >= 8 || (messageCount >= 5 && topicCount >= 3)) {
      return 'high';
    } else if (messageCount >= 4 || (messageCount >= 2 && topicCount >= 2)) {
      return 'medium';
    }
    
    return 'low';
  }
}