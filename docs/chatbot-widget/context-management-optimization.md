# Chatbot Context Management Optimization

## Overview

This document outlines the optimization changes needed for the chatbot widget's context management system based on 2025 best practices and analysis of current inefficiencies.

**Key Discovery**: Analysis of the log showing "Average relevance score: 0.23" for a single "Hello" message revealed fundamental flaws in the current relevance scoring system. The hardcoded keyword matching creates circular logic and over-engineers simple conversations.

## Current State Analysis

### ✅ **Strengths (Keep These)**
- **Business Entity Tracking**: Excellent accumulated entities system with confidence scores
- **Entity Extraction & Merging**: Robust `EntityAccumulationService` with deduplication
- **Session Context**: Good foundation with visitor identification and journey state
- **Domain-Driven Architecture**: Clean separation of concerns

### ❌ **Issues (Need Fixing)**
- **Hardcoded Keyword Matching**: Inefficient relevance scoring using static keywords
- **Circular Logic**: Scoring AI-determined intents against hardcoded keywords  
- **Over-Engineering**: Complex scoring for simple conversations (single "Hello" message gets 0.23 score)
- **Unnecessary Complexity**: 200+ lines of hardcoded keyword arrays that miss natural language variations
- **False Precision**: Keyword matching fails when users say "walk me through your product" instead of "demo"
- **Missing Conversation Intelligence**: No flow tracking, objective management, or quality metrics
- **No Context Window Management**: No summarization or compression strategy

### 🔍 **Specific Problem Analysis**

**The "Hello" Message Problem:**
- Current system scores a single "Hello" message at 0.23 relevance
- This involves complex calculations across 5 components for a simple greeting
- The AI already correctly determines intent - keyword matching adds no value
- Resources wasted on scoring when entities and intent are already persistent across sessions

## Current System Deep Dive

### What The Current Relevance Scoring Actually Does

The `ContextRelevanceService` currently performs **5-component scoring** for every message:

1. **Recency Score**: Position-based scoring (newer = higher score)
2. **Entity Relevance**: Matches message content against business entities  
3. **Intent Alignment**: **PROBLEMATIC** - Uses hardcoded keywords to score AI-determined intent
4. **Business Context**: Scores based on lead score and accumulated entities
5. **Engagement**: **PROBLEMATIC** - Uses hardcoded "enthusiasm markers"

### The Circular Logic Problem

```typescript
// Current Flow (PROBLEMATIC):
1. AI analyzes "I'd like to see a demo" → intent: 'demo_request', confidence: 0.85
2. ContextRelevanceService scores same message against hardcoded keywords:
   ['demo', 'show', 'see it', 'demonstration', 'preview']
3. Finds 1 match ('demo') → gives intent alignment score of 0.4
4. But if user said "walk me through your product" → 0 matches → score of 0.2
5. Both are clearly demo requests, but get different scores due to keyword matching
```

### What Actually Provides Value

**✅ Keep These (They Work Well):**
- **Business Entity Tracking**: Your accumulated entities system is excellent
- **AI Intent Determination**: Already accurate with confidence scores  
- **Recency Scoring**: Simple position-based relevance
- **Session Context**: Persistent across conversation

**❌ Remove These (They Add Complexity Without Value):**
- **Keyword Matching**: Redundant with AI intent determination
- **Hardcoded Engagement Scoring**: Static enthusiasm markers miss nuance
- **Complex Scoring for Short Conversations**: Overkill for "Hello" messages

### The "Hello" Message Math (Why 0.23 Score)

**Current Calculation for Single "Hello" Message:**
```typescript
// Component Scores:
recencyScore: 1.0        // Single message = 100% recent
entityRelevance: 0.1     // No business entities in "Hello"
intentAlignment: 0.1     // No keywords match for 'unknown' intent
businessContext: 0.1     // No lead score, empty entities
engagement: 0.1          // No enthusiasm markers in "Hello"

// Weighted Combination:
overallScore = (1.0 * 0.2) + (0.1 * 0.2) + (0.1 * 0.2) + (0.1 * 0.2) + (0.1 * 0.2)
overallScore = 0.2 + 0.02 + 0.02 + 0.02 + 0.02 = 0.28

// But log shows 0.23 - likely due to different intent confidence values
```

**What This Reveals:**
- **Wasted Computation**: 5 complex calculations for a simple greeting
- **False Precision**: Scoring "Hello" to 2 decimal places is meaningless
- **Over-Engineering**: The system treats every message like a complex business inquiry

**Better Approach:**
```typescript
// For conversations < 10 messages: Skip complex scoring entirely
if (messages.length < 10) {
  return { totalRelevanceScore: 1.0, retentionRecommendation: 'keep_all' };
}
```

### What ChatGPT Actually Does (2025 Best Practice)

