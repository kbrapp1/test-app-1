/**
 * OpenAI Prompt Builder - 2025 Gold Standard Implementation
 * 
 * AI INSTRUCTIONS:
 * - Implements 2025 best practices for OpenAI function calling and conversation analysis
 * - Follows GPT-4.1 advanced reasoning patterns and enterprise prompt engineering
 * - Uses sophisticated persona inference and contextual awareness
 * - Includes agentic workflow patterns for autonomous conversation management
 * - Follows @golden-rule.mdc infrastructure service patterns
 */

import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { IntentClassificationContext } from '../../../../domain/services/interfaces/IIntentClassificationService';

export class OpenAIPromptBuilder {
  /**
   * Build 2025 gold standard unified processing prompt
   */
  static buildUnifiedProcessingPrompt(conversationHistory: ChatMessage[]): string {
    let prompt = `You are an expert conversational AI analyst with advanced capabilities in business intelligence, psychology, and strategic communication. You excel at understanding complex business contexts and making sophisticated decisions about lead qualification and engagement optimization.

# Core Analysis Framework

## Multi-Dimensional Intent Analysis
Classify user intent using contextual understanding, not just keywords:

**Primary Intent Categories:**
- greeting: Initial contact, relationship establishment, pleasantries
- discovery: Exploring solutions, understanding capabilities, research phase
- faq_general: General business questions, company information requests
- faq_pricing: Investment discussions, budget exploration, cost inquiries
- faq_features: Capability assessment, technical requirements, feature evaluation
- sales_inquiry: Purchase interest, solution evaluation, buying signals
- demo_request: Product demonstration, proof of concept, trial requests
- booking_request: Meeting scheduling, consultation requests, next step coordination
- support_request: Technical assistance, implementation help, troubleshooting
- qualification: Business context sharing, authority indication, timeline discussion
- objection_handling: Concerns, competitive comparison, risk assessment
- closing: Purchase readiness, contract discussion, implementation planning
- escalation_request: Human assistance needed, complex requirements, urgent issues
- unknown: Ambiguous intent requiring clarification

## Advanced Entity Extraction Framework

**Business Context Entities:**
- company: Organization name, business type, industry vertical
- teamSize: Employee count, department size, organizational scale
- industry: Business sector, market vertical, regulatory environment
- location: Geographic presence, market focus, operational regions
- role: Job title, decision authority, organizational influence
- budget: Investment capacity, budget range, financial constraints
- timeline: Implementation urgency, decision timeframe, project deadlines
- currentSolution: Existing tools, competitive landscape, switching barriers
- painPoints: Business challenges, operational inefficiencies, growth obstacles
- goals: Business objectives, success metrics, desired outcomes

**Technical & Preference Entities:**
- contactMethod: Communication preferences (email, phone, meeting, chat)
- meetingType: Interaction preference (demo, consultation, discovery, presentation)
- urgency: Business impact level (low, medium, high, critical)
- decisionProcess: Buying process, stakeholders, approval requirements
- integrationNeeds: Technical requirements, system compatibility, API needs

## Sophisticated Persona Inference

**Executive Level Analysis:**
- C-Level: Strategic focus, ROI emphasis, competitive advantage, transformation goals
- VP/Director: Operational efficiency, team productivity, measurable outcomes, scalability
- Manager: Implementation ease, adoption success, training needs, quick wins
- Individual Contributor: Feature benefits, usability, technical capabilities, daily workflow

**Authority Assessment Indicators:**
- Decision Language: "We need", "I'm looking for", "Our company requires"
- Budget Authority: Discusses investment levels, financial approval, procurement process
- Implementation Power: References team rollout, system changes, organizational impact
- Influence Signals: Mentions stakeholders, approval processes, organizational priorities

**Industry Sophistication Levels:**
- Enterprise: Complex requirements, compliance needs, integration challenges
- Mid-Market: Growth focus, efficiency optimization, competitive positioning
- Small Business: Cost sensitivity, simplicity requirements, immediate impact needs
- Startup: Scalability focus, resource constraints, rapid implementation needs

## Advanced Sentiment & Engagement Analysis

**Multi-Layered Sentiment Detection:**
- Surface Sentiment: Explicit emotional expressions, tone indicators
- Intent Sentiment: Underlying motivation, purchase readiness, decision confidence
- Relationship Sentiment: Trust building, rapport development, communication preference
- Urgency Sentiment: Time pressure, business impact, implementation timeline

**Engagement Quality Indicators:**
- Depth: Detailed responses, specific business context, technical requirements
- Progression: Question complexity evolution, information sharing increase
- Investment: Time spent, multiple interactions, stakeholder involvement
- Specificity: Concrete examples, measurable goals, detailed scenarios

## Conversation Flow Intelligence

**Autonomous Decision Framework:**
You are empowered to make sophisticated decisions about:
1. **Lead Capture Timing**: When sufficient qualification and interest align
2. **Escalation Triggers**: When human expertise adds strategic value
3. **Information Depth**: How much detail to provide based on engagement level
4. **Follow-up Coordination**: When to suggest next steps and what type
5. **Conversation Pacing**: How quickly to advance through qualification stages

**Context-Aware Response Strategy:**
- **Discovery Phase**: Focus on understanding challenges, building rapport, establishing expertise
- **Qualification Phase**: Assess authority, budget, timeline through consultative questions
- **Demonstration Phase**: Provide relevant examples, case studies, solution fit evidence
- **Closing Phase**: Facilitate contact capture, human handoff, or immediate next steps

## Lead Scoring Intelligence (API-Driven)

**Multi-Factor Scoring Framework:**
1. **Intent Quality (0-100)**: Purchase readiness, solution fit, decision timeline
2. **Entity Completeness (0-100)**: Business context depth, qualification information
3. **Persona Fit (0-100)**: Authority level, company size, industry alignment
4. **Engagement Level (0-100)**: Conversation depth, investment signals, progression

**Qualification Status Determination:**
- isQualified: Score-based assessment (≥70 typically qualifies)
- readyForSales: Qualified + contact information + demonstrated interest
- needsNurturing: Potential but requires relationship building
- notQualified: Poor fit, insufficient authority, or limited interest

## 2025 Response Excellence Standards

**Value-First Communication:**
- Lead with insights, not product features
- Ask strategic questions that demonstrate expertise
- Provide actionable advice in every interaction
- Position as trusted advisor, not vendor

**Personalization Requirements:**
- Adapt technical depth to role level and expertise
- Reference industry-specific challenges and solutions
- Connect to their expressed goals and pain points
- Use appropriate formality level for communication style

**Conversation Continuity:**
- Reference previous discussion points naturally
- Build on established rapport and context
- Acknowledge changing needs or priorities
- Maintain thread across multiple sessions`;

    // Add conversation context analysis
    if (conversationHistory.length > 0) {
      prompt += this.buildConversationContextAnalysis(conversationHistory);
    }

    prompt += `

## Advanced Reasoning Process

Before generating your response, think through these steps:

1. **Business Challenge Analysis**: What specific business problem is the user facing?
2. **Persona Assessment**: What role, authority level, and decision-making power do they have?
3. **Engagement Optimization**: How can I increase their engagement while providing immediate value?
4. **Qualification Progression**: What's the optimal next step in the qualification process?
5. **Value Delivery**: What insight or advice can I provide that demonstrates expertise?
6. **Industry Contextualization**: What industry-specific examples or trends are relevant?
7. **Conversation Strategy**: Should I continue discovery, advance to demo, capture contact info, or escalate?

## Output Requirements

You must respond using the unified function schema with complete analysis across all dimensions. Ensure your response demonstrates:
- Deep understanding of business context
- Sophisticated persona and authority assessment  
- Strategic conversation flow decisions
- Value-first communication approach
- Industry expertise and credibility
- Natural conversation progression toward business objectives

Remember: You are not just classifying intent - you are conducting sophisticated business intelligence analysis to optimize every aspect of the customer engagement experience.`;

    return prompt;
  }

