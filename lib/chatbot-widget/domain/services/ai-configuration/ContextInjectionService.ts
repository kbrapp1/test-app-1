import { ChatSession } from '../../entities/ChatSession';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ChatMessage } from '../../entities/ChatMessage';

/**
 * Context Injection Service - 2025 Advanced Priority-Based Selection
 * 
 * AI INSTRUCTIONS:
 * - Intelligently selects and prioritizes context modules based on conversation state
 * - Uses weighted scoring and token budget management
 * - Adapts context injection based on lead qualification and engagement
 * - Follows @golden-rule.mdc DDD patterns for domain services
 */

interface ModulePriority {
  corePersona: number;
  highPriorityContext: number;
  progressionModules: number;
  realTimeContext: number;
}

interface SelectedModules {
  corePersona: boolean;
  highPriorityContext: boolean;
  progressionModules: boolean;
  realTimeContext: boolean;
  estimatedTokens: number;
}

export class ContextInjectionService {
  private static readonly PRIORITY_WEIGHTS = {
    userProfile: 95,
    companyContext: 90,
    conversationPhase: 85,
    leadScoring: 80,
    knowledgeBase: 75,
    industrySpecific: 70,
    conversationHistory: 60,
    businessHours: 50,
    engagementOptimization: 45
  };

  /**
   * Intelligently select context modules based on priority, relevance, and token budget
   */
  static selectContextModules(
    session: ChatSession, 
    chatbotConfig: ChatbotConfig, 
    availableTokens: number,
    conversationHistory?: ChatMessage[],
    entityData?: any,
    leadScore?: number,
    qualificationStatus?: string
  ): ContextModule[] {
    const candidateModules = this.generateCandidateModules(
      session, 
      chatbotConfig, 
      conversationHistory, 
      entityData, 
      leadScore, 
      qualificationStatus
    );
    const prioritizedModules = this.prioritizeModules(candidateModules, session, conversationHistory, entityData, leadScore);
    
    return this.fitWithinTokenBudget(prioritizedModules, availableTokens);
  }

  /**
   * Generate all possible context modules for current session
   */
  private static generateCandidateModules(
    session: ChatSession, 
    chatbotConfig: ChatbotConfig,
    conversationHistory?: ChatMessage[],
    entityData?: any,
    leadScore?: number,
    qualificationStatus?: string
  ): ContextModule[] {
    const modules: ContextModule[] = [];

    // User profile module (always high priority)
    if (entityData?.role || entityData?.company) {
      modules.push({
        type: 'userProfile',
        priority: this.PRIORITY_WEIGHTS.userProfile,
        estimatedTokens: this.estimateUserProfileTokens(entityData),
        relevanceScore: 100,
        content: () => this.buildUserProfileModule(entityData)
      });
    }

    // Company context module
    if (entityData?.company) {
      modules.push({
        type: 'companyContext',
        priority: this.PRIORITY_WEIGHTS.companyContext,
        estimatedTokens: this.estimateCompanyContextTokens(entityData),
        relevanceScore: this.calculateCompanyRelevance(entityData),
        content: () => this.buildCompanyContextModule(entityData)
      });
    }

    // Conversation phase module
    const phase = this.determineConversationPhase(leadScore);
    modules.push({
      type: 'conversationPhase',
      priority: this.PRIORITY_WEIGHTS.conversationPhase,
      estimatedTokens: 80,
      relevanceScore: this.calculatePhaseRelevance(phase, leadScore, entityData),
      content: () => this.buildPhaseModule(phase)
    });

    // Lead scoring context
    if (leadScore && leadScore > 0) {
      modules.push({
        type: 'leadScoring',
        priority: this.PRIORITY_WEIGHTS.leadScoring,
        estimatedTokens: 60,
        relevanceScore: Math.min(leadScore, 100),
        content: () => this.buildLeadScoringModule(leadScore, qualificationStatus || 'unknown')
      });
    }

    // Knowledge base injection (conditional)
    if (this.shouldInjectKnowledgeBase(session, conversationHistory)) {
      modules.push({
        type: 'knowledgeBase',
        priority: this.PRIORITY_WEIGHTS.knowledgeBase,
        estimatedTokens: this.estimateKnowledgeBaseTokens(chatbotConfig.knowledgeBase),
        relevanceScore: this.calculateKnowledgeBaseRelevance(session, conversationHistory),
        content: () => this.buildKnowledgeBaseModule(chatbotConfig.knowledgeBase)
      });
    }

    // Industry-specific guidance
    if (entityData?.industry) {
      modules.push({
        type: 'industrySpecific',
        priority: this.PRIORITY_WEIGHTS.industrySpecific,
        estimatedTokens: 50,
        relevanceScore: this.calculateIndustryRelevance(entityData.industry),
        content: () => this.buildIndustryModule(entityData.industry)
      });
    }

    // Conversation history context
    const messageCount = conversationHistory?.length || 0;
    if (messageCount > 3) {
      modules.push({
        type: 'conversationHistory',
        priority: this.PRIORITY_WEIGHTS.conversationHistory,
        estimatedTokens: this.estimateHistoryTokens(session.contextData),
        relevanceScore: Math.min(messageCount * 10, 100),
        content: () => this.buildHistoryModule(session.contextData)
      });
    }

    // Business hours context
    modules.push({
      type: 'businessHours',
      priority: this.PRIORITY_WEIGHTS.businessHours,
      estimatedTokens: 30,
      relevanceScore: this.calculateBusinessHoursRelevance(chatbotConfig.operatingHours),
      content: () => this.buildBusinessHoursModule(chatbotConfig.operatingHours)
    });

    // Engagement optimization
    if (session.contextData.engagementScore) {
      modules.push({
        type: 'engagementOptimization',
        priority: this.PRIORITY_WEIGHTS.engagementOptimization,
        estimatedTokens: 40,
        relevanceScore: this.calculateEngagementRelevance(session.contextData.engagementScore),
        content: () => this.buildEngagementModule(session.contextData.engagementScore)
      });
    }

    return modules;
  }