**ChatGPT's Approach:**
1. **No Keyword Matching**: Relies entirely on AI understanding
2. **Persistent Memory**: Stores key facts, preferences, and conversation patterns
3. **Context Summarization**: Compresses old messages while preserving key information
4. **Flow Tracking**: Monitors conversation objectives and progress
5. **Quality Assessment**: Evaluates response effectiveness and user engagement

**Key Insight**: ChatGPT doesn't score individual messages against hardcoded keywords. It trusts the AI's understanding and focuses on conversation-level intelligence.

**Your Advantage**: You already have excellent business entity tracking that ChatGPT lacks. The optimization is to remove the redundant keyword layer and add conversation intelligence.

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
  'sales_inquiry': ['buy', 'purchase', 'interested', 'pricing', 'cost'],
  'support_request': ['help', 'support', 'assistance', 'training'],
  'objection': ['concern', 'worried', 'problem', 'issue'],
  'commitment': ['schedule', 'meeting', 'follow up', 'next step']
  // ... all hardcoded keyword mappings (200+ lines total)
};

// Remove complex calculateIntentAlignmentScore method (lines 218-250)
// Remove calculateEngagementScore with hardcoded enthusiasm markers (lines 285-320)
// Remove entityWeights hardcoded object (lines 185-194)
```

**Rationale:** 
- These hardcoded keywords create false precision and miss natural language variations
- The AI already determines intent accurately with confidence scores
- Keyword matching fails for phrases like "walk me through your product" (demo request without "demo" keyword)
- Creates circular logic: AI determines intent → keyword matching scores the same intent
- 200+ lines of maintenance burden for diminishing returns

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
  conversationFlow: {
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
  responseQuality: {
    coherenceScore: number; // 0-1, how well conversation flows
    userEngagement: 'high' | 'medium' | 'low';
    lastResponseEffective: boolean;
    misunderstandingCount: number;
    topicDrift: number; // how much conversation has wandered
    lastResponseType: 'informational' | 'question' | 'action_request' | 'clarification';
  };
  
  // NEW: Context Management
  contextMetrics: {
    totalTokensUsed: number;
    maxTokensAvailable: number;
    utilizationPercentage: number;
    compressionEvents: number;
    lastCompressionAt?: Date;
    preservedMessageIds: string[]; // critical messages never to compress
  };
  
  // NEW: User Behavioral Patterns
  userBehavior: {
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
  
  // NEW: Conversation Summary Management
  conversationSummary: {
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
   * Summarize a specific conversation phase
   */
  private static async summarizePhase(
    phaseGroup: PhaseMessageGroup,
    sessionContext: SessionContext
  ): Promise<PhaseSummary> {
    const prompt = this.buildPhaseSummarizationPrompt(phaseGroup, sessionContext);
    
    // Use AI to create intelligent summary
    const summaryResponse = await OpenAIService.createChatCompletion({
      messages: [{ role: 'system', content: prompt }],
      model: 'gpt-4o-mini', // Use efficient model for summarization
      temperature: 0.1, // Low temperature for consistent summaries
      max_tokens: 500
    });
    
    return {
      phase: phaseGroup.phase,
      summary: summaryResponse.content,
      keyOutcomes: this.extractKeyOutcomes(phaseGroup.messages),
      entitiesExtracted: this.extractPhaseEntities(phaseGroup.messages),
      timeframe: {
        start: phaseGroup.messages[0].timestamp,
        end: phaseGroup.messages[phaseGroup.messages.length - 1].timestamp
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
}
```

### 2.3 Simplified Relevance Service

**File:** `lib/chatbot-widget/domain/services/utilities/ContextRelevanceService.ts`

**Replace existing complex scoring with:**
```typescript
/**
 * Simplified Context Relevance Service
 * 
 * AI INSTRUCTIONS:
 * - Remove hardcoded keyword matching
 * - Trust AI intent determination
 * - Focus on business entity relevance and recency
 * - Skip complex scoring for short conversations
 * - Implement token-based context management
 */
export class ContextRelevanceService {
  
  /**
   * Simplified message prioritization
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
   * Simplified scoring based on AI intent confidence and business relevance
   */
  private static calculateSimplifiedScore(
    message: ChatMessage,
    context: RelevanceContext,
    allMessages: ChatMessage[]
  ): MessageScore {
    // Base score on AI intent confidence (trust the AI)
    const intentScore = context.currentIntent.confidence;
    
    // Add recency boost
    const position = allMessages.indexOf(message);
    const recencyScore = Math.max(0.3, 1 - (position / allMessages.length));
    
    // Add business entity relevance
    const entityScore = this.calculateBusinessEntityRelevance(message, context);
    
    // Simple weighted combination
    const overallScore = (intentScore * 0.5) + (recencyScore * 0.3) + (entityScore * 0.2);
    
    return {
      overallScore,
      components: {
        intentAlignment: intentScore,
        recency: recencyScore,
        entityRelevance: entityScore,
        businessContext: entityScore, // Same as entity for simplicity
        engagement: 0.5 // Default neutral engagement
      }
    };
  }
  
  /**
   * Calculate business entity relevance (keep existing logic)
   */
  private static calculateBusinessEntityRelevance(
    message: ChatMessage,
    context: RelevanceContext
  ): number {
    // Keep your existing business entity relevance logic
    // This is where your domain expertise shines
    const entityWeights = {
      budget: 0.3,
      company: 0.25,
      role: 0.2,
      timeline: 0.15,
      urgency: 0.15,
      // ... rest of your business logic
    };
    
    // Your existing entity matching logic here
    return this.scoreEntityMatches(message.content, context.businessEntities, entityWeights);
  }
}
```

