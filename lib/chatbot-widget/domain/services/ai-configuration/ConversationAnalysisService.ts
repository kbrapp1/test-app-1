import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';

/**
 * Conversation Analysis Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Analyze conversation context using extracted entities and intent
 * - Maintain single responsibility for conversation analysis
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Delegate complex calculations to separate methods
 * - Use extracted intent data instead of re-processing for efficiency
 */
export class ConversationAnalysisService {
  
  /** Analyze conversation context using extracted entities and intent (2025 efficient approach) */
  analyzeConversationContext(
    session: ChatSession,
    conversationHistory?: ChatMessage[],
    entityData?: any,
    intentData?: any,
    _leadScore?: number
  ): ConversationAnalysis {
    const messageCount = conversationHistory?.length || 0;
    const phase = this.classifyConversationPhase(messageCount, session.contextData.topics);
    
    // Use extracted intent data instead of re-processing (2025 efficiency)
    const businessContext = this.determineBusinessContextFromIntent(intentData, entityData);
    const productInterest = this.determineProductInterestFromIntent(intentData, entityData);
    const pricingFocus = this.determinePricingFocusFromIntent(intentData, entityData);
    const comparisonMode = this.determineComparisonModeFromIntent(intentData, entityData);
    
    // Calculate entity complexity from extracted data
    const entityComplexity = this.calculateEntityComplexity(entityData);
    
    // Predict token requirements based on intent signals
    const intentSignals = { businessContext, productInterest, pricingFocus, comparisonMode };
    const tokensNeeded = this.calculateTokenRequirements(intentSignals);
    
    return {
      messageCount,
      phase,
      businessContext,
      productInterest,
      pricingFocus,
      comparisonMode,
      entityComplexity,
      tokensNeeded
    };
  }

  /** Conversation phase classification (2025 approach) */
  private classifyConversationPhase(messageCount: number, _topics: string[]): ConversationPhase {
    if (messageCount <= 1) return 'greeting';
    if (messageCount <= 3) return 'discovery';
    if (messageCount <= 7) return 'exploration';
    return 'qualification';
  }

  /** Use extracted intent data for business context (no re-processing) */
  private determineBusinessContextFromIntent(intentData?: any, entityData?: any): boolean {
    // Use previously extracted intent instead of keyword matching
    if (intentData?.primary === 'business_inquiry' || 
        intentData?.primary === 'company_inquiry' ||
        intentData?.primary === 'faq_general') {
      return true;
    }
    
    // Use extracted entities for business context
    if (entityData?.companies?.length > 0 || 
        entityData?.industries?.length > 0 ||
        entityData?.businessTerms?.length > 0) {
      return true;
    }
    
    return false;
  }

  /** Use extracted intent data for product interest (no re-processing) */
  private determineProductInterestFromIntent(intentData?: any, entityData?: any): boolean {
    if (intentData?.primary === 'product_inquiry' || 
        intentData?.primary === 'feature_inquiry' ||
        intentData?.primary === 'capability_inquiry') {
      return true;
    }
    
    if (entityData?.products?.length > 0 || 
        entityData?.features?.length > 0) {
      return true;
    }
    
    return false;
  }

  /** Use extracted intent data for pricing focus (no re-processing) */
  private determinePricingFocusFromIntent(intentData?: any, entityData?: any): boolean {
    if (intentData?.primary === 'pricing_inquiry' || 
        intentData?.primary === 'cost_inquiry') {
      return true;
    }
    
    if (entityData?.pricing?.length > 0 || 
        entityData?.budget?.length > 0) {
      return true;
    }
    
    return false;
  }

  /** Use extracted intent data for comparison mode (no re-processing) */
  private determineComparisonModeFromIntent(intentData?: any, entityData?: any): boolean {
    if (intentData?.primary === 'comparison_inquiry' || 
        intentData?.primary === 'competitor_inquiry') {
      return true;
    }
    
    if (entityData?.competitors?.length > 0 || 
        entityData?.alternatives?.length > 0) {
      return true;
    }
    
    return false;
  }

  /** Calculate entity complexity from extracted data */
  private calculateEntityComplexity(entityData?: any): number {
    if (!entityData) return 0;
    
    let complexity = 0;
    Object.keys(entityData).forEach(category => {
      if (Array.isArray(entityData[category])) {
        complexity += entityData[category].length;
      }
    });
    
    return complexity;
  }

  /** Token requirement prediction (2025 efficiency) */
  private calculateTokenRequirements(intentSignals: any): number {
    let baseTokens = 400; // Core persona
    
    if (intentSignals.businessContext) baseTokens += 800; // Knowledge base needed
    if (intentSignals.productInterest) baseTokens += 400; // Product details
    if (intentSignals.pricingFocus) baseTokens += 300; // Pricing context
    if (intentSignals.comparisonMode) baseTokens += 200; // Comparison framework
    
    return Math.min(baseTokens, 2000); // 2025 token limit
  }
}

// Type definitions
export interface ConversationAnalysis {
  messageCount: number;
  phase: ConversationPhase;
  businessContext: boolean;
  productInterest: boolean;
  pricingFocus: boolean;
  comparisonMode: boolean;
  entityComplexity: number;
  tokensNeeded: number;
}

export type ConversationPhase = 'greeting' | 'discovery' | 'exploration' | 'qualification'; 