  /**
   * Build conversation context analysis section
   */
  private static buildConversationContextAnalysis(conversationHistory: ChatMessage[]): string {
    const recentIntents = this.extractRecentIntents(conversationHistory);
    const sentimentProgression = this.extractSentimentProgression(conversationHistory);
    const engagementEvolution = this.extractEngagementEvolution(conversationHistory);
    const qualificationState = this.assessQualificationProgression(conversationHistory);

    return `

## Current Conversation Intelligence

**Conversation Analytics:**
- Message Count: ${conversationHistory.length} (${conversationHistory.filter(m => m.messageType === 'user').length} user messages)
- Intent Progression: ${recentIntents.join(' → ')}
- Sentiment Evolution: ${sentimentProgression.join(' → ')}
- Engagement Trajectory: ${engagementEvolution.join(' → ')}
- Qualification State: ${qualificationState}

**Conversation Momentum Indicators:**
${this.buildMomentumIndicators(conversationHistory)}

**Strategic Context:**
- User has ${this.calculateInvestmentLevel(conversationHistory)} investment in this conversation
- Conversation shows ${this.assessProgressionQuality(conversationHistory)} progression quality
- ${this.identifyOptimalNextAction(conversationHistory)}

**Behavioral Patterns:**
${this.extractBehavioralPatterns(conversationHistory).map(pattern => `- ${pattern}`).join('\n')}`;
  }

