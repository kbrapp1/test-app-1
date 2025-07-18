/**
 * AI-Driven Conversation Flow Service (Domain)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Process AI-provided conversation flow decisions
 * - Pure domain logic - no infrastructure dependencies
 * - Use AI decisions instead of hard-coded business rules
 * - Follow @golden-rule patterns exactly
 * - Stay under 200-250 lines
 * - Publish domain events for flow state changes
 * - UPDATED: Replaced rule-based flow with AI-driven decisions
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { 
  ReadinessIndicatorDomainService, 
  ReadinessIndicators, 
  ReadinessCalculationContext 
} from './ReadinessIndicatorDomainService';

export interface AIConversationFlowDecision {
  shouldCaptureLeadNow: boolean;
  shouldAskQualificationQuestions: boolean;
  shouldEscalateToHuman: boolean;
  nextBestAction: 'continue_conversation' | 'capture_contact' | 'ask_qualification' | 'request_demo' | 'escalate_human' | 'provide_resources';
  conversationPhase: 'discovery' | 'qualification' | 'demonstration' | 'closing' | 'support' | 'escalation';
  engagementLevel: 'low' | 'medium' | 'high' | 'very_high';
  flowReasoning: string;
  // Note: readinessIndicators are now derived from API data, not provided by API
  leadScore?: number;
  entities?: Record<string, unknown>;
}

export interface ConversationFlowState {
  currentPhase: string;
  messageCount: number;
  engagementScore: number;
  lastFlowDecision: AIConversationFlowDecision | null;
  flowHistory: AIConversationFlowDecision[];
}

export class ConversationFlowService {
  
  /**
   * Process AI-provided conversation flow decision
   * Validates and applies AI decision to conversation state
   */
  static processAIFlowDecision(
    decision: AIConversationFlowDecision,
    currentState: ConversationFlowState
  ): ConversationFlowState {
    // Validate AI decision structure
    this.validateFlowDecision(decision);
    
    // Apply AI decision to conversation state
    const updatedState: ConversationFlowState = {
      ...currentState,
      currentPhase: decision.conversationPhase,
      lastFlowDecision: decision,
      flowHistory: [...currentState.flowHistory, decision]
    };
    
    return updatedState;
  }
  
  /**
   * Get conversation readiness score using derived indicators
   * 
   * AI INSTRUCTIONS:
   * - Uses ReadinessIndicatorDomainService for proper domain logic separation
   * - Transforms API data into readiness calculation context
   * - Follows @golden-rule.mdc anti-corruption layer pattern
   */
  static calculateReadinessScore(flowDecision: AIConversationFlowDecision): number {
    // Return 0 if no flow decision provided
    if (!flowDecision) {
      return 0;
    }

    // Create context from API data for readiness calculation
    const context: ReadinessCalculationContext = {
      leadScore: flowDecision.leadScore || 0,
      entities: {
        goals: [],
        decisionMakers: [],
        painPoints: [],
        integrationNeeds: [],
        evaluationCriteria: [],
        budget: null,
        timeline: null,
        urgency: null,
        contactMethod: null,
        visitorName: null,
        role: null,
        industry: null,
        company: null,
        teamSize: null,
        eventType: '',
        ...(flowDecision.entities || {})
      },
      conversationPhase: flowDecision.conversationPhase || 'discovery',
      engagementLevel: flowDecision.engagementLevel || 'low'
    };

    try {
      // Derive indicators from API data using domain service
      const indicators = ReadinessIndicatorDomainService.deriveReadinessIndicators(context);
      
      // Calculate score using domain service
      return ReadinessIndicatorDomainService.calculateReadinessScore(indicators);
    } catch {
      // Domain validation failed - return default value without logging to console
      return 0.3; // Default medium readiness
    }
  }

  /** Get derived readiness indicators from API data */
  static getReadinessIndicators(flowDecision: AIConversationFlowDecision): ReadinessIndicators {
    if (!flowDecision) {
      return {
        hasContactInfo: false,
        showsBuyingIntent: false,
        hasDecisionAuthority: false,
        hasBudgetIndications: false,
        hasTimelineUrgency: false
      };
    }

    const context: ReadinessCalculationContext = {
      leadScore: flowDecision.leadScore || 0,
      entities: {
        goals: [],
        decisionMakers: [],
        painPoints: [],
        integrationNeeds: [],
        evaluationCriteria: [],
        budget: null,
        timeline: null,
        urgency: null,
        contactMethod: null,
        visitorName: null,
        role: null,
        industry: null,
        company: null,
        teamSize: null,
        eventType: '',
        ...(flowDecision.entities || {})
      },
      conversationPhase: flowDecision.conversationPhase || 'discovery',
      engagementLevel: flowDecision.engagementLevel || 'low'
    };

    try {
      return ReadinessIndicatorDomainService.deriveReadinessIndicators(context);
    } catch {
      // Domain validation failed - return empty indicators without logging to console
      return {
        hasContactInfo: false,
        showsBuyingIntent: false,
        hasDecisionAuthority: false,
        hasBudgetIndications: false,
        hasTimelineUrgency: false
      };
    }
  }
  
  /** Should trigger lead capture based on AI decision */
  static shouldTriggerLeadCapture(decision: AIConversationFlowDecision): boolean {
    this.validateFlowDecision(decision);
    return decision.shouldCaptureLeadNow;
  }
  
  /** Should ask qualification questions based on AI decision */
  static shouldAskQualificationQuestions(decision: AIConversationFlowDecision): boolean {
    this.validateFlowDecision(decision);
    return decision.shouldAskQualificationQuestions;
  }
  
  /** Should escalate to human based on AI decision */
  static shouldEscalateToHuman(decision: AIConversationFlowDecision): boolean {
    this.validateFlowDecision(decision);
    return decision.shouldEscalateToHuman;
  }

  /**
   * Get next best action based on AI decision
   * 
   * AI INSTRUCTIONS:
   * - Pure delegation to AI decision
   * - No business logic in application service
   * - Validate input structure only
   */
  static getNextBestAction(decision: AIConversationFlowDecision): string {
    this.validateFlowDecision(decision);
    return decision.nextBestAction;
  }

  /** Get conversation phase based on AI decision */
  static getConversationPhase(decision: AIConversationFlowDecision): string {
    this.validateFlowDecision(decision);
    return decision.conversationPhase;
  }

  /** Get engagement level based on AI decision */
  static getEngagementLevel(decision: AIConversationFlowDecision): string {
    this.validateFlowDecision(decision);
    return decision.engagementLevel;
  }

  /**
   * Validate AI conversation flow decision structure
   * 
   * AI INSTRUCTIONS:
   * - Validate only required fields from API contract
   * - No longer expects readinessIndicators from API
   * - Follow @golden-rule.mdc validation patterns
   */
  private static validateFlowDecision(decision: AIConversationFlowDecision): void {
    if (!decision) {
      throw new BusinessRuleViolationError(
        'AI conversation flow decision is required',
        { decision }
      );
    }

    if (typeof decision.shouldCaptureLeadNow !== 'boolean') {
      throw new BusinessRuleViolationError(
        'shouldCaptureLeadNow must be a boolean',
        { decision }
      );
    }
    
    if (typeof decision.shouldAskQualificationQuestions !== 'boolean') {
      throw new BusinessRuleViolationError(
        'shouldAskQualificationQuestions must be a boolean',
        { decision }
      );
    }
    
    if (typeof decision.shouldEscalateToHuman !== 'boolean') {
      throw new BusinessRuleViolationError(
        'shouldEscalateToHuman must be a boolean',
        { decision }
      );
    }

    // Validate optional fields exist if provided
    if (decision.leadScore !== undefined && (typeof decision.leadScore !== 'number' || decision.leadScore < 0 || decision.leadScore > 100)) {
      throw new BusinessRuleViolationError(
        'leadScore must be a number between 0 and 100 when provided',
        { providedScore: decision.leadScore }
      );
    }

    if (decision.entities !== undefined && typeof decision.entities !== 'object') {
      throw new BusinessRuleViolationError(
        'entities must be an object when provided',
        { providedEntities: decision.entities }
      );
    }
  }
} 