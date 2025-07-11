/**
 * Chat Session Types and Interfaces
 * Following DDD principles: Separate type definitions for clarity
 */

export interface ChatSessionProps {
  id: string;
  chatbotConfigId: string;
  visitorId: string;
  sessionToken: string;
  contextData: SessionContext;
  leadQualificationState: LeadQualificationState;
  status: SessionStatus;
  startedAt: Date;
  lastActivityAt: Date;
  endedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  currentUrl?: string;
}

export interface SessionContext {
  previousVisits: number;
  pageViews: PageView[];
  conversationSummary: {
    fullSummary: string; // comprehensive summary of entire conversation
    phaseSummaries?: Array<{
      phase: string;
      summary: string;
      keyOutcomes: string[];
      entitiesExtracted: string[];
      timeframe: { start: Date; end: Date };
    }>;
    criticalMoments?: Array<{
      messageId: string;
      importance: 'high' | 'critical';
      context: string;
      preserveInContext: boolean;
    }>;
  };
  topics: string[];
  interests: string[];
  engagementScore: number;
  journeyState?: {
    stage: string;
    confidence: number;
    metadata: any;
  };
  accumulatedEntities?: {
    // ARRAY ENTITIES (accumulative across conversation)
    decisionMakers: string[];
    painPoints: string[];
    integrationNeeds: string[];
    evaluationCriteria: string[];
    
    // INDIVIDUAL ENTITIES (single values with metadata)
    // Core Business Entities
    budget?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    timeline?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    urgency?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    contactMethod?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    role?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    industry?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    company?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    teamSize?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    // NEW: Complete Entity Storage (2025 Best Practice)
    // Personal Information
    visitorName?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    // Solution Context
    currentSolution?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    // Scheduling & Preferences
    preferredTime?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    // Sentiment & Behavioral Data
    sentiment?: {
      value: string; // "positive", "neutral", "negative"
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    emotionalTone?: {
      value: string; // "excited", "frustrated", "curious", etc.
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    // Conversation Flow Entities
    conversationPhase?: {
      value: string; // "discovery", "qualification", "demonstration", etc.
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    engagementLevel?: {
      value: string; // "low", "medium", "high", "very_high"
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    // Business Logic Entities
    nextBestAction?: {
      value: string; // "continue_conversation", "capture_contact", etc.
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    // AI Response Tone Tracking
    responseStyle?: {
      value: string; // "professional", "friendly", "consultative", etc.
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    // Lead Capture Signals
    leadCaptureReadiness?: {
      value: boolean;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    
    // NEW: Complete Entity History (2025 Best Practice)
    entityHistory?: {
      [entityName: string]: Array<{
        value: any;
        confidence: number;
        timestamp: string;
        sourceMessageId: string;
        changeType: 'created' | 'updated' | 'corrected' | 'confirmed';
        previousValue?: any;
      }>;
    };
    
    // Enhanced Metadata
    lastEntityUpdate?: string;
    entityMetadata?: {
      totalEntitiesExtracted: number;
      correctionsApplied: number;
      lastExtractionMethod: 'enhanced' | 'basic' | 'fallback';
      lastProcessedMessageId: string;
      // NEW: Complete tracking metrics
      entitiesStoredThisSession: number;
      uniqueEntitiesDiscovered: number;
      entityEvolutionCount: number; // how many times entities were refined
      confidenceScoreAverage: number;
      highConfidenceEntitiesCount: number; // confidence > 0.8
      lastHighConfidenceExtraction?: string;
    };
  };
  intentHistory?: {
    businessContextEstablished: boolean;
    lastBusinessIntent: string;
    lastBusinessTurn: number;
    currentConversationMode: 'greeting' | 'business' | 'casual' | 'qualification';
    intentSequence: Array<{
      turn: number;
      intent: string;
      confidence: number;
      timestamp: string;
      messageId: string;
    }>;
    contextFlags: {
      productInterestEstablished: boolean;
      pricingDiscussed: boolean;
      comparisonMode: boolean;
      companyInquiryMade: boolean;
      knowledgeBaseNeeded: boolean;
      lastBusinessQuestionTurn: number;
    };
  };
  // Domain-calculated lead score from DomainConstants.calculateLeadScore()
  leadScore?: number;

  // NEW: Conversation Flow Tracking (Phase 1.2)
  conversationFlow?: {
    currentPhase: 'discovery' | 'qualification' | 'demo' | 'objection_handling' | 'closing';
    phaseStartedAt: Date;
    phaseHistory: Array<{
      phase: string;
      startedAt: Date;
      duration?: number;
      completionStatus: 'completed' | 'interrupted' | 'ongoing';
    }>;
    objectives: {
      primary?: string; // "schedule demo", "get pricing info"
      secondary: string[];
      achieved: string[];
      blocked: string[]; // objectives that hit obstacles
    };
  };

  // NEW: Response Quality Tracking (Phase 1.2)
  responseQuality?: {
    coherenceScore: number; // 0-1, how well conversation flows
    userEngagement: 'high' | 'medium' | 'low';
    lastResponseEffective: boolean;
    misunderstandingCount: number;
    topicDrift: number; // how much conversation has wandered
    lastResponseType: 'informational' | 'question' | 'action_request' | 'clarification';
  };

  // NEW: Context Management (Phase 1.2)
  contextMetrics?: {
    totalTokensUsed: number;
    maxTokensAvailable: number;
    utilizationPercentage: number;
    compressionEvents: number;
    lastCompressionAt?: Date;
    preservedMessageIds: string[]; // critical messages never to compress
  };

  // NEW: User Behavioral Patterns (Phase 1.2)
  userBehavior?: {
    communicationStyle: {
      preferredResponseLength: 'brief' | 'detailed' | 'comprehensive';
      formalityLevel: 'casual' | 'professional' | 'technical';
      questioningPattern: 'direct' | 'exploratory' | 'skeptical';
    };
    engagementMetrics: {
      averageSessionDuration: number;
      messagesPerSession: number;
      dropOffPoints: string[]; // topics where user typically disengages
    };
  };
}

export interface PageView {
  url: string;
  title: string;
  timestamp: Date;
  timeOnPage: number;
}

export interface LeadQualificationState {
  isQualified: boolean;
  currentStep: number;
  answeredQuestions: AnsweredQuestion[];
  qualificationStatus: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  capturedAt?: Date;
}

export interface AnsweredQuestion {
  questionId: string;
  question: string;
  answer: string | string[];
  answeredAt: Date;
  scoringWeight: number;
}

export type SessionStatus = 'active' | 'idle' | 'completed' | 'abandoned' | 'ended';

export interface ContactInfo {
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
}

export interface SessionMetrics {
  duration: number;
  pageViewCount: number;
  topicCount: number;
  interestCount: number;
  hasContactInfo: boolean;
} 