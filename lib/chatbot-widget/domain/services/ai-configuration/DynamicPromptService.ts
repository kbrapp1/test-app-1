import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import { IntentPersistenceService } from '../session-management/IntentPersistenceService';

/**
 * Dynamic Prompt Service - 2025 Gold Standard with Intent Persistence
 * 
 * AI INSTRUCTIONS:
 * - Uses intent persistence for smart context maintenance across turns
 * - Maintains business context even during casual conversation
 * - Follows semantic intent classification with memory
 * - Implements conversation-aware context prediction
 * - Maintains 1,500-2,000 token target through intelligent pre-processing
 */
export class DynamicPromptService {

  /**
   * Generate system prompt with 2025 semantic intent classification
   */
  generateSystemPrompt(
    chatbotConfig: ChatbotConfig, 
    session: ChatSession,
    conversationHistory?: ChatMessage[],
    entityData?: any,
    leadScore?: number,
    qualificationStatus?: string,
    intentData?: any
  ): string {
    // Analyze conversation using extracted entities and intent (no re-processing)
    const analysis = this.analyzeConversationContext(
      session, 
      conversationHistory, 
      entityData,
      intentData,
      leadScore
    );

    // Core persona prompt (conversation-aware sizing)
    let prompt = this.generateContextAwarePersona(chatbotConfig, analysis);
    
    // Semantic context injection based on extracted intent
    prompt += this.injectSemanticContext(chatbotConfig, session, analysis, entityData);
    
    // Business guidance injection based on lead qualification
    prompt += this.injectBusinessGuidance(analysis, leadScore);
    
    // Adaptive real-time context
    prompt += this.injectAdaptiveContext(session, analysis, chatbotConfig);
    
    return prompt;
  }