  /**
   * Prioritize modules based on relevance and conversation context
   */
  private static prioritizeModules(
    modules: ContextModule[], 
    session: ChatSession,
    conversationHistory?: ChatMessage[],
    entityData?: any,
    leadScore?: number
  ): ContextModule[] {
    return modules
      .map(module => ({
        ...module,
        // Adjust priority based on relevance score and session context
        adjustedPriority: module.priority * (module.relevanceScore / 100) * this.getSessionMultiplier(session, module.type, conversationHistory, entityData, leadScore)
      }))
      .sort((a, b) => b.adjustedPriority - a.adjustedPriority);
  }

  /**
   * Select modules that fit within token budget
   */
  private static fitWithinTokenBudget(modules: ContextModule[], availableTokens: number): ContextModule[] {
    const selectedModules: ContextModule[] = [];
    let usedTokens = 0;

    for (const module of modules) {
      if (usedTokens + module.estimatedTokens <= availableTokens) {
        selectedModules.push(module);
        usedTokens += module.estimatedTokens;
      }
    }

    return selectedModules;
  }

  /**
   * Calculate session-specific multipliers for different module types
   */
  private static getSessionMultiplier(
    session: ChatSession, 
    moduleType: string,
    conversationHistory?: ChatMessage[],
    entityData?: any,
    leadScore?: number
  ): number {
    switch (moduleType) {
      case 'leadScoring':
        // Boost lead scoring context for high-value prospects
        return leadScore && leadScore >= 70 ? 1.5 : 1.0;
        
      case 'companyContext':
        // Boost company context for enterprise prospects
        return entityData?.teamSize === 'enterprise' ? 1.3 : 1.0;
        
      case 'knowledgeBase':
        // Boost knowledge base for service-related conversations
        const recentMessages = conversationHistory?.slice(-2) || [];
        const needsKB = recentMessages.some((msg: ChatMessage) => 
          msg.content.toLowerCase().includes('service') ||
          msg.content.toLowerCase().includes('price') ||
          msg.content.toLowerCase().includes('product')
        );
        return needsKB ? 1.4 : 1.0;
        
      case 'conversationHistory':
        // Boost history context for longer conversations
        const messageCount = conversationHistory?.length || 0;
        return messageCount > 10 ? 1.2 : 1.0;
        
      default:
        return 1.0;
    }
  }

  /**
   * Determine conversation phase
   */
  private static determineConversationPhase(leadScore?: number): 'discovery' | 'qualification' | 'demonstration' | 'closing' {
    if (!leadScore) return 'discovery';
    if (leadScore >= 80) return 'closing';
    if (leadScore >= 60) return 'demonstration';
    if (leadScore >= 30) return 'qualification';
    return 'discovery';
  }

