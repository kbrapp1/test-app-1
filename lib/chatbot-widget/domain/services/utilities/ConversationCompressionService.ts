/**
 * Conversation Compression Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Compress conversation history into semantic summaries
 * - Pure domain service - no external dependencies except interfaces
 * - Follow @golden-rule patterns exactly - under 250 lines
 * - Use domain-specific error handling with BusinessRuleViolationError
 * - Delegate complex operations to specialized methods
 * - Maintain conversation context while reducing token usage
 * - Apply 2025 optimization patterns for token efficiency
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError';
import { CONTEXT_LIMITS_2025 } from '../../value-objects/ai-configuration/ContextLimits2025';

export interface CompressionResult {
  compressedSummary: string;
  retainedMessages: ChatMessage[];
  tokensSaved: number;
  compressionRatio: number;
  metadata: {
    originalMessageCount: number;
    compressedMessageCount: number;
    keyTopicsPreserved: string[];
    businessEntitiesPreserved: string[];
  };
}

export interface CompressionContext {
  maxSummaryTokens: number;
  preserveRecentCount: number;
  businessContextWeight: number;
  topicImportanceThreshold: number;
}

/**
 * Domain Service for intelligent conversation compression
 * Maintains semantic meaning while optimizing token usage
 */
export class ConversationCompressionService {
  
  /**
   * Compress older messages into semantic summary while preserving recent context
   * AI INSTRUCTIONS: Main orchestration method - delegate to specialized private methods
   */
  static compressConversationHistory(
    messages: ChatMessage[],
    context: CompressionContext = this.getDefaultCompressionContext()
  ): CompressionResult {
    this.validateCompressionInput(messages, context);
    
    if (messages.length <= context.preserveRecentCount) {
      return this.createNoCompressionResult(messages);
    }
    
    // Split messages into compression candidates and preserved messages
    const messagesToCompress = messages.slice(0, -context.preserveRecentCount);
    const messagesToPreserve = messages.slice(-context.preserveRecentCount);
    
    // Extract semantic information from messages to compress
    const semanticExtraction = this.extractSemanticInformation(messagesToCompress, context);
    
    // Generate compressed summary
    const compressedSummary = this.generateCompressedSummary(
      semanticExtraction,
      context.maxSummaryTokens
    );
    
    // Calculate compression metrics
    const compressionMetrics = this.calculateCompressionMetrics(
      messagesToCompress,
      messagesToPreserve,
      compressedSummary
    );
    
    return {
      compressedSummary,
      retainedMessages: messagesToPreserve,
      tokensSaved: compressionMetrics.tokensSaved,
      compressionRatio: compressionMetrics.compressionRatio,
      metadata: {
        originalMessageCount: messages.length,
        compressedMessageCount: messagesToPreserve.length,
        keyTopicsPreserved: semanticExtraction.keyTopics,
        businessEntitiesPreserved: semanticExtraction.businessEntities
      }
    };
  }
  
  /**
   * Extract semantic information from messages for compression
   * AI INSTRUCTIONS: Focus on business context and key conversation elements
   */
  private static extractSemanticInformation(
    messages: ChatMessage[], 
    context: CompressionContext
  ): SemanticExtraction {
    const userMessages = messages.filter(msg => msg.isFromUser());
    const botMessages = messages.filter(msg => !msg.isFromUser());
    
    return {
      keyTopics: this.extractKeyTopics(userMessages, context.topicImportanceThreshold),
      businessEntities: this.extractBusinessEntities(userMessages, context.businessContextWeight),
      conversationFlow: this.analyzeConversationFlow(messages),
      userIntents: this.extractUserIntents(userMessages),
      businessSignals: this.extractBusinessSignals(userMessages),
      engagementIndicators: this.extractEngagementIndicators(messages)
    };
  }
  
