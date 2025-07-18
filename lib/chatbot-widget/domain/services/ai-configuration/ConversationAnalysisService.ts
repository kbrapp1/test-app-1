import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import { IntentType, ExtractedEntities } from '../../value-objects/message-processing/IntentResult';

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
    entityData?: ExtractedEntities,
    intentData?: IntentClassificationData,
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
  private determineBusinessContextFromIntent(intentData?: IntentClassificationData, entityData?: ExtractedEntities): boolean {
    // Use previously extracted intent instead of keyword matching
    if (intentData?.primary === 'sales_inquiry' || 
        intentData?.primary === 'faq_general') {
      return true;
    }
    
    // Use extracted entities for business context
    if (entityData?.company || 
        entityData?.industry) {
      return true;
    }
    
    return false;
  }

  /** Use extracted intent data for product interest (no re-processing) */
  private determineProductInterestFromIntent(intentData?: IntentClassificationData, entityData?: ExtractedEntities): boolean {
    if (intentData?.primary === 'faq_features') {
      return true;
    }
    
    // Product interest inferred from business context
    if (entityData?.company) {
      return true;
    }
    
    return false;
  }

  /** Use extracted intent data for pricing focus (no re-processing) */
  private determinePricingFocusFromIntent(intentData?: IntentClassificationData, entityData?: ExtractedEntities): boolean {
    if (intentData?.primary === 'faq_pricing') {
      return true;
    }
    
    if (entityData?.budget) {
      return true;
    }
    
    return false;
  }

  /** Use extracted intent data for comparison mode (no re-processing) */
  private determineComparisonModeFromIntent(intentData?: IntentClassificationData, entityData?: ExtractedEntities): boolean {
    if (intentData?.primary === 'objection_handling') {
      return true;
    }
    
    // Comparison mode inferred from urgency or timeline
    if (entityData?.urgency === 'high' || entityData?.timeline) {
      return true;
    }
    
    return false;
  }

  /** Calculate entity complexity from extracted data */
  private calculateEntityComplexity(entityData?: ExtractedEntities): number {
    if (!entityData) return 0;
    
    // Count non-empty string fields and defined values
    let complexity = 0;
    const fields = [
      entityData.visitorName,
      entityData.location,
      entityData.budget,
      entityData.timeline,
      entityData.company,
      entityData.industry,
      entityData.teamSize,
      entityData.role,
      entityData.urgency,
      entityData.contactMethod,
      entityData.currentSolution,
      entityData.preferredTime
    ];
    
    fields.forEach(field => {
      if (field && field.trim && field.trim() !== '') {
        complexity++;
      } else if (field && typeof field !== 'string') {
        complexity++;
      }
    });
    
    return complexity;
  }

  /** Token requirement prediction (2025 efficiency) */
  private calculateTokenRequirements(intentSignals: IntentSignals): number {
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

// AI-related type definitions for intent classification
export interface IntentClassificationData {
  primary: IntentType;
  confidence?: number;
  secondary?: IntentType;
  reasoning?: string;
}

export interface IntentSignals {
  businessContext: boolean;
  productInterest: boolean;
  pricingFocus: boolean;
  comparisonMode: boolean;
} 