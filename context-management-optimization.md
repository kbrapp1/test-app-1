# Chatbot Context Management Optimization

## Overview

This document outlines the optimization changes needed for the chatbot widget's context management system based on 2025 best practices and analysis of current inefficiencies.

## Current State Analysis

### ✅ **Strengths (Keep These)**
- **Business Entity Tracking**: Excellent accumulated entities system with confidence scores
- **Entity Extraction & Merging**: Robust `EntityAccumulationService` with deduplication
- **Session Context**: Good foundation with visitor identification and journey state
- **Domain-Driven Architecture**: Clean separation of concerns

### ❌ **Issues (Need Fixing)**
- **Hardcoded Keyword Matching**: Inefficient relevance scoring using static keywords
- **Circular Logic**: Scoring AI-determined intents against hardcoded keywords
- **Over-Engineering**: Complex scoring for simple conversations (single "Hello" message)
- **Missing Conversation Intelligence**: No flow tracking, objective management, or quality metrics
- **No Context Window Management**: No summarization or compression strategy

## Phase 1: Remove Inefficient Systems

### 1.1 Remove Hardcoded Keyword Matching

**Files to Modify:**
- `lib/chatbot-widget/domain/services/utilities/ContextRelevanceService.ts`

**What to Remove:**
```typescript
// Remove these hardcoded arrays (lines 229-237)
const intentKeywords = {
  'faq_pricing': ['price', 'cost', 'pricing', 'budget', 'expensive', 'affordable'],
  'faq_features': ['feature', 'functionality', 'can it', 'does it', 'capability'],
  'demo_request': ['demo', 'show', 'see it', 'demonstration', 'preview'],
  // ... all hardcoded keyword mappings
};

// Remove complex calculateIntentAlignmentScore method
// Remove calculateEngagementScore with hardcoded enthusiasm markers
```

**Rationale:** These hardcoded keywords create false precision and miss natural language variations. The AI already determines intent accurately.

### 1.2 Simplify Early Conversation Scoring

**What to Remove:**
```typescript
// Remove complex scoring for conversations under 10 messages
// Remove entity weight calculations for empty business contexts
// Remove engagement scoring based on hardcoded "enthusiasm markers"
```

**Replace With:**
```typescript
// Simple threshold-based approach
const shouldUseRelevanceScoring = (messages: ChatMessage[]): boolean => {
  return messages.length >= 15 && 
         totalTokens > (availableTokens * 0.8);
}
```

## Phase 2: Add Essential Tracking

### 2.1 Enhanced Session Context Schema

**File:** `lib/chatbot-widget/domain/value-objects/session-management/ChatSessionTypes.ts`

**Add to SessionContext:**
```typescript
export interface SessionContext {
  // ... existing fields ...
  
  // NEW: Conversation Flow Tracking
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
  
  // NEW: Response Quality Tracking
  responseQuality?: {
    coherenceScore: number; // 0-1, how well conversation flows
    userEngagement: 'high' | 'medium' | 'low';
    lastResponseEffective: boolean;
    misunderstandingCount: number;
    topicDrift: number; // how much conversation has wandered
    lastResponseType: 'informational' | 'question' | 'action_request' | 'clarification';
  };
  
  // NEW: Context Management
  contextMetrics?: {
    totalTokensUsed: number;
    maxTokensAvailable: number;
    utilizationPercentage: number;
    compressionEvents: number;
    lastCompressionAt?: Date;
    preservedMessageIds: string[]; // critical messages never to compress
  };
  
  // NEW: User Behavioral Patterns
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
  
  // ENHANCED: Conversation Summary Management
  conversationSummary?: string | {
    fullSummary: string; // comprehensive summary of entire conversation
    phaseSummaries: Array<{
      phase: string;
      summary: string;
      keyOutcomes: string[];
      entitiesExtracted: string[];
      timeframe: { start: Date; end: Date };
    }>;
    criticalMoments: Array<{
      messageId: string;
      importance: 'high' | 'critical';
      context: string;
      preserveInContext: boolean;
    }>;
  };
}
```

### 2.2 Conversation Summarization Service

**New File:** `lib/chatbot-widget/domain/services/conversation/ConversationSummarizationService.ts`