  /**
   * Generate compressed summary from semantic extraction
   * AI INSTRUCTIONS: Create concise but comprehensive summary for future context
   */
  private static generateCompressedSummary(
    extraction: SemanticExtraction,
    maxTokens: number
  ): string {
    const summaryParts: string[] = [];
    
    // Business context (highest priority)
    if (extraction.businessEntities.length > 0) {
      summaryParts.push(`Business Context: ${extraction.businessEntities.join(', ')}`);
    }
    
    // Key topics discussed
    if (extraction.keyTopics.length > 0) {
      summaryParts.push(`Topics: ${extraction.keyTopics.join(', ')}`);
    }
    
    // User intents and progression
    if (extraction.userIntents.length > 0) {
      summaryParts.push(`User Intents: ${extraction.userIntents.join(' → ')}`);
    }
    
    // Business signals for lead qualification
    if (extraction.businessSignals.length > 0) {
      summaryParts.push(`Qualification Signals: ${extraction.businessSignals.join(', ')}`);
    }
    
    // Conversation flow progression
    if (extraction.conversationFlow) {
      summaryParts.push(`Flow: ${extraction.conversationFlow}`);
    }
    
    // Engagement level
    if (extraction.engagementIndicators.length > 0) {
      summaryParts.push(`Engagement: ${extraction.engagementIndicators.join(', ')}`);
    }
    
    const fullSummary = summaryParts.join(' | ');
    
    // Truncate if exceeds token limit (rough estimation: 4 chars per token)
    const estimatedTokens = Math.ceil(fullSummary.length / 4);
    if (estimatedTokens > maxTokens) {
      const maxChars = maxTokens * 4;
      return fullSummary.substring(0, maxChars - 3) + '...';
    }
    
    return fullSummary;
  }
  
