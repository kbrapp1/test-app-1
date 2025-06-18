/**
 * OpenAI Prompt Builder
 * 
 * Service for building system and user prompts for intent classification.
 * Single responsibility: Construct contextual prompts for OpenAI API calls.
 */

import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { IntentClassificationContext } from '../../../../domain/services/interfaces/IIntentClassificationService';

export class OpenAIPromptBuilder {
  /**
   * Build enhanced system prompt with persona awareness
   */
  static buildEnhancedSystemPrompt(conversationHistory: ChatMessage[]): string {
    let prompt = `You are an expert intent classifier and persona analyzer for a business chatbot.

CORE RESPONSIBILITIES:
1. Classify user intent with high accuracy
2. Extract relevant business entities
3. Infer user persona (role, industry, company size)
4. Detect ambiguous cases requiring clarification
5. Provide reasoning for all decisions

INTENT CLASSIFICATION GUIDELINES:
- greeting: Initial contact, pleasantries
- faq_general: General product questions
- faq_pricing: Pricing-related questions
- faq_features: Feature-specific questions
- sales_inquiry: Expressing interest in purchasing
- demo_request: Requesting product demonstration
- booking_request: Scheduling meetings/calls
- support_request: Technical help or issues
- qualification: Providing budget/timeline info
- objection_handling: Expressing concerns/objections
- closing: Ready to purchase/move forward
- unknown: Unclear or off-topic

ENTITY EXTRACTION FOCUS:
- Budget: Any monetary amounts or budget ranges
- Timeline: Urgency indicators, deadlines, timeframes
- Company: Organization details, team size
- Role: Job titles, responsibilities mentioned
- Industry: Business sector or vertical
- Contact preferences: Email, phone, meeting preferences

PERSONA INFERENCE RULES:
- Look for job titles, responsibilities, decision-making authority
- Infer industry from context clues and terminology
- Estimate company size from team mentions
- Consider technical vs. business language usage
- Note decision-making vs. influencer signals

DISAMBIGUATION DETECTION:
- Flag when multiple intents have similar confidence (>0.6)
- Identify when context is insufficient for confident classification
- Suggest specific clarifying questions
- Consider conversation history for context

`;
    // Add conversation context
    if (conversationHistory.length > 0) {
      const recentIntents = this.extractRecentIntents(conversationHistory);
      prompt += `

CONVERSATION CONTEXT:
- Recent intents: ${recentIntents.join(' → ')}
- Conversation length: ${conversationHistory.length} messages
- Look for intent progression patterns and context switches`;
    }

    return prompt;
  }

  /**
   * Build system prompt for basic intent classification
   */
  static buildBasicSystemPrompt(context: IntentClassificationContext): string {
    return `You are an expert intent classifier for a ${context.chatbotConfig.name || 'business'} chatbot.

Your task is to classify user messages into one of these intents:
- greeting: Initial hello, hi, good morning, etc.
- faq_general: General questions about the business/product
- faq_pricing: Questions about pricing, costs, plans
- faq_features: Questions about features, capabilities, functionality
- sales_inquiry: Interest in purchasing, buying, getting started
- booking_request: Want to schedule a meeting, demo, consultation
- demo_request: Want to see a demonstration or trial
- support_request: Need help with existing product/service
- objection_handling: Concerns, doubts, comparisons with competitors
- qualification: Providing information about budget, timeline, company
- closing: Ready to buy, asking about next steps, contracts
- unknown: Cannot determine intent clearly

Also extract entities like:
- location: Geographic location mentioned
- budget: Budget range or amount mentioned
- timeline: When they need solution by
- company: Company name mentioned
- industry: Industry they're in
- teamSize: Size of their team
- urgency: How urgent their need is
- contactMethod: Preferred contact method

Consider the conversation history and user's journey stage when classifying.`;
  }

  /**
   * Build user prompt for classification
   */
  static buildUserPrompt(message: string, context: IntentClassificationContext): string {
    const historyContext = context.messageHistory.length > 0 
      ? `\n\nConversation history:\n${context.messageHistory.slice(-3).map(m => 
          `${m.isFromUser() ? 'User' : 'Bot'}: ${m.content}`
        ).join('\n')}`
      : '';

    return `Classify this user message: "${message}"${historyContext}

Respond with structured JSON containing:
- intent: one of the defined intent types
- confidence: 0-1 confidence score
- entities: extracted entities object
- reasoning: brief explanation of classification
- alternativeIntents: array of other possible intents with confidence scores`;
  }

  /**
   * Extract recent intents from conversation history
   */
  private static extractRecentIntents(conversationHistory: ChatMessage[]): string[] {
    // This would ideally look at stored intent history
    // For now, return placeholder based on message patterns
    return conversationHistory
      .filter(m => m.messageType === 'user')
      .slice(-3)
      .map(m => {
        if (m.content.toLowerCase().includes('price') || m.content.toLowerCase().includes('cost')) {
          return 'faq_pricing';
        }
        if (m.content.toLowerCase().includes('demo')) {
          return 'demo_request';
        }
        return 'unknown';
      });
  }

  /**
   * Extract behavior signals from conversation history
   */
  static extractBehaviorSignals(conversationHistory: ChatMessage[]): string[] {
    const signals: string[] = [];
    
    if (conversationHistory.length > 5) {
      signals.push('engaged_conversation');
    }
    
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    const avgMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    
    if (avgMessageLength > 100) {
      signals.push('detailed_responses');
    }
    
    if (userMessages.some(m => m.content.includes('?'))) {
      signals.push('asking_questions');
    }
    
    return signals;
  }

  /**
   * Build entity extraction prompt with correction detection
   * 
   * AI INSTRUCTIONS:
   * - Focus on detecting entity corrections and removals
   * - Provide clear examples for correction patterns
   * - Follow @golden-rule patterns exactly
   * - Keep under 200 lines with focused responsibility
   */
  static buildEntityExtractionPrompt(): string {
    return `
ENTITY EXTRACTION WITH CORRECTION DETECTION:

Extract entities from the user's message AND detect any corrections or removals.

REMOVAL PATTERNS TO DETECT:
- "X is NOT a decision maker" → removedDecisionMakers: ["X"]
- "Jane is no longer involved in decisions" → removedDecisionMakers: ["Jane"]
- "We don't have that integration need anymore" → removedIntegrationNeeds: [specific need]
- "That pain point doesn't apply to us" → removedPainPoints: [specific point]
- "We solved that problem already" → removedPainPoints: [specific point]

CORRECTION PATTERNS TO DETECT:
- "Actually our budget is $100K, not $50K" → correctedBudget: "$100K"
- "I misspoke, our timeline is 6 months" → correctedTimeline: "6 months"
- "Sorry, I meant John Smith, not John Jones" → handle as removal + addition
- "I'm actually a Director, not a Manager" → correctedRole: "Director"

EXAMPLES:

User: "Jane Doe is not a decision maker"
Function Call: {
  "corrections": {
    "removedDecisionMakers": ["Jane Doe"]
  }
}

User: "Actually our budget is $200K, not the $100K I mentioned before"
Function Call: {
  "corrections": {
    "correctedBudget": "$200K"
  }
}

User: "We don't need CRM integration anymore, but we do need email automation"
Function Call: {
  "integrationNeeds": ["email automation"],
  "corrections": {
    "removedIntegrationNeeds": ["CRM integration"]
  }
}

IMPORTANT: Always look for negations, corrections, and clarifications. Process corrections BEFORE additions.
`;
  }
} 