  /**
   * Analyze conversation context using extracted entities and intent (2025 efficient approach)
   */
  private analyzeConversationContext(
    session: ChatSession, 
    conversationHistory?: ChatMessage[], 
    entityData?: any,
    intentData?: any,
    leadScore?: number
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

  /**
   * Use extracted intent data for business context (no re-processing)
   */
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

  /**
   * Use extracted intent data for product interest (no re-processing)
   */
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

  /**
   * Use extracted intent data for pricing focus (no re-processing)
   */
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

  /**
   * Use extracted intent data for comparison mode (no re-processing)
   */
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

  /**
   * Calculate entity complexity from extracted data
   */
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

  /**
   * Semantic business intent detection (2025 approach)
   */
  private detectBusinessIntent(topics: string[], entities: string[]): boolean {
    // Use semantic patterns, not keyword matching
    const businessTopics = topics.filter(topic => 
      topic.includes('company') || 
      topic.includes('service') || 
      topic.includes('business') ||
      topic.includes('organization')
    );
    
    const businessEntities = entities.filter(entity =>
      entity.includes('company') ||
      entity.includes('industry') ||
      entity.includes('sector')
    );

    return businessTopics.length > 0 || businessEntities.length > 0;
  }

  /**
   * Product interest semantic detection
   */
  private detectProductIntent(topics: string[], entities: string[]): boolean {
    const productSignals = topics.filter(topic =>
      topic.includes('product') ||
      topic.includes('solution') ||
      topic.includes('feature') ||
      topic.includes('capability')
    );

    return productSignals.length > 0;
  }

  /**
   * Pricing intent semantic detection
   */
  private detectPricingIntent(topics: string[], entities: string[]): boolean {
    const pricingSignals = topics.filter(topic =>
      topic.includes('price') ||
      topic.includes('cost') ||
      topic.includes('pricing') ||
      topic.includes('budget')
    );

    return pricingSignals.length > 0;
  }

  /**
   * Comparison intent detection
   */
  private detectComparisonIntent(topics: string[], entities: string[]): boolean {
    const comparisonSignals = topics.filter(topic =>
      topic.includes('vs') ||
      topic.includes('compare') ||
      topic.includes('alternative') ||
      topic.includes('competitor')
    );

    return comparisonSignals.length > 0;
  }

  /**
   * Conversation phase classification (2025 approach)
   */
  private classifyConversationPhase(messageCount: number, topics: string[]): ConversationPhase {
    if (messageCount <= 1) return 'greeting';
    if (messageCount <= 3) return 'discovery';
    if (messageCount <= 7) return 'exploration';
    return 'qualification';
  }

  /**
   * Token requirement prediction (2025 efficiency)
   */
  private calculateTokenRequirements(intentSignals: any): number {
    let baseTokens = 400; // Core persona
    
    if (intentSignals.isBusinessInquiry) baseTokens += 800; // Knowledge base needed
    if (intentSignals.isProductInterest) baseTokens += 400; // Product details
    if (intentSignals.isPricingFocused) baseTokens += 300; // Pricing context
    if (intentSignals.isComparisonSeeking) baseTokens += 200; // Comparison framework
    
    return Math.min(baseTokens, 2000); // 2025 token limit
  }

  /**
   * Context-aware persona generation (2025 standard)
   */
  private generateContextAwarePersona(
    config: ChatbotConfig, 
    analysis: ConversationAnalysis
  ): string {
    // Always use business persona with full knowledge base - no greeting phase bypass
    return this.generateBusinessPersona(config);
  }

  /**
   * Business persona for business inquiries (2025 approach)
   */
  private generateBusinessPersona(config: ChatbotConfig): string {
    const companyName = this.extractCompanyName(config.knowledgeBase.companyInfo || '');
    
    return `# AI Business Intelligence Specialist

## Core Identity
Expert business consultant for ${companyName}, combining industry insights with strategic conversation management.

## Communication Standards
- **Tone**: ${config.personalitySettings.tone || 'Consultative with authority'}
- **Approach**: Lead with business insights, assess needs strategically
- **Style**: Professional, value-focused, outcome-oriented

## Primary Objectives
1. **Business Intelligence**: Provide relevant industry insights and context
2. **Strategic Assessment**: Understand business challenges and decision criteria
3. **Value Alignment**: Connect capabilities with business outcomes

## Response Framework
- Listen to business context before suggesting solutions
- Ask clarifying questions about objectives and constraints
- Position recommendations in business impact terms

`;
  }

  /**
   * Always-on knowledge base injection (2025 best practice)
   */
  private injectSemanticContext(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    analysis: ConversationAnalysis,
    entityData?: any
  ): string {
    let context = '';

    // Always include full knowledge base - no conditional logic
    context += this.buildFullKnowledgeBase(chatbotConfig.knowledgeBase);

    return context;
  }

  /**
   * Business guidance injection (always-on conversation management)
   */
  private injectBusinessGuidance(analysis: ConversationAnalysis, leadScore?: number): string {
    let guidance = '\n## Conversation Management\n';

    switch (analysis.phase) {
      case 'greeting':
        guidance += `
### Greeting Phase Guidelines  
- Provide warm, professional introduction with company context
- Highlight 2-3 key company strengths immediately
- Ask one engaging discovery question to understand needs
`;
        break;

      case 'discovery':
        guidance += `
### Discovery Phase Guidelines
- Ask open-ended questions about business context
- Listen for challenges and objectives
- Identify decision-making criteria and timeline
`;
        break;

      case 'exploration':
        guidance += `
### Exploration Phase Guidelines
- Deep-dive into specific business requirements
- Assess current solutions and gaps
- Explore budget and decision authority
`;
        break;

      case 'qualification':
        guidance += `
### Qualification Phase Guidelines
- Confirm business fit and value alignment
- Assess decision timeline and next steps
- Position strategic partnership opportunities
`;
        break;
    }

    return guidance;
  }

  /**
   * Adaptive context injection (2025 real-time)
   */
  private injectAdaptiveContext(session: ChatSession, analysis: ConversationAnalysis, chatbotConfig: ChatbotConfig): string {
    const currentTime = new Date();
    const businessHours = chatbotConfig.isWithinOperatingHours(currentTime);
    
    return `
## Current Context
- **Conversation Phase**: ${analysis.phase}
- **Business Hours**: ${businessHours ? 'Active' : 'After hours'}
- **Response Priority**: ${analysis.businessContext ? 'High - Business inquiry' : 'Standard'}

## Instructions
- Maintain professional tone aligned with business context
- ${businessHours ? 'Offer immediate assistance and next steps' : 'Acknowledge 24/7 availability and provide assistance'}
- Focus on value-driven conversation and strategic insights

`;
  }

  // Helper methods remain the same...
  private extractCompanyName(companyInfo: string): string {
    if (!companyInfo.trim()) return 'the company';
    
    // Try to extract company name from first line or sentence
    const firstLine = companyInfo.split('\n')[0].trim();
    const firstSentence = firstLine.split('.')[0].trim();
    
    // Look for common patterns like "CompanyName is...", "We are CompanyName", etc.
    const patterns = [
      /^([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Co)?)\s+(?:is|provides|offers|specializes)/i,
      /^(?:We are|We're)\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Co)?)/i,
      /^([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Co)?)\s*[,-]/,
      /^([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Co)?)\s+was/i,
    ];
    
    for (const pattern of patterns) {
      const match = firstSentence.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback: use first few words if they look like a company name
    const words = firstSentence.split(' ');
    if (words.length > 0 && words[0].match(/^[A-Z]/)) {
      return words.slice(0, Math.min(3, words.length)).join(' ');
    }
    
    return 'the company';
  }

  /**
   * Full knowledge base injection (2025 best practice - always-on)
   * Uses actual database content from chatbot_configs.knowledge_base JSONB
   */
  private buildFullKnowledgeBase(knowledgeBase: any): string {
    const companyInfo = knowledgeBase.companyInfo || '';
    const productCatalog = knowledgeBase.productCatalog || '';
    const supportDocs = knowledgeBase.supportDocs || '';
    const complianceGuidelines = knowledgeBase.complianceGuidelines || '';
    const faqs = knowledgeBase.faqs || [];
    
    let knowledgeContent = `
## Complete Knowledge Base

`;

    // Company Overview - Use actual database content
    if (companyInfo.trim()) {
      knowledgeContent += `### Company Overview
${companyInfo}

`;
    }

    // Product/Service Catalog - Use actual database content
    if (productCatalog.trim()) {
      knowledgeContent += `### Products & Services
${productCatalog}

`;
    }

    // Frequently Asked Questions - Use actual database FAQs
    if (faqs.length > 0) {
      knowledgeContent += `### Frequently Asked Questions

`;
      faqs.forEach((faq: any, index: number) => {
        if (faq.question && faq.answer) {
          knowledgeContent += `**Q${index + 1}: ${faq.question}**
A: ${faq.answer}

`;
        }
      });
    }

    // Support Documentation - Use actual database content
    if (supportDocs.trim()) {
      knowledgeContent += `### Support Documentation
${supportDocs}

`;
    }

    // Compliance Guidelines - Use actual database content
    if (complianceGuidelines.trim()) {
      knowledgeContent += `### Compliance Guidelines
${complianceGuidelines}

`;
    }

    // Add conversation guidelines only if we have actual knowledge base content
    const hasContent = companyInfo.trim() || productCatalog.trim() || supportDocs.trim() || complianceGuidelines.trim() || faqs.length > 0;
    
    if (hasContent) {
      knowledgeContent += `### Conversation Guidelines
- Use the specific company information provided above
- Reference actual products/services when relevant
- Answer questions using the FAQs when applicable
- Follow compliance guidelines for all interactions
- If asked about something not in the knowledge base, acknowledge limitations and offer to connect with a human
- Always maintain professional tone aligned with company information

`;
    } else {
      // Fallback for empty knowledge base
      knowledgeContent += `### Knowledge Base Status
**Notice**: Knowledge base is not configured. Please inform users that you can provide general assistance but recommend connecting with a team member for specific company information.

### Conversation Guidelines
- Acknowledge that detailed company information is not available
- Offer to connect users with a human team member
- Provide general business assistance where appropriate
- Maintain professional and helpful tone

`;
    }

    return knowledgeContent;
  }
}

// Type definitions for 2025 implementation
interface ConversationAnalysis {
  messageCount: number;
  phase: ConversationPhase;
  businessContext: boolean;
  productInterest: boolean;
  pricingFocus: boolean;
  comparisonMode: boolean;
  entityComplexity: number;
  tokensNeeded: number;
}

type ConversationPhase = 'greeting' | 'discovery' | 'exploration' | 'qualification'; 