  /**
   * Build enhanced system prompt for legacy compatibility
   */
  static buildEnhancedSystemPrompt(conversationHistory: ChatMessage[]): string {
    return this.buildUnifiedProcessingPrompt(conversationHistory);
  }

  /**
   * Build system prompt for basic intent classification (legacy support)
   */
  static buildBasicSystemPrompt(context: IntentClassificationContext): string {
    return `You are an expert business conversation analyst for ${context.chatbotConfig.name || 'a business'} chatbot.

Your task is to perform comprehensive conversation analysis including:

**Intent Classification** (primary focus):
- greeting: Initial contact, relationship establishment
- discovery: Solution exploration, capability research  
- faq_general: General business questions
- faq_pricing: Investment and cost discussions
- faq_features: Capability and feature evaluation
- sales_inquiry: Purchase interest and solution evaluation
- booking_request: Meeting and consultation scheduling
- demo_request: Product demonstration requests
- support_request: Technical assistance needs
- qualification: Business context and authority sharing
- objection_handling: Concerns and competitive comparison
- closing: Purchase readiness and next step coordination
- escalation_request: Human assistance requirements
- unknown: Ambiguous intent requiring clarification

**Entity Extraction** (comprehensive):
- Business Context: company, industry, teamSize, role, location
- Decision Factors: budget, timeline, urgency, decisionProcess
- Technical Needs: currentSolution, integrationNeeds, painPoints
- Engagement Preferences: contactMethod, meetingType

**Persona Analysis** (authority and fit):
- Authority Level: decision maker, influencer, researcher, end user
- Company Fit: enterprise, mid-market, small business, startup
- Industry Sophistication: technical depth, compliance needs, complexity

Consider conversation history, user journey stage, and business context when analyzing.`;
  }

  /**
   * Extract recent intents with sophisticated pattern recognition
   */
  private static extractRecentIntents(conversationHistory: ChatMessage[]): string[] {
    return conversationHistory
      .filter(m => m.messageType === 'user')
      .slice(-5)
      .map(m => this.inferIntentFromMessage(m.content));
  }

  /**
   * Extract sentiment progression with emotional intelligence
   */
  private static extractSentimentProgression(conversationHistory: ChatMessage[]): string[] {
    return conversationHistory
      .filter(m => m.messageType === 'user')
      .slice(-3)
      .map(m => {
        const sentiment = m.contextMetadata?.sentiment || this.inferSentiment(m.content);
        return sentiment || 'neutral';
      });
  }

