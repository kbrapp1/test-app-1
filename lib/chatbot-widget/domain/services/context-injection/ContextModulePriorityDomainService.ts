/**
 * Context Module Priority Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for context module priority calculations
 * - Calculate relevance scores based on conversation context
 * - Apply session-specific multipliers for priority adjustment
 * - Keep business logic isolated from external concerns
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: priority and relevance calculations
 */

import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import {
  ContextModule,
  ContextModuleType,
  EntityData,
  ConversationPhase,
  ContextRelevanceFactors,
  OperatingHours,
  CONTEXT_PRIORITY_WEIGHTS,
  INDUSTRY_RELEVANCE_MAP
} from '../interfaces/ContextInjectionTypes';

export class ContextModulePriorityDomainService {
  
  /**
   * Calculate relevance factors for all context types
   * 
   * AI INSTRUCTIONS:
   * - Pure calculation based on conversation data
   * - No external dependencies or side effects
   * - Return structured relevance scores
   */
  static calculateRelevanceFactors(
    session: ChatSession,
    conversationHistory: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number,
    operatingHours?: OperatingHours
  ): ContextRelevanceFactors {
    return {
      userProfileRelevance: this.calculateUserProfileRelevance(entityData),
      companyContextRelevance: this.calculateCompanyContextRelevance(entityData),
      phaseRelevance: this.calculatePhaseRelevance(leadScore, entityData),
      knowledgeBaseRelevance: this.calculateKnowledgeBaseRelevance(session, conversationHistory),
      industryRelevance: this.calculateIndustryRelevance(entityData?.industry),
      historyRelevance: this.calculateHistoryRelevance(conversationHistory),
      businessHoursRelevance: this.calculateBusinessHoursRelevance(operatingHours),
      engagementRelevance: this.calculateEngagementRelevance(session.contextData.engagementScore)
    };
  }

  /**
   * Apply session-specific multipliers to module priorities
   * 
   * AI INSTRUCTIONS:
   * - Adjust priorities based on conversation context
   * - Use business rules for priority enhancement
   * - Return adjusted priority values
   */
  static applySessionMultipliers(
    modules: ContextModule[],
    session: ChatSession,
    conversationHistory: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number
  ): ContextModule[] {
    return modules.map(module => ({
      ...module,
      adjustedPriority: module.priority * 
        (module.relevanceScore / 100) * 
        this.getSessionMultiplier(session, module.type, conversationHistory, entityData, leadScore)
    }));
  }

  /**
   * Determine conversation phase based on lead score and context
   * 
   * AI INSTRUCTIONS:
   * - Business logic for conversation phase detection
   * - Use lead scoring and context indicators
   * - Return phase with confidence level
   */
  static determineConversationPhase(
    leadScore?: number,
    entityData?: EntityData,
    conversationHistory?: ChatMessage[]
  ): ConversationPhase {
    if (!leadScore) {
      return {
        phase: 'discovery',
        confidence: 0.8,
        indicators: ['no_lead_score', 'initial_interaction']
      };
    }

    const indicators: string[] = [];
    let phase: ConversationPhase['phase'] = 'discovery';
    let confidence = 0.7;

    if (leadScore >= 80) {
      phase = 'closing';
      confidence = 0.9;
      indicators.push('high_lead_score', 'qualified_prospect');
    } else if (leadScore >= 60) {
      phase = 'demonstration';
      confidence = 0.85;
      indicators.push('medium_lead_score', 'interested_prospect');
      
      if (entityData?.budget) {
        confidence = 0.9;
        indicators.push('budget_information');
      }
    } else if (leadScore >= 30) {
      phase = 'qualification';
      confidence = 0.8;
      indicators.push('basic_qualification');
    }

    // Enhance confidence based on conversation history
    if (conversationHistory && conversationHistory.length > 5) {
      confidence = Math.min(confidence + 0.1, 1.0);
      indicators.push('extended_conversation');
    }

    return { phase, confidence, indicators };
  }

