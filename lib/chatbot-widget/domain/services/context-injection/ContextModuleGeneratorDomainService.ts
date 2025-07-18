/**
 * Context Module Generator Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for generating context modules
 * - Build module content based on conversation data
 * - Estimate token usage for each module type
 * - Keep business logic isolated from external concerns
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: context module generation
 */

import { ChatSession } from '../../entities/ChatSession';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ChatMessage } from '../../entities/ChatMessage';
import {
  ContextModule,
  ContextModuleType,
  EntityData,
  ContextGenerationOptions,
  OperatingHours,
  CONTEXT_PRIORITY_WEIGHTS,
  CONTEXT_TOKEN_ESTIMATES
} from '../interfaces/ContextInjectionTypes';
import { KnowledgeBase } from '../../value-objects/ai-configuration/KnowledgeBase';
import { SessionContext } from '../../value-objects/session-management/ChatSessionTypes';

export class ContextModuleGeneratorDomainService {
  
  /** Generate all candidate context modules for current session */
  static generateCandidateModules(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    conversationHistory: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number,
    qualificationStatus?: string,
    options?: ContextGenerationOptions
  ): ContextModule[] {
    const modules: ContextModule[] = [];
    const opts = { ...this.getDefaultOptions(), ...options };

    // User Profile Module
    if (opts.includeUserProfile && entityData?.role) {
      modules.push(this.createModule('userProfile', entityData, () => 
        this.buildContent('User Profile', [
          entityData.role && `Role: ${entityData.role}`,
          entityData.company && `Company: ${entityData.company}`,
          entityData.teamSize && `Team Size: ${entityData.teamSize}`,
          entityData.industry && `Industry: ${entityData.industry}`
        ])
      ));
    }

    // Company Context Module
    if (opts.includeCompanyContext && entityData?.company) {
      modules.push(this.createModule('companyContext', entityData, () => 
        this.buildContent('Company Context', [
          `Company: ${entityData.company}`,
          entityData.industry && `Industry: ${entityData.industry}`,
          entityData.teamSize && `Size: ${entityData.teamSize}`
        ])
      ));
    }

    // Conversation Phase Module
    if (opts.includeConversationPhase) {
      const phase = this.determinePhase(leadScore);
      modules.push({
        type: 'conversationPhase',
        priority: CONTEXT_PRIORITY_WEIGHTS.conversationPhase,
        estimatedTokens: CONTEXT_TOKEN_ESTIMATES.conversationPhase.base,
        relevanceScore: this.calculatePhaseRelevance(leadScore, entityData),
        content: () => `Conversation Phase: ${phase}${leadScore ? ` (Score: ${leadScore})` : ''}`
      });
    }

    // Lead Scoring Module
    if (opts.includeLeadScoring && leadScore && leadScore > 0) {
      modules.push({
        type: 'leadScoring',
        priority: CONTEXT_PRIORITY_WEIGHTS.leadScoring,
        estimatedTokens: CONTEXT_TOKEN_ESTIMATES.leadScoring.base,
        relevanceScore: Math.min(leadScore, 100),
        content: () => `Lead Score: ${leadScore}/100 (Status: ${qualificationStatus || 'unknown'})`
      });
    }

    // Knowledge Base Module
    if (opts.includeKnowledgeBase && this.shouldIncludeKnowledgeBase(session, conversationHistory)) {
      modules.push({
        type: 'knowledgeBase',
        priority: CONTEXT_PRIORITY_WEIGHTS.knowledgeBase,
        estimatedTokens: this.estimateKnowledgeBaseTokens(chatbotConfig.knowledgeBase),
        relevanceScore: 75,
        content: () => `Knowledge Base: ${chatbotConfig.knowledgeBase?.companyInfo ? 'Available' : 'Limited'}`
      });
    }

    // Industry Specific Module
    if (opts.includeIndustrySpecific && entityData?.industry) {
      modules.push({
        type: 'industrySpecific',
        priority: CONTEXT_PRIORITY_WEIGHTS.industrySpecific,
        estimatedTokens: CONTEXT_TOKEN_ESTIMATES.industrySpecific.base,
        relevanceScore: this.calculateIndustryRelevance(entityData.industry),
        content: () => `Industry Focus: ${entityData.industry}`
      });
    }

    // Conversation History Module
    if (opts.includeConversationHistory && conversationHistory.length > 3) {
      modules.push({
        type: 'conversationHistory',
        priority: CONTEXT_PRIORITY_WEIGHTS.conversationHistory,
        estimatedTokens: this.estimateHistoryTokens(session.contextData),
        relevanceScore: 60,
        content: () => `Recent Topics: ${session.contextData?.topics?.slice(-3).join(', ') || 'None'}`
      });
    }

    // Business Hours Module
    if (opts.includeBusinessHours) {
      modules.push({
        type: 'businessHours',
        priority: CONTEXT_PRIORITY_WEIGHTS.businessHours,
        estimatedTokens: CONTEXT_TOKEN_ESTIMATES.businessHours.base,
        relevanceScore: 50,
        content: () => `Business Hours: ${this.isBusinessHours(chatbotConfig.operatingHours) ? 'Open' : 'Closed'}`
      });
    }

    // Engagement Optimization Module
    if (opts.includeEngagementOptimization && session.contextData.engagementScore) {
      const score = session.contextData.engagementScore;
      const level = score > 7 ? 'High' : score > 4 ? 'Medium' : 'Low';
      modules.push({
        type: 'engagementOptimization',
        priority: CONTEXT_PRIORITY_WEIGHTS.engagementOptimization,
        estimatedTokens: CONTEXT_TOKEN_ESTIMATES.engagementOptimization.base,
        relevanceScore: Math.min(score * 10, 100),
        content: () => `Engagement Level: ${level} (${score}/10)`
      });
    }

    return modules;
  }

