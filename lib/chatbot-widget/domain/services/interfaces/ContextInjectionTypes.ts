/**
 * Context Injection Types
 * 
 * AI INSTRUCTIONS:
 * - Shared types for context injection domain
 * - Keep types focused and well-documented
 * - Support intelligent context selection
 * - Follow @golden-rule patterns exactly
 */

export interface ContextModule {
  type: ContextModuleType;
  priority: number;
  adjustedPriority?: number;
  estimatedTokens: number;
  relevanceScore: number;
  content: () => string;
}

export type ContextModuleType = 
  | 'userProfile'
  | 'companyContext'
  | 'conversationPhase'
  | 'leadScoring'
  | 'knowledgeBase'
  | 'industrySpecific'
  | 'conversationHistory'
  | 'businessHours'
  | 'engagementOptimization';

export interface ModulePriority {
  corePersona: number;
  highPriorityContext: number;
  progressionModules: number;
  realTimeContext: number;
}

export interface SelectedModules {
  corePersona: boolean;
  highPriorityContext: boolean;
  progressionModules: boolean;
  realTimeContext: boolean;
  estimatedTokens: number;
}

export interface ContextSelectionCriteria {
  availableTokens: number;
  leadScore?: number;
  qualificationStatus?: string;
  messageCount: number;
  entityData?: EntityData;
}

export interface EntityData {
  role?: string;
  company?: string;
  teamSize?: string;
  industry?: string;
  budget?: number;
  [key: string]: any;
}

export interface ConversationPhase {
  phase: 'discovery' | 'qualification' | 'demonstration' | 'closing';
  confidence: number;
  indicators: string[];
}

export interface TokenBudgetAllocation {
  corePersona: number;
  highPriorityContext: number;
  progressionModules: number;
  realTimeContext: number;
  totalUsed: number;
  totalAvailable: number;
}

export interface ContextRelevanceFactors {
  userProfileRelevance: number;
  companyContextRelevance: number;
  phaseRelevance: number;
  knowledgeBaseRelevance: number;
  industryRelevance: number;
  historyRelevance: number;
  businessHoursRelevance: number;
  engagementRelevance: number;
}

export interface OperatingHours {
  businessHours?: Array<{
    dayOfWeek: number;
    isActive: boolean;
    startTime: string;
    endTime: string;
  }>;
}

export interface ContextGenerationOptions {
  includeUserProfile: boolean;
  includeCompanyContext: boolean;
  includeConversationPhase: boolean;
  includeLeadScoring: boolean;
  includeKnowledgeBase: boolean;
  includeIndustrySpecific: boolean;
  includeConversationHistory: boolean;
  includeBusinessHours: boolean;
  includeEngagementOptimization: boolean;
}

export const CONTEXT_PRIORITY_WEIGHTS = {
  userProfile: 95,
  companyContext: 90,
  conversationPhase: 85,
  leadScoring: 80,
  knowledgeBase: 75,
  industrySpecific: 70,
  conversationHistory: 60,
  businessHours: 50,
  engagementOptimization: 45
} as const;

export const CONTEXT_TOKEN_ESTIMATES = {
  userProfile: { base: 30, withRole: 25, withCompany: 20, withTeamSize: 15, withIndustry: 20 },
  companyContext: { base: 40, withIndustry: 40 },
  conversationPhase: { base: 80 },
  leadScoring: { base: 60 },
  knowledgeBase: { base: 100, perFaq: 15, max: 200 },
  industrySpecific: { base: 50 },
  conversationHistory: { base: 20, perTopic: 5, max: 80 },
  businessHours: { base: 30 },
  engagementOptimization: { base: 40 }
} as const;

export const INDUSTRY_RELEVANCE_MAP = {
  'technology': 95,
  'healthcare': 90,
  'financial': 90,
  'manufacturing': 85,
  'retail': 80
} as const; 