```typescript
import { ChatMessage } from '../../value-objects/ChatMessage';
import { SessionContext } from '../../value-objects/session-management/ChatSessionTypes';

/**
 * Conversation Summarization Service
 * 
 * AI INSTRUCTIONS:
 * - Implement intelligent conversation compression when context window approaches limits
 * - Preserve business-critical information (entities, lead qualification data)
 * - Maintain conversation coherence through phase-based summarization
 * - Use AI-powered summarization, not rule-based compression
 * - Follow @golden-rule patterns for error handling and logging
 */

interface ContextMetrics {
  utilizationPercentage: number;
}

interface SummarizationConfig {
  maxTokens: number;
  preserveRecentMessages: number;
}

interface ConversationSummary {
  fullSummary: string;
  phaseSummaries: PhaseSummary[];
  criticalMoments: CriticalMoment[];
  preservedMessages: ChatMessage[];
  compressionRatio: number;
  createdAt: Date;
}

interface PhaseSummary {
  phase: string;
  summary: string;
  keyOutcomes: string[];
  entitiesExtracted: string[];
  timeframe: { start: Date; end: Date };
}

interface CriticalMoment {
  messageId: string;
  importance: 'high' | 'critical';
  context: string;
  preserveInContext: boolean;
}

interface PhaseMessageGroup {
  phase: string;
  messages: ChatMessage[];
}

export class ConversationSummarizationService {
  
  /**
   * Determine if conversation needs summarization
   */
  static shouldSummarize(
    messages: ChatMessage[], 
    contextMetrics: ContextMetrics,
    config: SummarizationConfig
  ): boolean {
    const tokenUtilization = contextMetrics.utilizationPercentage;
    const messageCount = messages.length;
    
    // Trigger summarization at 80% token utilization OR 20+ messages
    return tokenUtilization > 0.8 || messageCount > 20;
  }
  
  /**
   * Create intelligent conversation summary preserving critical information
   */
  static async summarizeConversation(
    messages: ChatMessage[],
    sessionContext: SessionContext,
    preserveLastN: number = 3
  ): Promise<ConversationSummary> {
    // Always preserve the last N messages for immediate context
    const messagesToPreserve = messages.slice(-preserveLastN);
    const messagesToSummarize = messages.slice(0, -preserveLastN);
    
    // Group messages by conversation phase
    const phaseGroups = this.groupMessagesByPhase(messagesToSummarize, sessionContext);
    
    // Create phase-specific summaries
    const phaseSummaries = await Promise.all(
      phaseGroups.map(group => this.summarizePhase(group, sessionContext))
    );
    
    // Create overall conversation summary
    const fullSummary = await this.createOverallSummary(phaseSummaries, sessionContext);
    
    // Identify critical moments to preserve
    const criticalMoments = this.identifyCriticalMoments(messages, sessionContext);
    
    return {
      fullSummary,
      phaseSummaries,
      criticalMoments,
      preservedMessages: messagesToPreserve,
      compressionRatio: this.calculateCompressionRatio(messages, fullSummary),
      createdAt: new Date()
    };
  }
  
  /**
   * Group messages by conversation phase for targeted summarization
   */
  private static groupMessagesByPhase(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): PhaseMessageGroup[] {
    // Default grouping if no phase history available
    if (!sessionContext.conversationFlow?.phaseHistory) {
      return [{
        phase: 'general',
        messages
      }];
    }
    
    const groups: PhaseMessageGroup[] = [];
    const phaseHistory = sessionContext.conversationFlow.phaseHistory;
    
    let currentGroupIndex = 0;
    
    messages.forEach(message => {
      // Determine which phase this message belongs to based on timestamp
      const messagePhase = this.determineMessagePhase(message, phaseHistory);
      
      // Create new group if phase changed
      if (groups.length === 0 || groups[groups.length - 1].phase !== messagePhase) {
        groups.push({
          phase: messagePhase,
          messages: [message]
        });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });
    
    return groups;
  }
  
  /**
   * Determine which phase a message belongs to
   */
  private static determineMessagePhase(
    message: ChatMessage,
    phaseHistory: Array<{ phase: string; startedAt: Date; }>
  ): string {
    // Find the phase that was active when this message was sent
    for (let i = phaseHistory.length - 1; i >= 0; i--) {
      if (message.timestamp >= phaseHistory[i].startedAt) {
        return phaseHistory[i].phase;
      }
    }
    
    return 'discovery'; // Default phase
  }
  
  /**
   * Summarize a specific conversation phase
   */
  private static async summarizePhase(
    phaseGroup: PhaseMessageGroup,
    sessionContext: SessionContext
  ): Promise<PhaseSummary> {
    const prompt = this.buildPhaseSummarizationPrompt(phaseGroup, sessionContext);
    
    // For now, create a simple summary
    // TODO: Integrate with actual AI service
    const summary = `Phase: ${phaseGroup.phase} - ${phaseGroup.messages.length} messages exchanged covering key business topics.`;
    
    return {
      phase: phaseGroup.phase,
      summary,
      keyOutcomes: this.extractKeyOutcomes(phaseGroup.messages),
      entitiesExtracted: this.extractPhaseEntities(phaseGroup.messages),
      timeframe: {
        start: phaseGroup.messages[0]?.timestamp || new Date(),
        end: phaseGroup.messages[phaseGroup.messages.length - 1]?.timestamp || new Date()
      }
    };
  }
  
  /**
   * Build AI prompt for phase summarization
   */
  private static buildPhaseSummarizationPrompt(
    phaseGroup: PhaseMessageGroup,
    sessionContext: SessionContext
  ): string {
    return `