## Phase 3: Context Window Management

### 3.1 Context Window Monitor

**New File:** `lib/chatbot-widget/domain/services/conversation/ContextWindowMonitor.ts`

```typescript
/**
 * Context Window Monitor
 * 
 * AI INSTRUCTIONS:
 * - Monitor token usage and trigger summarization when needed
 * - Implement intelligent context compression strategies
 * - Preserve critical business information during compression
 * - Follow @golden-rule patterns for service architecture
 */
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
        ...sessionContext.contextMetrics,
        compressionEvents: (sessionContext.contextMetrics?.compressionEvents || 0) + 1,
        lastCompressionAt: new Date(),
        utilizationPercentage: 0.4 // Reset after compression
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
}
```

## Phase 4: Integration Points

### 4.1 Update ConversationContextOrchestrator

**File:** `lib/chatbot-widget/domain/services/conversation/ConversationContextOrchestrator.ts`

**Changes Needed:**
```typescript
// Add context window monitoring
const contextAssessment = ContextWindowMonitor.assessContextStatus(messages, sessionContext);

// Execute context management if needed
if (contextAssessment.recommendedAction !== 'continue') {
  const managementResult = await ContextWindowMonitor.manageContext(
    messages, 
    sessionContext, 
    contextAssessment
  );
  
  // Use managed context for further processing
  messages = managementResult.updatedMessages;
  sessionContext = managementResult.updatedContext;
}

// Use simplified relevance scoring
const prioritizedMessages = ContextRelevanceService.prioritizeMessages(messages, relevanceContext);
```

### 4.2 Update ChatMessageProcessingService

**File:** `lib/chatbot-widget/application/services/message-processing/ChatMessageProcessingService.ts`

**Add conversation flow tracking:**
```typescript
// Update conversation flow based on message analysis
const conversationFlowUpdate = this.analyzeConversationFlow(
  botMessage, 
  unifiedResult, 
  session.contextData
);

// Add to context update
const enhancedContextData = {
  // ... existing context data
  conversationFlow: conversationFlowUpdate,
  responseQuality: this.assessResponseQuality(botMessage, allMessages),
  contextMetrics: this.updateContextMetrics(session.contextData.contextMetrics)
};
```

## Implementation Tracking

### 📊 **Progress Overview**
- **Phase 1**: ✅ Complete (Cleanup & Foundation) - 1.1 ✅ | 1.2 ✅ | 1.3 ✅
- **Phase 2**: ✅ Complete (Core Services) - 2.1 ✅ | 2.2 ✅ | 2.3 ✅
- **Phase 3**: ⏳ Not Started (Integration)
- **Phase 4**: ⏳ Not Started (Testing & Optimization)

---

## Phase 1: Cleanup & Foundation ✅

### 1.1 Remove Inefficient Systems
- [x] **Remove hardcoded keyword arrays** from `ContextRelevanceService.ts`
  - [x] Remove `intentKeywords` object (lines 229-237)
  - [x] Remove `calculateIntentAlignmentScore` method (lines 218-250)
  - [x] Remove `calculateEngagementScore` method (lines 285-320)
  - [x] Remove hardcoded `entityWeights` object (lines 185-194)
  - [x] Test that removal doesn't break existing functionality

- [x] **Simplify relevance scoring logic**
  - [x] Add early return for conversations < 10 messages
  - [x] Implement simplified scoring algorithm
  - [x] Update scoring weights to focus on AI intent confidence
  - [x] Test with sample conversations

### 1.2 Enhanced Schema
- [x] **Update SessionContext interface** in `ChatSessionTypes.ts`
  - [x] Add `conversationFlow` optional field
  - [x] Add `responseQuality` optional field  
  - [x] Add `contextMetrics` optional field
  - [x] Add `userBehavior` optional field
  - [x] Enhance `conversationSummary` field structure
  - [x] Ensure backward compatibility with existing sessions