  /**
   * Calculate relevance scores for different contexts
   */
  private static calculateCompanyRelevance(entityData?: any): number {
    let relevance = 50; // Base relevance
    
    if (entityData?.company) relevance += 30;
    if (entityData?.industry) relevance += 20;
    
    return Math.min(relevance, 100);
  }

  private static calculatePhaseRelevance(phase: string, leadScore?: number, entityData?: any): number {
    // Always highly relevant, but boost for certain conditions
    let relevance = 90;
    
    if (phase === 'closing' && leadScore && leadScore >= 80) relevance = 100;
    if (phase === 'demonstration' && entityData?.budget) relevance = 95;
    
    return relevance;
  }

  private static calculateKnowledgeBaseRelevance(session: ChatSession, conversationHistory?: ChatMessage[]): number {
    let relevance = 60; // Base relevance
    
    // Check topics for knowledge base needs
    const topics = session.contextData.topics;
    const needsKB = topics.some(topic => 
      topic.toLowerCase().includes('service') ||
      topic.toLowerCase().includes('price') ||
      topic.toLowerCase().includes('product')
    );
    
    if (needsKB) relevance += 30;
    
    // Boost for early conversations
    const messageCount = conversationHistory?.length || 0;
    if (messageCount <= 2) relevance += 20; // Early in conversation
    
    return Math.min(relevance, 100);
  }

  private static calculateIndustryRelevance(industry: string): number {
    // Industry context is always valuable when available
    const industryMap: Record<string, number> = {
      'technology': 95,
      'healthcare': 90,
      'financial': 90,
      'manufacturing': 85,
      'retail': 80
    };
    
    return industryMap[industry.toLowerCase()] || 75;
  }

  private static calculateBusinessHoursRelevance(operatingHours: any): number {
    if (!operatingHours?.businessHours) return 30;
    
    const now = new Date();
    const isBusinessHours = this.isWithinBusinessHours(now, operatingHours);
    
    return isBusinessHours ? 70 : 50;
  }

  private static calculateEngagementRelevance(engagementScore: number): number {
    // Higher engagement means more detailed responses are valuable
    return Math.min(engagementScore * 10, 100);
  }

  /**
   * Token estimation methods
   */
  private static estimateUserProfileTokens(entityData?: any): number {
    let tokens = 30; // Base tokens
    if (entityData?.role) tokens += 25;
    if (entityData?.company) tokens += 20;
    if (entityData?.teamSize) tokens += 15;
    if (entityData?.industry) tokens += 20;
    return tokens;
  }

  private static estimateCompanyContextTokens(entityData?: any): number {
    let tokens = 40; // Base tokens
    if (entityData?.industry) tokens += 40; // Industry-specific guidance
    return tokens;
  }

  private static estimateKnowledgeBaseTokens(knowledgeBase: any): number {
    let tokens = 100; // Base knowledge
    if (knowledgeBase?.faqs?.length > 0) tokens += knowledgeBase.faqs.length * 15;
    return Math.min(tokens, 200); // Cap at 200 tokens
  }

  private static estimateHistoryTokens(contextData: any): number {
    const topicCount = contextData?.topics?.length || 0;
    const interestCount = contextData?.interests?.length || 0;
    return Math.min((topicCount + interestCount) * 5 + 20, 80);
  }

  /**
   * Module building methods (stub implementations - delegate to DynamicPromptService)
   */
  private static buildUserProfileModule(entityData?: any): string {
    return `User Profile: ${entityData?.role || 'Unknown'} at ${entityData?.company || 'Unknown Company'}`;
  }

  private static buildCompanyContextModule(entityData?: any): string {
    return `Company Context: ${entityData?.company || 'Unknown'} in ${entityData?.industry || 'Unknown'} industry`;
  }

  private static buildPhaseModule(phase: string): string {
    return `Conversation Phase: ${phase}`;
  }

  private static buildLeadScoringModule(leadScore: number, qualificationStatus: string): string {
    return `Lead Score: ${leadScore}/100 (${qualificationStatus})`;
  }

  private static buildKnowledgeBaseModule(knowledgeBase: any): string {
    return `Knowledge Base: ${knowledgeBase?.companyInfo ? 'Available' : 'Limited'}`;
  }

  private static buildIndustryModule(industry: string): string {
    return `Industry Focus: ${industry}`;
  }

  private static buildHistoryModule(contextData: any): string {
    const topics = contextData?.topics?.slice(-3).join(', ') || 'None';
    return `Recent Topics: ${topics}`;
  }