  /**
   * Extract engagement evolution patterns
   */
  private static extractEngagementEvolution(conversationHistory: ChatMessage[]): string[] {
    return conversationHistory
      .filter(m => m.messageType === 'user')
      .slice(-3)
      .map(m => this.assessEngagementLevel(m.content));
  }

  /**
   * Assess qualification progression state
   */
  private static assessQualificationProgression(conversationHistory: ChatMessage[]): string {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    const hasBusinessContext = userMessages.some(m => 
      /company|business|organization|team|department/i.test(m.content)
    );
    
    const hasAuthorityIndicators = userMessages.some(m =>
      /manager|director|vp|ceo|decision|budget|approve|purchase/i.test(m.content)
    );
    
    const hasBudgetDiscussion = userMessages.some(m =>
      /budget|cost|price|investment|spend|afford/i.test(m.content)
    );
    
    const hasTimelineIndicators = userMessages.some(m =>
      /asap|urgent|timeline|deadline|soon|immediately|need by/i.test(m.content)
    );

    if (hasBusinessContext && hasAuthorityIndicators && hasBudgetDiscussion && hasTimelineIndicators) {
      return 'Fully Qualified';
    } else if (hasBusinessContext && (hasAuthorityIndicators || hasBudgetDiscussion)) {
      return 'Partially Qualified';
    } else if (hasBusinessContext) {
      return 'Initial Context Gathered';
    } else {
      return 'Discovery Phase';
    }
  }

  /**
   * Build momentum indicators analysis
   */
  private static buildMomentumIndicators(conversationHistory: ChatMessage[]): string {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    const indicators = [];
    
    if (userMessages.length > 3) {
      indicators.push('Extended engagement shows genuine interest');
    }
    
    const recentMessages = userMessages.slice(-2);
    const avgLength = recentMessages.reduce((sum, m) => sum + m.content.length, 0) / recentMessages.length;
    
    if (avgLength > 100) {
      indicators.push('Detailed responses indicate high engagement');
    }
    
    const hasQuestions = recentMessages.some(m => m.content.includes('?'));
    if (hasQuestions) {
      indicators.push('Active questioning shows information-seeking behavior');
    }
    
    const hasBusinessTerms = recentMessages.some(m => 
      /solution|implement|integrate|team|company|business|organization/i.test(m.content)
    );
    if (hasBusinessTerms) {
      indicators.push('Business-focused language indicates decision-making context');
    }
    
    return indicators.length > 0 ? indicators.map(i => `- ${i}`).join('\n') : '- Building initial engagement';
  }

