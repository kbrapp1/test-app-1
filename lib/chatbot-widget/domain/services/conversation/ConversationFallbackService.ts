/**
 * Conversation Fallback Domain Service
 * 
 * Pure domain service for generating fallback responses when AI systems fail.
 * Contains business rules for graceful degradation and error handling.
 * Following @golden-rule.mdc: Single responsibility, pure domain logic
 */

import { ChatbotConfig } from '../entities/ChatbotConfig';

export interface FallbackResponse {
  content: string;
  shouldEscalate: boolean;
  alternativeActions: string[];
}

export class ConversationFallbackService {
  private readonly genericFallbacks = [
    "I'm experiencing some technical difficulties right now. Please feel free to contact us directly for immediate assistance.",
    "I apologize for the inconvenience. You can reach out to our team directly for help with your questions.",
    "I'm having trouble processing your request at the moment. Let me connect you with someone who can help."
  ];

  private readonly contextualFallbacks = {
    pricing: [
      "I'd love to help with pricing information, but I'm having technical issues. Please contact our sales team directly for accurate pricing details.",
      "For the most up-to-date pricing information, I recommend speaking directly with our sales team."
    ],
    support: [
      "I want to help resolve your issue, but I'm experiencing technical difficulties. Please contact our support team directly for immediate assistance.",
      "Our support team can better assist you with this issue. Please reach out to them directly."
    ],
    demo: [
      "I'd be happy to arrange a demo, but I'm having technical issues right now. Please contact our team directly to schedule one.",
      "Our team can set up a personalized demo for you. Please get in touch with them directly."
    ]
  };

  /**
   * Generate appropriate fallback response based on context
   */
  generateFallbackResponse(
    chatbotConfig: ChatbotConfig,
    lastUserMessage?: string,
    conversationContext?: any
  ): FallbackResponse {
    const context = this.detectContext(lastUserMessage);
    const content = this.selectFallbackMessage(chatbotConfig, context);
    
    return {
      content,
      shouldEscalate: this.shouldEscalateToHuman(context, conversationContext),
      alternativeActions: this.getAlternativeActions(chatbotConfig, context)
    };
  }

  /**
   * Check if situation requires human escalation
   */
  shouldEscalateToHuman(
    context: string,
    conversationContext?: any
  ): boolean {
    // Always escalate for support issues
    if (context === 'support') return true;
    
    // Escalate if user has been frustrated in conversation
    if (conversationContext?.sentiment === 'negative') return true;
    
    // Escalate if multiple AI failures in session
    if (conversationContext?.failureCount >= 2) return true;
    
    return false;
  }

  /**
   * Generate recovery suggestions for different failure scenarios
   */
  generateRecoveryActions(
    errorType: 'timeout' | 'api_error' | 'context_overflow' | 'unknown',
    chatbotConfig: ChatbotConfig
  ): string[] {
    const baseActions = [
      'Contact us directly for assistance',
      'Try refreshing the page and starting a new conversation'
    ];

    switch (errorType) {
      case 'timeout':
        return [
          'The system is running slowly. Please try again in a moment.',
          ...baseActions
        ];
      
      case 'context_overflow':
        return [
          'This conversation has become quite detailed. Let me connect you with a specialist.',
          ...baseActions
        ];
      
      case 'api_error':
        return [
          'Our AI system is temporarily unavailable.',
          ...baseActions
        ];
      
      default:
        return baseActions;
    }
  }

  /**
   * Detect conversation context from user message
   */
  private detectContext(message?: string): string {
    if (!message) return 'general';
    
    const lowerMessage = message.toLowerCase();
    
    if (this.containsWords(lowerMessage, ['price', 'cost', 'pricing', 'payment'])) {
      return 'pricing';
    }
    
    if (this.containsWords(lowerMessage, ['help', 'problem', 'issue', 'error', 'bug'])) {
      return 'support';
    }
    
    if (this.containsWords(lowerMessage, ['demo', 'trial', 'show me', 'example'])) {
      return 'demo';
    }
    
    return 'general';
  }

  /**
   * Select appropriate fallback message
   */
  private selectFallbackMessage(chatbotConfig: ChatbotConfig, context: string): string {
    // Use contextual fallback if available
    const contextualOptions = this.contextualFallbacks[context as keyof typeof this.contextualFallbacks];
    if (contextualOptions) {
      const selected = contextualOptions[Math.floor(Math.random() * contextualOptions.length)];
      return this.personalizeFallback(selected, chatbotConfig);
    }
    
    // Use generic fallback
    const selected = this.genericFallbacks[Math.floor(Math.random() * this.genericFallbacks.length)];
    return this.personalizeFallback(selected, chatbotConfig);
  }

  /**
   * Get alternative actions user can take
   */
  private getAlternativeActions(chatbotConfig: ChatbotConfig, context: string): string[] {
    const baseActions = [
      'Contact our team directly for assistance',
      'Try starting a new conversation'
    ];
    
    // Add context-specific suggestions
    if (context === 'pricing') {
      baseActions.unshift('Contact our sales team for pricing information');
    }
    
    if (context === 'support') {
      baseActions.unshift('Contact our support team for technical assistance');
    }
    
    if (context === 'demo') {
      baseActions.unshift('Request a demo through our main contact channel');
    }
    
    return baseActions;
  }

  /**
   * Personalize fallback message with chatbot info
   */
  private personalizeFallback(message: string, chatbotConfig: ChatbotConfig): string {
    let personalized = message;
    
    // Add chatbot name if available
    if (chatbotConfig.name && chatbotConfig.name !== 'Assistant') {
      personalized = `I'm ${chatbotConfig.name} and I apologize, but ${message.toLowerCase()}`;
    }
    
    return personalized;
  }

  /**
   * Check if text contains any of the given words
   */
  private containsWords(text: string, words: string[]): boolean {
    return words.some(word => text.includes(word));
  }
} 