  private static buildBusinessHoursModule(operatingHours: any): string {
    const now = new Date();
    const isBusinessHours = this.isWithinBusinessHours(now, operatingHours);
    return `Business Hours: ${isBusinessHours ? 'Open' : 'Closed'}`;
  }

  private static buildEngagementModule(engagementScore: number): string {
    const level = engagementScore > 7 ? 'High' : engagementScore > 4 ? 'Medium' : 'Low';
    return `Engagement Level: ${level} (${engagementScore}/10)`;
  }

  /**
   * Helper methods
   */
  private static shouldInjectKnowledgeBase(session: ChatSession, conversationHistory?: ChatMessage[]): boolean {
    // Check topics for knowledge base needs
    const topics = session.contextData.topics;
    const needsKB = topics.some(topic => 
      topic.toLowerCase().includes('service') ||
      topic.toLowerCase().includes('price') ||
      topic.toLowerCase().includes('product') ||
      topic.toLowerCase().includes('company')
    );
    
    // Also check if it's early in conversation
    const messageCount = conversationHistory?.length || 0;
    return needsKB || messageCount <= 2;
  }

  private static isWithinBusinessHours(date: Date, operatingHours: any): boolean {
    if (!operatingHours?.businessHours) return false;
    
    const dayOfWeek = date.getDay();
    const currentHour = date.getHours();
    
    const todayHours = operatingHours.businessHours?.find((h: any) => 
      h.dayOfWeek === dayOfWeek && h.isActive
    );
    
    if (!todayHours) return false;
    
    const startHour = parseInt(todayHours.startTime.split(':')[0]);
    const endHour = parseInt(todayHours.endTime.split(':')[0]);
    
    return currentHour >= startHour && currentHour < endHour;
  }

  /**
   * Calculate priority scores with enhanced token efficiency
   */
  private calculatePriorityScores(
    conversationHistory: ChatMessage[],
    entityData: any,
    leadScore: number
  ): ModulePriority {
    // For simple greetings (1-2 messages), use minimal context
    if (conversationHistory.length <= 2) {
      return {
        corePersona: 1.0,        // Always include
        highPriorityContext: 0.2, // Minimal context
        progressionModules: 0.1,  // Skip progression
        realTimeContext: 0.5     // Basic real-time only
      };
    }
    
    // For longer conversations, use full scoring
    const hasComplexEntities = Object.keys(entityData).length > 3;
    const isHighValueLead = leadScore > 60;
    const conversationDepth = Math.min(conversationHistory.length / 10, 1);
    
    return {
      corePersona: 1.0,
      highPriorityContext: hasComplexEntities ? 0.9 : 0.4,
      progressionModules: isHighValueLead ? 0.8 : 0.3,
      realTimeContext: 0.6 + (conversationDepth * 0.3)
    };
  }

  /**
   * Select modules based on token budget with early conversation optimization
   */
  private selectModulesForBudget(
    priorities: ModulePriority,
    tokenBudget: number,
    conversationHistory: ChatMessage[]
  ): SelectedModules {
    // For greetings and early conversation, use minimal modules
    if (conversationHistory.length <= 2) {
      return {
        corePersona: true,
        highPriorityContext: false, // Skip for greetings
        progressionModules: false,  // Skip for greetings
        realTimeContext: true,
        estimatedTokens: 900 // Much lower estimate
      };
    }
    
    // For longer conversations, use original logic
    const baseTokens = 800; // Core persona
    let currentTokens = baseTokens;
    
    const selected: SelectedModules = {
      corePersona: true,
      highPriorityContext: false,
      progressionModules: false,
      realTimeContext: false,
      estimatedTokens: baseTokens
    };
    
    // Add modules based on priority and available budget
    if (currentTokens + 400 <= tokenBudget && priorities.highPriorityContext > 0.6) {
      selected.highPriorityContext = true;
      currentTokens += 400;
    }
    
    if (currentTokens + 400 <= tokenBudget && priorities.progressionModules > 0.6) {
      selected.progressionModules = true;
      currentTokens += 400;
    }
    
    if (currentTokens + 300 <= tokenBudget && priorities.realTimeContext > 0.5) {
      selected.realTimeContext = true;
      currentTokens += 300;
    }
    
    selected.estimatedTokens = currentTokens;
    return selected;
  }
}

/**
 * Context Module interface for structured injection
 */
export interface ContextModule {
  type: string;
  priority: number;
  adjustedPriority?: number;
  estimatedTokens: number;
  relevanceScore: number;
  content: () => string;
} 