You are summarizing a ${phaseGroup.phase} phase of a business conversation.

CONTEXT:
- User: ${sessionContext.visitorName || 'Visitor'} from ${sessionContext.company || 'Unknown Company'}
- Current lead score: ${sessionContext.leadScore || 0}
- Key entities: ${JSON.stringify(sessionContext.accumulatedEntities)}

CONVERSATION PHASE: ${phaseGroup.phase}
MESSAGES TO SUMMARIZE:
${phaseGroup.messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Create a concise summary that preserves:
1. Key business information discussed
2. User's main questions and concerns
3. Important decisions or commitments made
4. Any objections or obstacles identified
5. Next steps or action items

Keep the summary under 200 words while maintaining all critical business context.
    `;
  }
  
  /**
   * Create overall conversation summary
   */
  private static async createOverallSummary(
    phaseSummaries: PhaseSummary[],
    sessionContext: SessionContext
  ): Promise<string> {
    const phaseOverview = phaseSummaries.map(p => `${p.phase}: ${p.summary}`).join('\n');
    
    return `
CONVERSATION OVERVIEW:
User: ${sessionContext.visitorName || 'Visitor'} from ${sessionContext.company || 'Unknown Company'}
Lead Score: ${sessionContext.leadScore || 0}

PHASE SUMMARIES:
${phaseOverview}

KEY ENTITIES IDENTIFIED:
${JSON.stringify(sessionContext.accumulatedEntities, null, 2)}
    `;
  }
  
  /**
   * Extract key outcomes from messages
   */
  private static extractKeyOutcomes(messages: ChatMessage[]): string[] {
    const outcomes: string[] = [];
    
    messages.forEach(message => {
      // Simple keyword-based outcome detection
      const content = message.content.toLowerCase();
      
      if (content.includes('schedule') || content.includes('meeting')) {
        outcomes.push('Meeting/demo scheduling discussed');
      }
      
      if (content.includes('budget') || content.includes('price')) {
        outcomes.push('Budget/pricing information shared');
      }
      
      if (content.includes('decision') || content.includes('approve')) {
        outcomes.push('Decision-making process discussed');
      }
    });
    
    return [...new Set(outcomes)]; // Remove duplicates
  }
  
  /**
   * Extract entities mentioned in phase
   */
  private static extractPhaseEntities(messages: ChatMessage[]): string[] {
    const entities: string[] = [];
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      // Simple entity extraction
      if (content.match(/\$[\d,]+/)) {
        entities.push('budget_mentioned');
      }
      
      if (content.match(/\b\d+\s*(month|week|day)/)) {
        entities.push('timeline_mentioned');
      }
      
      if (content.includes('ceo') || content.includes('manager') || content.includes('director')) {
        entities.push('role_mentioned');
      }
    });
    
    return [...new Set(entities)];
  }
  
  /**
   * Identify critical moments that should never be compressed
   */
  private static identifyCriticalMoments(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): CriticalMoment[] {
    const criticalMoments: CriticalMoment[] = [];
    
    messages.forEach(message => {
      let importance: 'high' | 'critical' | null = null;
      let context = '';
      
      // Identify critical moments
      if (this.containsEntityExtraction(message)) {
        importance = 'high';
        context = 'Contains important business entity information';
      }
      
      if (this.containsCommitment(message)) {
        importance = 'critical';
        context = 'Contains commitment or next step agreement';
      }
      
      if (this.containsObjection(message)) {
        importance = 'high';
        context = 'Contains objection or concern that needs addressing';
      }
      
      if (this.containsDecision(message)) {
        importance = 'critical';
        context = 'Contains important decision or approval';
      }
      
      if (importance) {
        criticalMoments.push({
          messageId: message.id,
          importance,
          context,
          preserveInContext: importance === 'critical'
        });
      }
    });
    
    return criticalMoments;
  }
  
  /**
   * Check if message contains entity extraction
   */
  private static containsEntityExtraction(message: ChatMessage): boolean {
    const content = message.content.toLowerCase();
    return content.includes('budget') || 
           content.includes('company') || 
           content.includes('timeline') ||
           content.match(/\$[\d,]+/) !== null;
  }
  
  /**
   * Check if message contains commitment
   */
  private static containsCommitment(message: ChatMessage): boolean {
    const content = message.content.toLowerCase();
    return content.includes('schedule') || 
           content.includes('meeting') || 
           content.includes('follow up') ||
           content.includes('next step');
  }
  
  /**
   * Check if message contains objection
   */
  private static containsObjection(message: ChatMessage): boolean {
    const content = message.content.toLowerCase();
    return content.includes('concern') || 
           content.includes('worried') || 
           content.includes('problem') ||
           content.includes('but ');
  }
  
  /**
   * Check if message contains decision
   */
  private static containsDecision(message: ChatMessage): boolean {
    const content = message.content.toLowerCase();
    return content.includes('decide') || 
           content.includes('approve') || 
           content.includes('go ahead') ||
           content.includes('yes, let');
  }
  
  /**
   * Calculate compression ratio
   */
  private static calculateCompressionRatio(
    originalMessages: ChatMessage[],
    summary: string
  ): number {
    const originalLength = originalMessages.reduce((sum, msg) => sum + msg.content.length, 0);
    const summaryLength = summary.length;
    
    return summaryLength / originalLength;
  }
}
```

### 2.3 Context Window Monitor

**New File:** `lib/chatbot-widget/domain/services/conversation/ContextWindowMonitor.ts`

```typescript
import { ChatMessage } from '../../value-objects/ChatMessage';
import { SessionContext } from '../../value-objects/session-management/ChatSessionTypes';
import { ConversationSummarizationService } from './ConversationSummarizationService';

/**
 * Context Window Monitor
 * 
 * AI INSTRUCTIONS:
 * - Monitor token usage and trigger summarization when needed
 * - Implement intelligent context compression strategies
 * - Preserve critical business information during compression
 * - Follow @golden-rule patterns for service architecture
 */

interface ContextAssessment {
  status: 'optimal' | 'approaching_limit' | 'needs_summarization' | 'critical';
  recommendedAction: string;
  tokenCount: number;
  utilizationPercentage: number;
  tokensUntilLimit: number;
  estimatedMessagesUntilLimit: number;
}

interface ContextManagementResult {
  action: 'no_action' | 'monitoring' | 'summarized';
  updatedMessages: ChatMessage[];
  updatedContext: SessionContext;
  summary: any;
}

export class ContextWindowMonitor {
  
  private static readonly TOKEN_LIMITS = {
    MAX_CONTEXT_TOKENS: 16000,
    SUMMARIZATION_THRESHOLD: 12800, // 80% of max
    CRITICAL_THRESHOLD: 15200, // 95% of max
    PRESERVE_RECENT_MESSAGES: 3
  };
  
  /**
   * Check if context needs management
   */
  static assessContextStatus(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): ContextAssessment {
    const tokenCount = this.estimateTokenCount(messages, sessionContext);
    const utilizationPercentage = tokenCount / this.TOKEN_LIMITS.MAX_CONTEXT_TOKENS;
    
    let status: 'optimal' | 'approaching_limit' | 'needs_summarization' | 'critical';
    let recommendedAction: string;
    
    if (utilizationPercentage < 0.6) {
      status = 'optimal';
      recommendedAction = 'continue';
    } else if (utilizationPercentage < 0.8) {
      status = 'approaching_limit';
      recommendedAction = 'monitor';
    } else if (utilizationPercentage < 0.95) {
      status = 'needs_summarization';
      recommendedAction = 'summarize';
    } else {
      status = 'critical';
      recommendedAction = 'immediate_summarization';
    }
    
    return {
      status,
      recommendedAction,
      tokenCount,
      utilizationPercentage,
      tokensUntilLimit: this.TOKEN_LIMITS.MAX_CONTEXT_TOKENS - tokenCount,
      estimatedMessagesUntilLimit: Math.floor((this.TOKEN_LIMITS.MAX_CONTEXT_TOKENS - tokenCount) / 150) // ~150 tokens per message
    };
  }
  
  /**
   * Estimate token count for messages and context
   */
  private static estimateTokenCount(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): number {
    // Estimate tokens for messages (avg 150 tokens per message)
    const messageTokens = messages.length * 150;
    
    // Estimate tokens for session context
    const contextTokens = JSON.stringify(sessionContext).length / 4; // rough estimate
    
    // Add system prompt overhead (estimated 800 tokens)
    const systemPromptTokens = 800;
    
    return messageTokens + contextTokens + systemPromptTokens;
  }
  
  /**
   * Execute context management strategy
   */
  static async manageContext(
    messages: ChatMessage[],
    sessionContext: SessionContext,
    assessment: ContextAssessment
  ): Promise<ContextManagementResult> {
    switch (assessment.recommendedAction) {
      case 'summarize':
      case 'immediate_summarization':
        return await this.executeSummarization(messages, sessionContext);
        
      case 'monitor':
        return {
          action: 'monitoring',
          updatedMessages: messages,
          updatedContext: this.updateContextMetrics(sessionContext, assessment),
          summary: null
        };
        
      default:
        return {
          action: 'no_action',
          updatedMessages: messages,
          updatedContext: sessionContext,
          summary: null
        };
    }
  }
  
  /**
   * Execute conversation summarization
   */
  private static async executeSummarization(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): Promise<ContextManagementResult> {
    const summary = await ConversationSummarizationService.summarizeConversation(
      messages,
      sessionContext,
      this.TOKEN_LIMITS.PRESERVE_RECENT_MESSAGES
    );
    
    // Update session context with summary
    const updatedContext = {
      ...sessionContext,
      conversationSummary: summary,
      contextMetrics: {
        totalTokensUsed: 0,
        maxTokensAvailable: this.TOKEN_LIMITS.MAX_CONTEXT_TOKENS,
        utilizationPercentage: 0.4, // Reset after compression
        compressionEvents: (sessionContext.contextMetrics?.compressionEvents || 0) + 1,
        lastCompressionAt: new Date(),
        preservedMessageIds: []
      }
    };
    
    // Keep only recent messages plus critical moments
    const criticalMessageIds = summary.criticalMoments
      .filter(moment => moment.preserveInContext)
      .map(moment => moment.messageId);
      
    const criticalMessages = messages.filter(msg => criticalMessageIds.includes(msg.id));
    const recentMessages = summary.preservedMessages;
    const updatedMessages = [...criticalMessages, ...recentMessages];
    
    return {
      action: 'summarized',
      updatedMessages,
      updatedContext,
      summary
    };
  }
  
  /**
   * Update context metrics
   */
  private static updateContextMetrics(
    sessionContext: SessionContext,
    assessment: ContextAssessment
  ): SessionContext {
    return {
      ...sessionContext,
      contextMetrics: {
        totalTokensUsed: assessment.tokenCount,
        maxTokensAvailable: this.TOKEN_LIMITS.MAX_CONTEXT_TOKENS,
        utilizationPercentage: assessment.utilizationPercentage,
        compressionEvents: sessionContext.contextMetrics?.compressionEvents || 0,
        lastCompressionAt: sessionContext.contextMetrics?.lastCompressionAt,
        preservedMessageIds: sessionContext.contextMetrics?.preservedMessageIds || []
      }
    };
  }
}
```

## Phase 3: Simplified Relevance Service

### 3.1 Replace Complex Scoring

**File:** `lib/chatbot-widget/domain/services/utilities/ContextRelevanceService.ts`

**Key Changes:**
1. Remove hardcoded `intentKeywords` arrays
2. Remove complex `calculateIntentAlignmentScore` method
3. Remove hardcoded "enthusiasm markers"
4. Simplify to trust AI intent determination

**New Simplified Logic:**
```typescript
/**
 * Simplified message prioritization - trust AI intent, focus on business relevance
 */
static prioritizeMessages(
  messages: ChatMessage[],
  relevanceContext: RelevanceContext
): PrioritizedMessages {
  // Skip complex scoring for short conversations
  if (messages.length < 10) {
    return {
      highPriorityMessages: messages,
      mediumPriorityMessages: [],
      lowPriorityMessages: [],
      totalRelevanceScore: 1.0,
      retentionRecommendation: 'keep_all'
    };
  }
  
  // Use simplified scoring for longer conversations
  const scoredMessages = messages.map(message => ({
    message,
    score: this.calculateSimplifiedScore(message, relevanceContext, messages)
  }));
  
  // Sort by score and categorize
  scoredMessages.sort((a, b) => b.score.overallScore - a.score.overallScore);
  
  return this.categorizeByScore(scoredMessages);
}

/**
 * Simplified scoring: AI intent confidence + recency + business entities
 */
private static calculateSimplifiedScore(
  message: ChatMessage,
  context: RelevanceContext,
  allMessages: ChatMessage[]
): MessageScore {
  // Trust AI intent determination
  const intentScore = context.currentIntent.confidence;
  
  // Add recency boost
  const position = allMessages.indexOf(message);
  const recencyScore = Math.max(0.3, 1 - (position / allMessages.length));
  
  // Keep your excellent business entity relevance logic
  const entityScore = this.calculateBusinessEntityRelevance(message, context);
  
  // Simple weighted combination
  const overallScore = (intentScore * 0.5) + (recencyScore * 0.3) + (entityScore * 0.2);
  
  return {
    overallScore,
    components: {
      intentAlignment: intentScore,
      recency: recencyScore,
      entityRelevance: entityScore,
      businessContext: entityScore,
      engagement: 0.5 // Default neutral
    }
  };
}
```

## Implementation Timeline

### Week 1: Foundation Cleanup
- [ ] Remove hardcoded keyword arrays from `ContextRelevanceService`
- [ ] Implement simplified relevance scoring
- [ ] Add optional fields to `SessionContext` interface

### Week 2: Core Services
- [ ] Implement `ConversationSummarizationService`
- [ ] Implement `ContextWindowMonitor`
- [ ] Add conversation flow tracking logic

### Week 3: Integration
- [ ] Update `ConversationContextOrchestrator` with context monitoring
- [ ] Update `ChatMessageProcessingService` with flow tracking
- [ ] Add response quality assessment

### Week 4: Testing & Optimization
- [ ] Test summarization quality with real conversations
- [ ] Optimize token estimation accuracy
- [ ] Fine-tune summarization prompts
- [ ] Add comprehensive logging and monitoring

## Success Metrics

### Performance Improvements
- **40-60% reduction in token usage** through intelligent summarization
- **Faster response times** by eliminating complex keyword scoring
- **Better conversation coherence** through flow tracking

### Business Improvements
- **Higher lead qualification accuracy** through better entity tracking
- **Improved user engagement** through conversation quality monitoring
- **Better conversion rates** through objective tracking

### Technical Improvements
- **Simplified codebase** by removing 200+ lines of hardcoded keywords
- **Better scalability** through context window management
- **Enhanced debugging** through comprehensive conversation tracking

## Migration Strategy

### Backward Compatibility
- Keep existing entity tracking system (it's excellent)
- All new fields in `SessionContext` are optional
- Existing sessions continue to work without changes
- Gradual rollout with feature flags

### Data Migration
- No breaking changes to stored session data
- New tracking fields populate as conversations progress
- Existing `conversationSummary` string field enhanced to object

### Rollout Plan
1. **Development**: Feature branch with comprehensive testing
2. **Staging**: Test with sample conversations and edge cases
3. **Canary**: Deploy to 10% of traffic for validation
4. **Full Rollout**: Deploy to all traffic with monitoring

---

**This optimization transforms your chatbot from a keyword-matching system to an intelligent conversation manager that rivals ChatGPT's 2025 capabilities while preserving your excellent business entity tracking foundation.** 