  /**
   * Extract key topics from user messages
   * AI INSTRUCTIONS: Focus on business-relevant topics using keyword analysis
   */
  private static extractKeyTopics(messages: ChatMessage[], threshold: number): string[] {
    const topicKeywords = {
      'pricing': ['price', 'cost', 'pricing', 'budget', 'expensive', 'cheap', 'afford'],
      'features': ['feature', 'functionality', 'capability', 'can it', 'does it'],
      'integration': ['integrate', 'api', 'connect', 'sync', 'import', 'export'],
      'support': ['help', 'support', 'assistance', 'training', 'onboarding'],
      'demo': ['demo', 'demonstration', 'show me', 'see it', 'preview'],
      'trial': ['trial', 'test', 'try', 'evaluate', 'pilot'],
      'timeline': ['when', 'timeline', 'schedule', 'deadline', 'urgent'],
      'team': ['team', 'users', 'people', 'staff', 'employees'],
      'security': ['secure', 'security', 'privacy', 'compliance', 'gdpr'],
      'scalability': ['scale', 'growth', 'expand', 'larger', 'enterprise']
    };
    
    const topicCounts = new Map<string, number>();
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        const matches = keywords.filter(keyword => content.includes(keyword)).length;
        if (matches > 0) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + matches);
        }
      });
    });
    
    return Array.from(topicCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 5); // Top 5 topics
  }
  
  /**
   * Extract business entities from conversation
   * AI INSTRUCTIONS: Identify business-relevant entities for lead qualification
   */
  private static extractBusinessEntities(messages: ChatMessage[], weight: number): string[] {
    const entities = new Set<string>();
    const businessPatterns = [
      /company[:\s]+([A-Za-z0-9\s&.-]+)/gi,
      /budget[:\s]+\$?([0-9,]+[KkMm]?)/gi,
      /team[:\s]+([0-9]+)/gi,
      /role[:\s]+([A-Za-z\s]+)/gi,
      /industry[:\s]+([A-Za-z\s]+)/gi,
      /timeline[:\s]+([A-Za-z0-9\s]+)/gi
    ];
    
    messages.forEach(message => {
      businessPatterns.forEach(pattern => {
        const matches = message.content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleaned = match.trim().substring(0, 50); // Limit length
            if (cleaned.length > 2) {
              entities.add(cleaned);
            }
          });
        }
      });
    });
    
    return Array.from(entities).slice(0, 8); // Limit to most important
  }
  
  /**
   * Analyze conversation flow progression
   * AI INSTRUCTIONS: Identify conversation stage and progression patterns
   */
  private static analyzeConversationFlow(messages: ChatMessage[]): string {
    const userMessages = messages.filter(msg => msg.isFromUser());
    if (userMessages.length === 0) return 'initial';
    
    const flowIndicators = {
      'discovery': ['what', 'how', 'tell me', 'explain', 'understand'],
      'evaluation': ['compare', 'vs', 'versus', 'better', 'difference'],
      'qualification': ['price', 'cost', 'team', 'budget', 'timeline'],
      'decision': ['decide', 'choose', 'select', 'go with', 'purchase'],
      'objection': ['but', 'however', 'concern', 'worry', 'problem']
    };
    
    const flowScores = new Map<string, number>();
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      Object.entries(flowIndicators).forEach(([flow, indicators]) => {
        const matches = indicators.filter(indicator => content.includes(indicator)).length;
        if (matches > 0) {
          flowScores.set(flow, (flowScores.get(flow) || 0) + matches);
        }
      });
    });
    
    if (flowScores.size === 0) return 'discovery';
    
    return Array.from(flowScores.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  /**
   * Extract user intents from messages
   * AI INSTRUCTIONS: Identify intent progression for context preservation
   */
  private static extractUserIntents(messages: ChatMessage[]): string[] {
    const intentPatterns = {
      'information_seeking': ['what is', 'how does', 'tell me about'],
      'comparison': ['compare', 'vs', 'versus', 'difference between'],
      'pricing_inquiry': ['cost', 'price', 'pricing', 'how much'],
      'demo_request': ['demo', 'show me', 'see it in action'],
      'trial_interest': ['trial', 'try it', 'test it'],
      'feature_inquiry': ['can it', 'does it', 'feature', 'capability'],
      'integration_question': ['integrate', 'connect', 'api', 'sync'],
      'support_inquiry': ['help', 'support', 'assistance']
    };
    
    const detectedIntents: string[] = [];
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      Object.entries(intentPatterns).forEach(([intent, patterns]) => {
        if (patterns.some(pattern => content.includes(pattern))) {
          if (!detectedIntents.includes(intent)) {
            detectedIntents.push(intent);
          }
        }
      });
    });
    
    return detectedIntents.slice(0, 5); // Limit to most relevant
  }
  
  /**
   * Extract business qualification signals
   * AI INSTRUCTIONS: Identify signals relevant for lead scoring and qualification
   */
  private static extractBusinessSignals(messages: ChatMessage[]): string[] {
    const signals: string[] = [];
    const signalPatterns = {
      'budget_mentioned': /budget|cost|price|\$[0-9]/i,
      'timeline_indicated': /timeline|when|deadline|soon|urgent/i,
      'authority_suggested': /decision|approve|team|manager|director|ceo/i,
      'pain_point_expressed': /problem|issue|challenge|difficult|frustrating/i,
      'solution_seeking': /solution|solve|fix|help|improve/i,
      'evaluation_active': /compare|evaluate|consider|looking at/i
    };
    
    messages.forEach(message => {
      Object.entries(signalPatterns).forEach(([signal, pattern]) => {
        if (pattern.test(message.content) && !signals.includes(signal)) {
          signals.push(signal);
        }
      });
    });
    
    return signals;
  }
  
  /**
   * Extract engagement indicators
   * AI INSTRUCTIONS: Assess conversation engagement level for context
   */
  private static extractEngagementIndicators(messages: ChatMessage[]): string[] {
    const indicators: string[] = [];
    const userMessages = messages.filter(msg => msg.isFromUser());
    
    // Message length analysis
    const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
    if (avgLength > 100) indicators.push('detailed_responses');
    if (avgLength < 20) indicators.push('brief_responses');
    
    // Question asking
    const questionCount = userMessages.filter(msg => msg.content.includes('?')).length;
    if (questionCount > 2) indicators.push('high_inquiry');
    
    // Enthusiasm markers
    const enthusiasmMarkers = ['!', 'great', 'excellent', 'perfect', 'love', 'amazing'];
    const hasEnthusiasm = userMessages.some(msg => 
      enthusiasmMarkers.some(marker => msg.content.toLowerCase().includes(marker))
    );
    if (hasEnthusiasm) indicators.push('positive_sentiment');
    
    return indicators;
  }
  
  /**
   * Calculate compression metrics
   * AI INSTRUCTIONS: Provide detailed metrics for optimization analysis
   */
  private static calculateCompressionMetrics(
    compressedMessages: ChatMessage[],
    retainedMessages: ChatMessage[],
    summary: string
  ): { tokensSaved: number; compressionRatio: number } {
    // Rough token estimation: 4 characters per token
    const originalTokens = compressedMessages.reduce(
      (sum, msg) => sum + Math.ceil(msg.content.length / 4), 0
    );
    const summaryTokens = Math.ceil(summary.length / 4);
    const retainedTokens = retainedMessages.reduce(
      (sum, msg) => sum + Math.ceil(msg.content.length / 4), 0
    );
    
    const tokensSaved = originalTokens - summaryTokens;
    const totalOriginalTokens = originalTokens + retainedTokens;
    const totalFinalTokens = summaryTokens + retainedTokens;
    const compressionRatio = totalFinalTokens / totalOriginalTokens;
    
    return { tokensSaved, compressionRatio };
  }
  
  /**
   * Validation for compression input
   * AI INSTRUCTIONS: Use domain-specific error handling
   */
  private static validateCompressionInput(messages: ChatMessage[], context: CompressionContext): void {
    if (!messages || messages.length === 0) {
      throw new BusinessRuleViolationError(
        'Cannot compress empty message history',
        { messageCount: messages?.length || 0 }
      );
    }
    
    if (context.preserveRecentCount < 1) {
      throw new BusinessRuleViolationError(
        'Must preserve at least 1 recent message',
        { preserveRecentCount: context.preserveRecentCount }
      );
    }
    
    if (context.maxSummaryTokens < 50) {
      throw new BusinessRuleViolationError(
        'Summary token limit too low for meaningful compression',
        { maxSummaryTokens: context.maxSummaryTokens }
      );
    }
  }
  
  /**
   * Create result for cases where no compression is needed
   * AI INSTRUCTIONS: Handle edge case gracefully
   */
  private static createNoCompressionResult(messages: ChatMessage[]): CompressionResult {
    return {
      compressedSummary: '',
      retainedMessages: messages,
      tokensSaved: 0,
      compressionRatio: 1.0,
      metadata: {
        originalMessageCount: messages.length,
        compressedMessageCount: messages.length,
        keyTopicsPreserved: [],
        businessEntitiesPreserved: []
      }
    };
  }
  
  /**
   * Get default compression context based on 2025 optimization limits
   * AI INSTRUCTIONS: Use CONTEXT_LIMITS_2025 for consistency
   */
  private static getDefaultCompressionContext(): CompressionContext {
    return {
      maxSummaryTokens: CONTEXT_LIMITS_2025.SUMMARY_TOKENS,
      preserveRecentCount: CONTEXT_LIMITS_2025.CRITICAL_MESSAGE_PRESERVE,
      businessContextWeight: 1.5,
      topicImportanceThreshold: 2
    };
  }
}

/**
 * Supporting interfaces for semantic extraction
 * AI INSTRUCTIONS: Keep interfaces focused and well-typed
 */
interface SemanticExtraction {
  keyTopics: string[];
  businessEntities: string[];
  conversationFlow: string;
  userIntents: string[];
  businessSignals: string[];
  engagementIndicators: string[];
} 