  /**
   * Helper methods for module creation and business logic
   * 
   * AI INSTRUCTIONS:
   * - Consolidated helper methods for efficiency
   * - Maintain business rule integrity
   * - Keep methods focused and reusable
   */
  private static createModule(type: ContextModuleType, entityData: EntityData, contentFn: () => string): ContextModule {
    return {
      type,
      priority: CONTEXT_PRIORITY_WEIGHTS[type],
      estimatedTokens: this.estimateTokens(type, entityData),
      relevanceScore: this.calculateRelevance(type, entityData),
      content: contentFn
    };
  }

  private static buildContent(prefix: string, parts: (string | false | undefined)[]): string {
    return `${prefix}: ${parts.filter(Boolean).join(', ')}`;
  }

  private static estimateTokens(type: ContextModuleType, entityData: EntityData): number {
    const estimates = CONTEXT_TOKEN_ESTIMATES[type as keyof typeof CONTEXT_TOKEN_ESTIMATES];
    if (!estimates) return 50;
    
    let tokens = estimates.base;
    if (type === 'userProfile') {
      const userEstimates = CONTEXT_TOKEN_ESTIMATES.userProfile;
      if (entityData.role) tokens += userEstimates.withRole;
      if (entityData.company) tokens += userEstimates.withCompany;
      if (entityData.teamSize) tokens += userEstimates.withTeamSize;
      if (entityData.industry) tokens += userEstimates.withIndustry;
    } else if (type === 'companyContext' && entityData.industry) {
      const companyEstimates = CONTEXT_TOKEN_ESTIMATES.companyContext;
      tokens += companyEstimates.withIndustry;
    }
    return tokens;
  }

  private static calculateRelevance(type: ContextModuleType, entityData: EntityData): number {
    switch (type) {
      case 'userProfile':
        let relevance = 50;
        if (entityData.role) relevance += 25;
        if (entityData.company) relevance += 20;
        return Math.min(relevance, 100);
      case 'companyContext':
        return entityData.industry ? 85 : 60;
      default:
        return 75;
    }
  }

  private static shouldIncludeKnowledgeBase(session: ChatSession, conversationHistory: ChatMessage[]): boolean {
    const needsKB = session.contextData.topics.some(topic => 
      ['service', 'price', 'product'].some(keyword => topic.toLowerCase().includes(keyword))
    );
    return needsKB || conversationHistory.length <= 2;
  }

  private static getDefaultOptions(): ContextGenerationOptions {
    return {
      includeUserProfile: true,
      includeCompanyContext: true,
      includeConversationPhase: true,
      includeLeadScoring: true,
      includeKnowledgeBase: true,
      includeIndustrySpecific: true,
      includeConversationHistory: true,
      includeBusinessHours: true,
      includeEngagementOptimization: true
    };
  }

  private static estimateKnowledgeBaseTokens(knowledgeBase: KnowledgeBase): number {
    const estimates = CONTEXT_TOKEN_ESTIMATES.knowledgeBase;
    let tokens = estimates.base;
    if (knowledgeBase?.faqs?.length > 0) {
      tokens += knowledgeBase.faqs.length * estimates.perFaq;
    }
    return Math.min(tokens, estimates.max);
  }

  private static estimateHistoryTokens(contextData: SessionContext): number {
    const estimates = CONTEXT_TOKEN_ESTIMATES.conversationHistory;
    const topicCount = contextData?.topics?.length || 0;
    const interestCount = contextData?.interests?.length || 0;
    return Math.min(estimates.base + (topicCount + interestCount) * estimates.perTopic, estimates.max);
  }

  private static calculatePhaseRelevance(leadScore?: number, entityData?: EntityData): number {
    let relevance = 85;
    if (leadScore && leadScore >= 80) relevance = 100;
    if (entityData?.budget) relevance = Math.max(relevance, 95);
    return relevance;
  }

  private static calculateIndustryRelevance(industry: string): number {
    const industryMap: Record<string, number> = {
      'technology': 95, 'healthcare': 90, 'financial': 90,
      'manufacturing': 85, 'retail': 80
    };
    return industryMap[industry.toLowerCase()] || 75;
  }

  private static determinePhase(leadScore?: number): string {
    if (!leadScore) return 'discovery';
    if (leadScore >= 80) return 'closing';
    if (leadScore >= 60) return 'demonstration';
    if (leadScore >= 30) return 'qualification';
    return 'discovery';
  }

  private static isBusinessHours(operatingHours?: OperatingHours): boolean {
    if (!operatingHours?.businessHours) return false;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    
    const todayHours = operatingHours.businessHours.find(h => 
      h.dayOfWeek === dayOfWeek && h.isActive
    );
    
    if (!todayHours) return false;
    
    const startHour = parseInt(todayHours.startTime.split(':')[0]);
    const endHour = parseInt(todayHours.endTime.split(':')[0]);
    
    return currentHour >= startHour && currentHour < endHour;
  }
} 