  /**
   * Calculate investment level in conversation
   */
  private static calculateInvestmentLevel(conversationHistory: ChatMessage[]): string {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
    const avgLength = totalLength / userMessages.length;
    
    if (userMessages.length >= 5 && avgLength > 80) {
      return 'high';
    } else if (userMessages.length >= 3 && avgLength > 50) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Assess conversation progression quality
   */
  private static assessProgressionQuality(conversationHistory: ChatMessage[]): string {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    const hasProgression = userMessages.length > 1;
    const increasingDetail = userMessages.length > 2 && 
      userMessages[userMessages.length - 1].content.length > userMessages[0].content.length;
    
    if (hasProgression && increasingDetail) {
      return 'positive';
    } else if (hasProgression) {
      return 'steady';
    } else {
      return 'early';
    }
  }

  /**
   * Identify optimal next action
   */
  private static identifyOptimalNextAction(conversationHistory: ChatMessage[]): string {
    const qualificationState = this.assessQualificationProgression(conversationHistory);
    const engagementLevel = this.calculateInvestmentLevel(conversationHistory);
    
    if (qualificationState === 'Fully Qualified' && engagementLevel === 'high') {
      return 'Prime opportunity for contact capture or demo scheduling';
    } else if (qualificationState === 'Partially Qualified') {
      return 'Continue qualification while providing value';
    } else if (engagementLevel === 'high') {
      return 'Build on high engagement to gather business context';
    } else {
      return 'Focus on value delivery and engagement building';
    }
  }

  /**
   * Extract behavioral patterns
   */
  private static extractBehavioralPatterns(conversationHistory: ChatMessage[]): string[] {
    const patterns = [];
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    if (userMessages.some(m => /how much|cost|price|budget/i.test(m.content))) {
      patterns.push('Price-conscious: Shows budget awareness and cost consideration');
    }
    
    if (userMessages.some(m => /demo|show me|see it|example/i.test(m.content))) {
      patterns.push('Visual learner: Prefers demonstrations and concrete examples');
    }
    
    if (userMessages.some(m => /integrate|api|technical|system/i.test(m.content))) {
      patterns.push('Technical focus: Interested in implementation and integration details');
    }
    
    if (userMessages.some(m => /team|company|organization|we/i.test(m.content))) {
      patterns.push('Organizational buyer: Considers team and company-wide impact');
    }
    
    if (userMessages.some(m => /urgent|asap|quickly|soon/i.test(m.content))) {
      patterns.push('Urgency-driven: Has time-sensitive requirements');
    }
    
    return patterns.length > 0 ? patterns : ['Standard information-seeking behavior'];
  }

  /**
   * Infer intent from message content using advanced pattern recognition
   */
  private static inferIntentFromMessage(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (/hello|hi|hey|good morning|good afternoon/i.test(content)) return 'greeting';
    if (/price|cost|budget|how much/i.test(content)) return 'faq_pricing';
    if (/demo|demonstration|show me|see it/i.test(content)) return 'demo_request';
    if (/meeting|schedule|book|call|appointment/i.test(content)) return 'booking_request';
    if (/feature|capability|function|how does/i.test(content)) return 'faq_features';
    if (/buy|purchase|get started|sign up/i.test(content)) return 'sales_inquiry';
    if (/help|support|problem|issue|trouble/i.test(content)) return 'support_request';
    if (/company|business|team|organization/i.test(content)) return 'qualification';
    if (/concern|worry|but|however|what if/i.test(content)) return 'objection_handling';
    
    return 'discovery';
  }

  /**
   * Infer sentiment from message content
   */
  private static inferSentiment(content: string): string {
    const positiveWords = /great|excellent|love|amazing|perfect|awesome|fantastic/i;
    const negativeWords = /problem|issue|concern|worry|frustrated|difficult|bad/i;
    
    if (positiveWords.test(content)) return 'positive';
    if (negativeWords.test(content)) return 'negative';
    return 'neutral';
  }

  /**
   * Assess engagement level from message content
   */
  private static assessEngagementLevel(content: string): string {
    if (content.length > 100 && content.includes('?')) return 'high';
    if (content.length > 50) return 'medium';
    return 'low';
  }

  /**
   * Legacy methods for backward compatibility
   */
  static buildUserPrompt(message: string, context: IntentClassificationContext): string {
    const historyContext = context.messageHistory.length > 0 
      ? `\n\nConversation history:\n${context.messageHistory.slice(-3).map(m => 
          `${m.isFromUser() ? 'User' : 'Bot'}: ${m.content}`
        ).join('\n')}`
      : '';

    return `Analyze this user message with comprehensive business intelligence: "${message}"${historyContext}

Provide structured analysis including intent classification, entity extraction, persona assessment, sentiment analysis, and strategic recommendations for conversation progression.`;
  }

  static extractBehaviorSignals(conversationHistory: ChatMessage[]): string[] {
    return this.extractBehavioralPatterns(conversationHistory);
  }

  static buildEntityExtractionPrompt(): string {
    return `Extract business entities with sophisticated context understanding:

**Business Context:** company, industry, teamSize, role, location, currentSolution
**Decision Factors:** budget, timeline, urgency, decisionProcess, authority
**Technical Requirements:** integrationNeeds, painPoints, goals, successMetrics
**Engagement Preferences:** contactMethod, meetingType, communicationStyle

Focus on implicit information and business context, not just explicit mentions.`;
  }
} 