### 1.3 Testing & Validation
- [x] **Verify simplified scoring works**
  - [x] Test with "Hello" message (should get simple score)
  - [x] Test with longer conversations (should use simplified algorithm)
  - [x] Compare performance before/after optimization
  - [x] Validate no breaking changes to existing API

**Phase 1 Completion Criteria:**
- [x] All hardcoded keyword arrays removed
- [x] Simplified scoring algorithm implemented and tested
- [x] Enhanced schema added with backward compatibility
- [x] No regression in existing functionality

---

## Phase 2: Core Services ✅

### 2.1 Conversation Summarization Service
- [x] **Create ConversationSummarizationService.ts**
  - [x] Implement `generateSummary()` method (enhanced version)
  - [x] Implement `groupMessagesByPhase()` method
  - [x] Implement `extractPhaseOutcomes()` method
  - [x] Implement `identifyCriticalMoments()` method
  - [x] Implement `extractKeyEntities()` method
  - [x] Add comprehensive error handling with domain-specific errors
  - [x] Add AI instruction comments following @golden-rule patterns

- [x] **Create supporting interfaces and types**
  - [x] Define `SummarizationContext` interface
  - [x] Define `EnhancedConversationSummary` interface
  - [x] Define `CriticalMoment` interface
  - [x] Define `MessageGroup` interface
  - [x] Add to domain types exports

### 2.2 Context Window Monitor
- [x] **Create ContextWindowMonitor.ts**
  - [x] Implement `calculateMetrics()` method
  - [x] Implement `getTokenBreakdown()` method
  - [x] Implement `assessCompressionNeed()` method
  - [x] Implement `validateContextWindow()` method
  - [x] Add token calculation logic with component breakdown
  - [x] Add comprehensive logging and monitoring

- [x] **Create supporting interfaces**
  - [x] Define `ContextMetrics` interface
  - [x] Define `TokenBreakdown` interface
  - [x] Define `CompressionRecommendation` interface
  - [x] Add business rule validation with domain errors

### 2.3 Testing Core Services
- [x] **Unit tests for ConversationSummarizationService**
  - [x] Test comprehensive summary generation with phase detection
  - [x] Test critical moment identification when enabled/disabled
  - [x] Test empty messages handling with graceful fallbacks
  - [x] Test business rule validation with proper error throwing
  - [x] Test entity extraction from conversation context

- [x] **Unit tests for ContextWindowMonitor**
  - [x] Test accurate token metrics calculation across different limits
  - [x] Test detailed token breakdown analysis
  - [x] Test compression need assessment with intelligent recommendations
  - [x] Test context window validation with proper error handling
  - [x] Test input validation with domain-specific error types

- [x] **Integration tests**
  - [x] Test service interoperability with consistent token estimates
  - [x] Test enhanced conversationSummary format handling
  - [x] Test realistic conversation scenarios with actual ChatMessage entities

**Phase 2 Completion Criteria:**
- [x] Both core services implemented and tested (15/15 tests passing)
- [x] All interfaces and types properly defined following @golden-rule patterns
- [x] Unit tests passing with comprehensive coverage
- [x] Services ready for integration with domain-driven architecture

---

## Phase 3: Integration ✅

### 3.1 Enhanced Context Orchestrator
- [x] **Update ConversationContextOrchestrator.ts**
  - [x] Integrate ConversationSummarizationService for intelligent compression
  - [x] Integrate ContextWindowMonitor for real-time assessment
  - [x] Add enhanced `getMessagesForContextWindowEnhanced()` method
  - [x] Implement smart compression decision logic
  - [x] Add comprehensive logging for Phase 2 intelligence

### 3.2 Application Service Integration
- [x] **Update ConversationContextManagementService.ts**
  - [x] Use enhanced orchestrator methods by default
  - [x] Add session update methods for enhanced summary format
  - [x] Integrate Phase 2 services into existing workflow
  - [x] Handle backward compatibility gracefully

### 3.3 Session Management Enhancement
- [x] **Update ChatSession.ts**
  - [x] Add enhanced conversation summary update methods
  - [x] Support both string and enhanced summary formats
  - [x] Maintain backward compatibility for existing sessions

### 3.4 Comprehensive Integration Testing
- [x] **Phase 3 Integration Test Suite** (11/11 tests passing)
  - [x] ConversationContextOrchestrator Enhanced Integration (2 tests)
  - [x] ConversationContextManagementService Integration (2 tests)
  - [x] ConversationSummarizationService Integration (2 tests)
  - [x] ContextWindowMonitor Integration (3 tests)
  - [x] ChatSession Enhanced Summary Integration (1 test)
  - [x] End-to-End Integration Flow (1 test)

**Phase 3 Completion Criteria:**
- [x] All integration points working with Phase 2 services
- [x] Enhanced context orchestrator fully integrated
- [x] Session management supports enhanced format
- [x] Comprehensive integration tests passing (11/11 tests)
- [x] Zero breaking changes to existing functionality