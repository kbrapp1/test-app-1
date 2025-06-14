/**
 * OpenAI Rule-Based Classifier
 * 
 * Fallback service for rule-based intent classification when OpenAI API fails.
 * Single responsibility: Provide rule-based classification logic as a fallback mechanism.
 */

import { IntentType, ExtractedEntities } from '../../../../domain/value-objects/IntentResult';
import { IntentClassificationContext } from '../../../../domain/services/IIntentClassificationService';
import { ClassificationResult } from '../types/OpenAITypes';

export class OpenAIRuleBasedClassifier {
  /**
   * Perform rule-based classification with full context
   */
  static classifyWithContext(
    message: string,
    context: IntentClassificationContext
  ): ClassificationResult {
    const lowerMessage = message.toLowerCase();
    const entities: ExtractedEntities = {};

    // Extract entities
    this.extractEntitiesFromMessage(lowerMessage, entities);

    // Classify intent based on keywords and patterns
    if (this.matchesPattern(lowerMessage, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
      return {
        intent: 'greeting',
        confidence: 0.9,
        entities,
        reasoning: 'Contains greeting words',
        alternativeIntents: []
      };
    }

    if (this.matchesPattern(lowerMessage, ['price', 'cost', 'pricing', 'how much', 'expensive', 'cheap', 'budget'])) {
      return {
        intent: 'faq_pricing',
        confidence: 0.8,
        entities,
        reasoning: 'Contains pricing-related keywords',
        alternativeIntents: [{ intent: 'sales_inquiry', confidence: 0.6 }]
      };
    }

    if (this.matchesPattern(lowerMessage, ['demo', 'demonstration', 'show me', 'see it', 'trial', 'test'])) {
      return {
        intent: 'demo_request',
        confidence: 0.85,
        entities,
        reasoning: 'Requesting demonstration or trial',
        alternativeIntents: [{ intent: 'sales_inquiry', confidence: 0.7 }]
      };
    }

    if (this.matchesPattern(lowerMessage, ['buy', 'purchase', 'get started', 'sign up', 'interested in buying'])) {
      return {
        intent: 'sales_inquiry',
        confidence: 0.9,
        entities,
        reasoning: 'Shows buying intent',
        alternativeIntents: [{ intent: 'qualification', confidence: 0.6 }]
      };
    }

    if (this.matchesPattern(lowerMessage, ['schedule', 'meeting', 'call', 'appointment', 'book', 'calendar'])) {
      return {
        intent: 'booking_request',
        confidence: 0.85,
        entities,
        reasoning: 'Wants to schedule something',
        alternativeIntents: [{ intent: 'demo_request', confidence: 0.7 }]
      };
    }

    if (this.matchesPattern(lowerMessage, ['feature', 'functionality', 'capability', 'can it', 'does it', 'how does'])) {
      return {
        intent: 'faq_features',
        confidence: 0.75,
        entities,
        reasoning: 'Asking about features or capabilities',
        alternativeIntents: [{ intent: 'faq_general', confidence: 0.6 }]
      };
    }

    if (this.matchesPattern(lowerMessage, ['help', 'support', 'problem', 'issue', 'not working', 'error'])) {
      return {
        intent: 'support_request',
        confidence: 0.8,
        entities,
        reasoning: 'Needs help or support',
        alternativeIntents: [{ intent: 'faq_general', confidence: 0.5 }]
      };
    }

    // Default to unknown
    return {
      intent: 'unknown',
      confidence: 0.3,
      entities,
      reasoning: 'Could not match to any specific intent pattern',
      alternativeIntents: [{ intent: 'faq_general', confidence: 0.4 }]
    };
  }

  /**
   * Quick rule-based classification without context
   */
  static classifyQuick(message: string): ClassificationResult {
    const lowerMessage = message.toLowerCase();
    const entities: ExtractedEntities = {};

    if (this.matchesPattern(lowerMessage, ['hello', 'hi', 'hey'])) {
      return {
        intent: 'greeting',
        confidence: 0.8,
        entities,
        reasoning: 'Simple greeting detected',
        alternativeIntents: []
      };
    }

    if (this.matchesPattern(lowerMessage, ['price', 'cost', 'pricing'])) {
      return {
        intent: 'faq_pricing',
        confidence: 0.7,
        entities,
        reasoning: 'Pricing question detected',
        alternativeIntents: []
      };
    }

    return {
      intent: 'unknown',
      confidence: 0.2,
      entities,
      reasoning: 'Quick classification - insufficient context',
      alternativeIntents: []
    };
  }

  /**
   * Extract entities from message text
   */
  private static extractEntitiesFromMessage(message: string, entities: ExtractedEntities): void {
    // Budget extraction
    const budgetMatch = message.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand|million)?/i);
    if (budgetMatch) {
      entities.budget = budgetMatch[0];
    }

    // Timeline extraction
    if (message.includes('asap') || message.includes('immediately') || message.includes('urgent')) {
      entities.timeline = 'immediate';
      entities.urgency = 'high';
    } else if (message.includes('this week') || message.includes('next week')) {
      entities.timeline = 'within 2 weeks';
      entities.urgency = 'high';
    } else if (message.includes('this month') || message.includes('next month')) {
      entities.timeline = 'within 1 month';
      entities.urgency = 'medium';
    }

    // Contact method extraction
    if (message.includes('email') || message.includes('send me')) {
      entities.contactMethod = 'email';
    } else if (message.includes('call') || message.includes('phone')) {
      entities.contactMethod = 'phone';
    } else if (message.includes('meeting') || message.includes('zoom')) {
      entities.contactMethod = 'meeting';
    }
  }

  /**
   * Check if message matches any of the given patterns
   */
  private static matchesPattern(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

  /**
   * Get confidence thresholds for different intent types
   */
  static getConfidenceThreshold(intentType: string): number {
    const thresholds: Record<string, number> = {
      'sales_inquiry': 0.8,
      'demo_request': 0.8,
      'booking_request': 0.8,
      'closing': 0.9,
      'qualification': 0.7,
      'faq_pricing': 0.6,
      'faq_features': 0.6,
      'faq_general': 0.5,
      'support_request': 0.7,
      'objection_handling': 0.7,
      'greeting': 0.4,
      'unknown': 0.1
    };

    return thresholds[intentType] || 0.6;
  }
} 