  /**
   * Calculate session multiplier for specific module type
   * 
   * AI INSTRUCTIONS:
   * - Business rules for context priority adjustment
   * - Consider conversation state and lead quality
   * - Return multiplier value for priority calculation
   */
  private static getSessionMultiplier(
    session: ChatSession,
    moduleType: ContextModuleType,
    conversationHistory: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number
  ): number {
    switch (moduleType) {
      case 'leadScoring':
        return leadScore && leadScore >= 70 ? 1.5 : 1.0;
        
      case 'companyContext':
        return entityData?.teamSize === 'enterprise' ? 1.3 : 1.0;
        
      case 'knowledgeBase':
        return this.needsKnowledgeBase(conversationHistory) ? 1.4 : 1.0;
        
      case 'conversationHistory':
        return conversationHistory.length > 10 ? 1.2 : 1.0;
        
      case 'userProfile':
        return entityData && Object.keys(entityData).length > 3 ? 1.2 : 1.0;
        
      case 'industrySpecific':
        return entityData?.industry ? 1.1 : 0.8;
        
      default:
        return 1.0;
    }
  }

  /**
   * Individual relevance calculation methods
   * 
   * AI INSTRUCTIONS:
   * - Pure calculation methods
   * - Business rules for relevance scoring
   * - Return normalized scores (0-100)
   */
  private static calculateUserProfileRelevance(entityData?: EntityData): number {
    if (!entityData) return 20;
    
    let relevance = 50;
    if (entityData.role) relevance += 25;
    if (entityData.company) relevance += 20;
    if (entityData.industry) relevance += 15;
    
    return Math.min(relevance, 100);
  }

  private static calculateCompanyContextRelevance(entityData?: EntityData): number {
    if (!entityData?.company) return 30;
    
    let relevance = 60;
    if (entityData.industry) relevance += 25;
    if (entityData.teamSize) relevance += 15;
    
    return Math.min(relevance, 100);
  }

  private static calculatePhaseRelevance(leadScore?: number, entityData?: EntityData): number {
    let relevance = 85; // Always highly relevant
    
    if (leadScore && leadScore >= 80) relevance = 100;
    if (entityData?.budget) relevance = Math.max(relevance, 95);
    
    return relevance;
  }

  private static calculateKnowledgeBaseRelevance(
    session: ChatSession,
    conversationHistory: ChatMessage[]
  ): number {
    let relevance = 60;
    
    // Check if conversation topics suggest knowledge base need
    const needsKB = this.needsKnowledgeBase(conversationHistory);
    if (needsKB) relevance += 30;
    
    // Boost for early conversations
    if (conversationHistory.length <= 2) relevance += 20;
    
    return Math.min(relevance, 100);
  }

  private static calculateIndustryRelevance(industry?: string): number {
    if (!industry) return 40;
    
    const relevance = INDUSTRY_RELEVANCE_MAP[industry.toLowerCase() as keyof typeof INDUSTRY_RELEVANCE_MAP];
    return relevance || 75;
  }

  private static calculateHistoryRelevance(conversationHistory: ChatMessage[]): number {
    const messageCount = conversationHistory.length;
    if (messageCount <= 3) return 30;
    
    return Math.min(messageCount * 8, 100);
  }

  private static calculateBusinessHoursRelevance(operatingHours?: OperatingHours): number {
    if (!operatingHours?.businessHours) return 40;
    
    const now = new Date();
    const isBusinessHours = this.isWithinBusinessHours(now, operatingHours);
    
    return isBusinessHours ? 70 : 50;
  }

  private static calculateEngagementRelevance(engagementScore?: number): number {
    if (!engagementScore) return 40;
    
    return Math.min(engagementScore * 10, 100);
  }

  /**
   * Helper methods for business logic
   * 
   * AI INSTRUCTIONS:
   * - Support methods for relevance calculations
   * - Encapsulate business rules
   * - Keep methods focused and testable
   */
  private static needsKnowledgeBase(conversationHistory: ChatMessage[]): boolean {
    const recentMessages = conversationHistory.slice(-3);
    return recentMessages.some(msg => {
      const content = msg.content.toLowerCase();
      return content.includes('service') ||
             content.includes('price') ||
             content.includes('product') ||
             content.includes('company') ||
             content.includes('help');
    });
  }

  private static isWithinBusinessHours(date: Date, operatingHours: OperatingHours): boolean {
    if (!operatingHours.businessHours) return false;
    
    const dayOfWeek = date.getDay();
    const currentHour = date.getHours();
    
    const todayHours = operatingHours.businessHours.find(h => 
      h.dayOfWeek === dayOfWeek && h.isActive
    );
    
    if (!todayHours) return false;
    
    const startHour = parseInt(todayHours.startTime.split(':')[0]);
    const endHour = parseInt(todayHours.endTime.split(':')[0]);
    
    return currentHour >= startHour && currentHour < endHour;
  }
} 