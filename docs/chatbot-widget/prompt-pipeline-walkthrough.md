# Chatbot Widget: Prompt Pipeline Walkthrough June 16th 2025

## Overview

This document walks through the complete prompt pipeline workflow for the chatbot widget's two-phase OpenAI API approach, from user input to final response.

**Important**: This walkthrough reflects the **actual implementation** in the codebase, which uses domain-driven design patterns with AI-enhanced decision making rather than hardcoded business logic.

**Intent Types**: The system uses a **predefined, hardcoded set of 12 intent types** defined in `DomainConstants.ts` and enforced through OpenAI function calling schemas. The AI cannot create new intent types - it must select from this controlled vocabulary to ensure consistency and enable proper business rule application.

## Phase 0: Input Processing & Context Building

### User Input
```
User: "Hey, I'm looking for a marketing automation solution for my team of about 50 people. What are your pricing options?"
```

### Context Preparation
- **Session Retrieval**: Get conversation history, user journey stage, previous intents
- **Entity Accumulation Loading**: Retrieve accumulated entities from previous conversation turns
- **Configuration Loading**: Load chatbot personality, business context, industry specifics
- **Knowledge Context**: Identify if this relates to any FAQ/knowledge base content
- **Client Info**: Browser, location, time on site, referral source

### Entity Accumulation Context
Before processing the current message, the system loads previously accumulated entities:
```typescript
// Retrieved from session.contextData.accumulatedEntities
const existingEntities = {
  decisionMakers: ["Sarah (VP Marketing)", "John (IT Director)"],
  painPoints: ["manual lead nurturing", "disconnected systems"],
  integrationNeeds: ["Salesforce", "HubSpot"],
  company: { value: "TechCorp", confidence: 0.9, extractedAt: "2024-12-17T10:30:00Z" },
  industry: { value: "SaaS", confidence: 0.8, extractedAt: "2024-12-17T10:25:00Z" },
  teamSize: { value: "50", confidence: 0.95, extractedAt: "2024-12-17T10:32:00Z" }
}
```

---

## Phase 1: Intent Classification & Entity Extraction

### Objective
Get structured understanding of what the user wants:
- Classify intent with high confidence
- Extract business entities (budget, timeline, company size, etc.)
- **Accumulate entities across conversation turns (NEW)**
- **Apply entity corrections when needed (NEW)**
- Infer user persona (role, industry, decision-making authority)
- Detect ambiguity requiring clarification

### Prompt Construction

#### System Prompt (Actual OpenAIPromptBuilder Implementation)
```
You are an expert intent classifier and persona analyzer for a business chatbot.

CORE RESPONSIBILITIES:
1. Classify user intent with high accuracy
2. Extract relevant business entities
3. Infer user persona (role, industry, company size)
4. Detect ambiguous cases requiring clarification
5. Provide reasoning for all decisions

INTENT CLASSIFICATION GUIDELINES: (Intent classifications are hard coded/configured. )
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

ENTITY EXTRACTION & ACCUMULATION (Mixed Approach - Hardcoded Enums + Free-Form):

CONTROLLED VOCABULARY (Entities are hard coded/configured. Enums are hardcoded choices for the AI api to choose from):
- urgency: ["low", "medium", "high"] 
- contactMethod: ["email", "phone", "meeting"]
- eventType: ["demo", "consultation", "onboarding", "support_call", "sales_call"]
- issueType: ["technical", "billing", "feature_request", "bug_report", "general"]
- severity: ["low", "medium", "high", "critical"]

FREE-FORM TEXT EXTRACTION: (Entities are hard coded/configured. Enums are derived from AI api)
- budget: Any monetary amounts or budget ranges (e.g., "$50K", "tight budget")
- timeline: Urgency indicators, deadlines, timeframes (e.g., "next quarter", "ASAP")
- company: Organization details, company names (e.g., "Acme Corp", "small startup")
- teamSize: Team or company size mentioned (e.g., "50 people", "enterprise-level")
- industry: Business sector or vertical (e.g., "SaaS", "healthcare startup")
- role: Job titles, responsibilities mentioned (e.g., "VP of Sales", "founder")
- location: Geographic location mentioned
- productName: Specific products mentioned
- featureName: Specific features mentioned
- currentSolution: Current tools they're using

ENTITY ACCUMULATION STRATEGIES (NEW):
**Additive Entities** (accumulate unique values over time):
- integrationNeeds: Integration requirements mentioned
- painPoints: Problems or challenges mentioned
- decisionMakers: Other people involved in decisions
- evaluationCriteria: Factors important in their evaluation

**Replaceable Entities** (keep latest value):
- budget: Replace with newest budget information
- timeline: Replace with most recent timeline
- urgency: Replace with current urgency level
- contactMethod: Replace with preferred contact method

**Confidence-Based Entities** (keep highest confidence value):
- role: Keep most confident job title extraction
- industry: Keep most confident industry classification
- company: Keep most confident company identification
- teamSize: Keep most confident team size mention

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

CONVERSATION CONTEXT:
- Recent intents: visitor → curious → interested
- Conversation length: 3 messages
- Look for intent progression patterns and context switches

ENTITY ACCUMULATION CONTEXT:
- Previously extracted entities are provided for context and correction
- Apply entity corrections if user provides contradictory information
- Merge new entities with existing using appropriate accumulation strategy
- Include entity confidence scores and extraction timestamps
```

#### User Prompt
```
Classify this user message: "Hey, I'm looking for a marketing automation solution for my team of about 50 people. What are your pricing options?"

Conversation history:
User: "Hi there"
Bot: "Hello! How can I help you today?"
User: "I've been reading about your platform"
Bot: "Great! What would you like to know more about?"

Previously accumulated entities:
- Decision makers: Sarah (VP Marketing), John (IT Director)
- Pain points: manual lead nurturing, disconnected systems
- Integration needs: Salesforce, HubSpot
- Industry: SaaS (confidence: 0.8, extracted 5 minutes ago)

Use the classify_intent_and_persona function to respond, and apply entity corrections if needed.
```

### Enhanced Function Schema with Entity Accumulation (OpenAIFunctionSchemaBuilder)
```json
{
  "name": "classify_intent_and_persona",
  "description": "Classify user intent, extract entities with accumulation, and infer persona information",
  "parameters": {
    "type": "object",
    "properties": {
      "primaryIntent": {
        "type": "string",
        "enum": [
          "greeting", "faq_general", "faq_pricing", "faq_features",
          "sales_inquiry", "booking_request", "demo_request", "support_request",
          "objection_handling", "qualification", "closing", "unknown"
        ],
        "description": "The most likely intent of the user's message"
      },
      "primaryConfidence": {
        "type": "number",
        "minimum": 0,
        "maximum": 1,
        "description": "Confidence score for the primary intent"
      },
      "alternativeIntents": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "intent": { "type": "string", "enum": [...] },
            "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
            "reasoning": { "type": "string" }
          }
        },
        "description": "Alternative intent possibilities with confidence scores"
      },
      "entities": {
        "type": "object",
        "properties": {
          // Free-form text entities
          "budget": { "type": "string", "description": "Budget information mentioned" },
          "timeline": { "type": "string", "description": "Timeline or urgency mentioned" },
          "company": { "type": "string", "description": "Company name or description" },
          "teamSize": { "type": "string", "description": "Team or company size mentioned" },
          "industry": { "type": "string", "description": "Industry or business type" },
          "role": { "type": "string", "description": "User's job title or role" },
          "location": { "type": "string", "description": "Geographic location mentioned" },
          "productName": { "type": "string", "description": "Specific product mentioned" },
          "featureName": { "type": "string", "description": "Specific feature mentioned" },
          "currentSolution": { "type": "string", "description": "Current solution they're using" },
          "affectedFeature": { "type": "string", "description": "Feature experiencing issues" },
          
          // Hardcoded enum entities
          "urgency": { "type": "string", "enum": ["low", "medium", "high"] },
          "contactMethod": { "type": "string", "enum": ["email", "phone", "meeting"] },
          "eventType": { "type": "string", "enum": ["demo", "consultation", "onboarding", "support_call", "sales_call"] },
          "issueType": { "type": "string", "enum": ["technical", "billing", "feature_request", "bug_report", "general"] },
          "severity": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
          
          // Array entities
          "integrationNeeds": { "type": "array", "items": { "type": "string" } },
          "painPoints": { "type": "array", "items": { "type": "string" } },
          "decisionMakers": { "type": "array", "items": { "type": "string" } },
          "evaluationCriteria": { "type": "array", "items": { "type": "string" } }
        }
      },
      "entityCorrections": {
        "type": "object",
        "description": "Corrections to previously extracted entities (NEW)",
        "properties": {
          "removedDecisionMakers": { "type": "array", "items": { "type": "string" } },
          "removedPainPoints": { "type": "array", "items": { "type": "string" } },
          "removedIntegrationNeeds": { "type": "array", "items": { "type": "string" } },
          "removedEvaluationCriteria": { "type": "array", "items": { "type": "string" } },
          "correctedBudget": { "type": "string", "description": "Corrected budget information" },
          "correctedTimeline": { "type": "string", "description": "Corrected timeline information" },
          "correctedCompany": { "type": "string", "description": "Corrected company information" },
          "correctedRole": { "type": "string", "description": "Corrected role information" },
          "totalCorrections": { "type": "number", "description": "Total number of corrections applied" }
        }
      },
      "personaInference": {
        "type": "object",
        "properties": {
          "role": { 
            "type": "string", 
            "enum": [
              "ceo", "cto", "cfo", "vp_sales", "vp_marketing", "vp_operations",
              "sales_manager", "marketing_manager", "operations_manager",
              "sales_rep", "marketing_specialist", "it_admin", "developer",
              "consultant", "analyst", "coordinator", "assistant",
              "founder", "owner", "director", "manager", "individual_contributor", "unknown"
            ]
          },
          "industry": { 
            "type": "string", 
            "enum": [
              "technology", "healthcare", "finance", "education", "retail",
              "manufacturing", "real_estate", "consulting", "legal", "marketing",
              "non_profit", "government", "automotive", "energy", "media",
              "hospitality", "construction", "agriculture", "transportation",
              "telecommunications", "unknown"
            ]
          },
          "companySize": { "type": "string", "enum": ["startup", "small", "medium", "large", "enterprise"] },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "evidence": { "type": "array", "items": { "type": "string" } }
        }
      },
      "disambiguationContext": {
        "type": "object",
        "properties": {
          "isAmbiguous": { "type": "boolean" },
          "contextualClues": { "type": "array", "items": { "type": "string" } },
          "suggestedClarifications": { "type": "array", "items": { "type": "string" } }
        }
      },
      "reasoning": {
        "type": "string",
        "description": "Explanation of the classification decision"
      }
    },
    "required": ["primaryIntent", "primaryConfidence", "entities", "reasoning"]
  }
}
```

### API Call Configuration (Actual Implementation)
- **Model**: GPT-4o-mini (default per user preference)
- **Temperature**: 0.3 (balanced for consistency + flexibility)
- **Max Tokens**: 500 (fixed for intent classification)
- **Function Calling**: Required schema with `classify_intent_and_persona`

### Expected Result with Entity Accumulation (Actual Structure)
```json
{
  "primaryIntent": "faq_pricing",
  "primaryConfidence": 0.92,
  "alternativeIntents": [
    {
      "intent": "sales_inquiry",
      "confidence": 0.65,
      "reasoning": "Budget inquiry suggests buying intent"
    }
  ],
  "entities": {
    "teamSize": "50",
    "industry": "SaaS",
    "role": "manager",
    "urgency": "medium",
    "budget": "unknown",
    "timeline": "unknown",
    "decisionMakers": ["Sarah (VP Marketing)", "John (IT Director)"],
    "painPoints": ["manual lead nurturing", "disconnected systems"],
    "integrationNeeds": ["Salesforce", "HubSpot"]
  },
  "entityCorrections": {
    "removedDecisionMakers": [],
    "removedPainPoints": [],
    "correctedCompany": "TechCorp (50 people)",
    "totalCorrections": 1
  },
  "personaInference": {
    "role": "manager",
    "industry": "technology",
    "companySize": "medium",
    "confidence": 0.90,
    "evidence": ["mentions team of 50 people", "asking about pricing", "SaaS industry context"]
  },
  "disambiguationContext": {
    "isAmbiguous": false,
    "contextualClues": ["team size mentioned", "pricing focus", "accumulated context"],
    "suggestedClarifications": []
  },
  "reasoning": "User explicitly asking about pricing for team of 50, confirming manager role and medium company size. Previous context shows SaaS industry and existing integration needs."
}
```

---

## Phase 2: Business Logic & Decision Making

### Intent Analysis & Context Evaluation
The system analyzes the Phase 1 results using domain services:

- **Intent Processing**: `IntentClassificationResult` evaluated for confidence thresholds
- **Entity Accumulation Processing **: `EntityAccumulationApplicationService` merges new entities with existing ones
- **Entity Corrections Handling **: Apply user corrections to previously extracted entities
- **Lead Scoring**: `LeadScoreCalculationService` processes accumulated entities (enhanced scoring)
- **Journey Assessment**: User progression tracked through conversation context
- **Persona Analysis**: Role and company size influence response strategy (enhanced with accumulated data)

### Dynamic Response Strategy Selection

**Implementation**: The business logic is **NOT hardcoded as IF/ELSE statements**. Instead, it uses:

#### 1. **Configurable Thresholds (DomainConstants)**
```typescript
// From DomainConstants.ts - Actual Implementation
export const LEAD_SCORING_RULES = {
  budget: 25,
  timeline: 20, 
  company: 15,
  industry: 10,
  teamSize: 15,
  urgency: 10,
  contactMethod: 5,
  role: 10
} as const;

export const DEFAULT_THRESHOLDS = {
  intentConfidence: 0.7,
  stageTransition: 0.75,
  personaInference: 0.6,
  leadQualification: 70,
  responseTime: 2000,
  contextWindow: 12000,
  maxConversationTurns: 20,
  inactivityTimeout: 300
} as const;

export const INTENT_TYPES = [
  'greeting', 'faq_general', 'faq_pricing', 'faq_features',
  'sales_inquiry', 'booking_request', 'demo_request', 'support_request',
  'objection_handling', 'qualification', 'closing', 'unknown'
] as const;

// Entity organization
export const CORE_BUSINESS_ENTITIES = [
  'budget', 'timeline', 'company', 'industry', 'teamSize', 'location',
  'urgency', 'contactMethod', 'preferredTime', 'timezone', 'availability', 'role'
] as const;

export const ADVANCED_ENTITIES = [
  'eventType', 'productName', 'featureName', 'integrationNeeds',
  'issueType', 'severity', 'affectedFeature', 'currentSolution',
  'painPoints', 'decisionMakers'
] as const;

// Hardcoded enum values
export const URGENCY_LEVELS = ['low', 'medium', 'high'] as const;
export const CONTACT_METHODS = ['email', 'phone', 'meeting'] as const;
export const EVENT_TYPES = ['demo', 'consultation', 'onboarding', 'support_call', 'sales_call'] as const;
```

#### 2. **AI-Driven Decision Making via Enhanced Prompts**
The system builds dynamic prompts that include business context:

```typescript
// Strategy determined by prompt engineering, not hardcoded logic
const systemPrompt = `
RESPONSE STRATEGY based on analysis:
- Intent: ${intent} (confidence: ${confidence})
- User Profile: ${persona.role}, ${entities.teamSize} people
- Lead Score: ${leadScore}/100
- Journey Stage: ${journeyStage}

BUSINESS RULES:
- Team size 50+ = Enterprise messaging focus
- High confidence pricing intent = Direct pricing discussion
- Medium lead score = Balance info with qualification
`;
```

#### 3. **Domain Service Coordination**
```typescript
// Enhanced ChatMessageProcessingService coordinates business logic
const entityAccumulationResult = await this.entityAccumulationService.accumulateEntities({
  sessionId,
  userMessage,
  messageHistory,
  messageId
});

const leadScore = await this.leadScoringService.calculateScore(
  entityAccumulationResult.accumulatedEntities
);

const responseStrategy = await this.responseStrategyService.determineStrategy({
  intent,
  confidence,
  leadScore,
  journeyStage,
  accumulatedEntities: entityAccumulationResult.accumulatedEntities
});
```

### Knowledge Retrieval & Context Assembly
- **FAQ Integration**: Relevant pricing content retrieved based on intent classification
- **Dynamic Context**: Business rules applied through prompt construction
- **Template Selection**: Response templates chosen based on calculated strategy

---

## Phase 3: Response Generation

### Objective
Generate personalized, contextual response using AI-driven strategy from Phase 2

### Dynamic System Prompt Construction

**Implementation**: The system prompt is dynamically built using the `OpenAIPromptBuilder` service:

```typescript
// Actual implementation from OpenAIPromptBuilder.ts
const systemPrompt = this.promptBuilder.buildResponsePrompt({
  intent: classificationResult.intent,
  confidence: classificationResult.confidence,
  entities: classificationResult.entities,
  persona: classificationResult.persona,
  conversationContext: session.context,
  businessContext: config.businessContext,
  responseStrategy: determinedStrategy
});
```

### Example Generated System Prompt
```
You are a helpful sales assistant for [Company Name].

ANALYSIS RESULTS:
- Intent: faq_pricing (confidence: 0.92)
- User Profile: Team manager, ~50 people company
- Lead Score: 78/100 (qualified, enhanced with accumulated entities)
- Journey Stage: evaluating
- Response Strategy: enterprise_focused

ACCUMULATED ENTITY CONTEXT (NEW):
- Decision makers: Sarah (VP Marketing), John (IT Director)
- Pain points: manual lead nurturing, disconnected systems
- Integration needs: Salesforce, HubSpot
- Industry: SaaS (confidence: 0.8)
- Company: TechCorp (confidence: 0.9)
- Team size: 50 (confidence: 0.95)

DYNAMIC BUSINESS RULES:
- Team size 50+ detected → Focus on enterprise value
- High pricing intent confidence → Direct pricing discussion appropriate
- Medium-high lead score → Balance information with gentle qualification

CONVERSATION CONTEXT:
- Messages: 4 total
- Previous topics: General platform interest
- User progression: visitor → curious → interested → evaluating

PERSONALIZATION INSTRUCTIONS:
- Acknowledge team size (50 people) and TechCorp context
- Reference accumulated context: Salesforce/HubSpot integration needs
- Address identified pain points: manual lead nurturing, disconnected systems
- Use enterprise/team-focused language for SaaS industry
- Suggest logical next step based on evaluation stage
- Maintain consultative (not pushy) tone

RESPONSE OPTIMIZATION:
- Primary goal: Answer pricing question helpfully
- Secondary goal: Gentle qualification (timeline, decision process)
- Tertiary goal: Guide toward demo/consultation if natural
```

### Message History Injection
```
Previous conversation:
[User: "Hi there"]
[Bot: "Hello! How can I help you today?"]  
[User: "I've been reading about your platform"]
[Bot: "Great! What would you like to know more about?"]
[User: "Hey, I'm looking for a marketing automation solution for my team of about 50 people. What are your pricing options?"]

INTENT ANALYSIS: faq_pricing, team_manager persona, 50-person team
```

### API Call Configuration (Phase 2 - Response Generation)
- **Model**: GPT-4o-mini (default, configurable per user preference)
- **Temperature**: 0.7 (configurable, default for creativity)
- **Max Tokens**: 1000 (configurable, default for full responses)
- **No Function Calling**: Pure text generation with dynamic system prompt

### Enhanced Generated Response (with Entity Accumulation)
```
Great question! For TechCorp's team of 50 people, you'd be looking at our Professional or Enterprise tier, which are designed specifically for growing SaaS companies like yours.

Since I know you're currently working with Salesforce and HubSpot, and Sarah and John are involved in the evaluation, I can tailor this to your specific integration needs:

**Professional Plan** (20-100 users):
- Advanced automation workflows (addressing your manual lead nurturing challenges)
- Native Salesforce and HubSpot integrations (solving the disconnected systems issue)
- Team collaboration features for Sarah's marketing team and John's IT requirements
- Priority support
- Typically ranges $X-Y per user/month

**Enterprise Plan** (50+ users):
- Everything in Professional
- Advanced analytics and reporting
- Custom integrations beyond Salesforce/HubSpot
- Dedicated account management (perfect for your team size)
- Custom pricing based on your SaaS company requirements

Given your current pain points with manual processes and system disconnection, our Enterprise plan would likely be the best fit. It includes pre-built connectors for both Salesforce and HubSpot, plus automation workflows that eliminate manual lead nurturing.

Would you like me to set up a demo specifically focused on the Salesforce/HubSpot integration workflow? I can show both Sarah and John exactly how it would streamline your current processes. We can usually schedule that within 24 hours.
```

---

## Phase 4: Response Enhancement & Metadata

### Enhanced Lead Scoring with Accumulated Entities (LeadScoreCalculationService)

**Implementation**: Uses domain service with accumulated entities for enhanced scoring:

```typescript
// Enhanced scoring logic with accumulated entities
const score = await this.leadScoringService.calculateScore({
  // Current message entities
  teamSize: 50,        // +20 points (medium company)
  intent: 'faq_pricing', // +25 points (high-value intent)
  role: 'manager',     // +15 points (decision influence)
  urgency: 'medium',   // +10 points
  
  // Accumulated entities from previous conversations (NEW)
  industry: 'SaaS',    // +12 points (known industry)
  company: 'TechCorp', // +8 points (identified company)
  decisionMakers: ['Sarah (VP Marketing)', 'John (IT Director)'], // +10 points (multiple stakeholders)
  painPoints: ['manual lead nurturing', 'disconnected systems'], // +8 points (clear pain points)
  integrationNeeds: ['Salesforce', 'HubSpot'], // +6 points (specific integrations)
  
  // Entity confidence and recency boost
  entityRichness: 0.85, // +5 points (high accumulated data confidence)
  conversationDepth: 4  // +3 points (4+ message conversation)
});
// Total: 122/150 (highly qualified lead, enhanced scoring model)
```

### Journey Stage Update (ConversationContextWindow)
- **Tracking**: Maintained in session context with confidence scores
- **Progression**: `visitor → curious → interested → evaluating`
- **Confidence**: Calculated based on intent patterns and message analysis
- **Sales Readiness**: Determined by lead score + journey stage combination

### Next Actions (Generated by ResponseStrategy)
- Actions suggested based on lead score and intent confidence
- Template-driven suggestions, not hardcoded lists
- Dynamically prioritized based on business rules

### Enhanced Debug Information with Entity Accumulation (Actual Implementation)
```json
{
  "phase1": {
    "model": "gpt-4o-mini",
    "processingTime": "245ms",
    "tokensUsed": 456,
    "primaryIntent": "faq_pricing",
    "primaryConfidence": 0.92,
    "alternativeIntents": [{"intent": "sales_inquiry", "confidence": 0.65}],
    "functionCall": "classify_intent_and_persona",
    "temperature": 0.3,
    "maxTokens": 500
  },
  "entityAccumulation": {
    "processingTime": "180ms",
    "existingEntitiesLoaded": true,
    "newEntitiesExtracted": 3,
    "correctionsApplied": 1,
    "totalAccumulatedEntities": 12,
    "accumulationStrategy": {
      "additive": 2,
      "replaceable": 1,
      "confidenceBased": 0
    },
    "entityContextPromptLength": 340
  },
  "phase2": {
    "model": "gpt-4o-mini",
    "processingTime": "680ms", 
    "tokensUsed": 1342,
    "responseStrategy": "enterprise_focused_with_accumulated_context",
    "personalizationLevel": "very_high",
    "temperature": 0.7,
    "maxTokens": 1000
  },
  "businessLogic": {
    "leadScore": 122,
    "enhancedScoring": true,
    "entities": {
      "current": {"teamSize": "50", "role": "manager", "urgency": "medium"},
      "accumulated": {
        "decisionMakers": ["Sarah (VP Marketing)", "John (IT Director)"],
        "painPoints": ["manual lead nurturing", "disconnected systems"],
        "integrationNeeds": ["Salesforce", "HubSpot"],
        "industry": {"value": "SaaS", "confidence": 0.8},
        "company": {"value": "TechCorp", "confidence": 0.9}
      }
    },
    "personaInference": {"role": "manager", "industry": "technology", "companySize": "medium", "confidence": 0.90},
    "journeyProgression": "interested → evaluating",
    "shouldCaptureLeadInfo": true,
    "configuredThresholds": {"intentConfidence": 0.7, "leadQualification": 70}
  },
  "performance": {
    "totalProcessingTime": "1105ms",
    "totalTokens": 1798,
    "estimatedCost": "$0.000975",
    "responseTimeThreshold": 2000,
    "entityAccumulationOverhead": "180ms"
  }
}
```

---

## Phase 5: Final Response Assembly

### Enhanced Response Package with Entity Accumulation
```json
{
  "botResponse": "[Enhanced personalized response with accumulated context]",
  "shouldCaptureLeadInfo": true,
  "suggestedNextActions": [
    "Schedule Salesforce/HubSpot integration demo for Sarah and John",
    "Send enterprise pricing guide for 50-person SaaS teams",
    "Follow up on timeline for addressing manual lead nurturing"
  ],
  "conversationMetrics": {
    "leadScore": 122,
    "enhancedLeadScore": true,
    "journeyStage": "evaluating",
    "intentConfidence": 0.92,
    "entityRichness": 0.85,
    "accumulatedEntityCount": 12
  },
  "entityAccumulationResult": {
    "newEntitiesAdded": 3,
    "correctionsApplied": 1,
    "totalAccumulatedEntities": 12,
    "contextPrompt": "[Rich entity context for future messages]"
  },
  "debugInfo": "[Comprehensive debug data with entity accumulation metrics]"
}
```

---

## Key Workflow Advantages

### Phase 1 Benefits
- **High Accuracy**: Optimized specifically for intent classification with function calling
- **Structured Data**: Reliable entity extraction using JSON schema validation
- **Entity Accumulation **: Maintains conversation context across multiple turns
- **Entity Corrections **: Handles user corrections to previously extracted data
- **Domain-Driven**: Uses domain constants and value objects for consistency
- **Fast Processing**: Low token usage (~150-200 tokens) for classification

### Phase 2 Benefits  
- **Dynamic Strategy**: AI-driven decision making through enhanced prompts
- **Enhanced Lead Scoring **: Uses accumulated entities for richer qualification
- **Entity-Aware Personalization **: Leverages conversation history for better targeting
- **Domain Services**: Business logic handled by dedicated domain services
- **Configurable Rules**: Thresholds and scoring rules easily adjustable
- **No Hardcoded Logic**: Flexible prompt-based strategy determination

### Phase 3 Benefits
- **Contextual Personalization**: Deep context injection from phases 1 & 2
- **Rich Entity Context **: Responses leverage accumulated conversation data
- **Personalized Recommendations **: Specific suggestions based on accumulated needs
- **Template-Driven**: Response strategies use configurable templates
- **Conversation Continuity**: Full conversation context maintained with entity persistence
- **Quality Control**: Structured prompt building ensures consistency

### Overall Result
**Maintainable, scalable architecture** that uses domain-driven design patterns with AI-enhanced decision making and **persistent entity accumulation**, avoiding hardcoded business logic while delivering **unprecedented personalization and contextual relevance** through conversation memory.

## Technical Implementation Notes

### Error Handling
- Phase 1 failure → Rule-based classification fallback
- Phase 2 failure → Template response using Phase 1 data
- Complete failure → Generic helpful response

### Performance Optimization
- Phase 1: Low token usage, high accuracy focus with entity accumulation
- Entity Accumulation: ~180ms overhead, high value-add for personalization
- Phase 2: Higher token allowance, creativity focus with rich entity context
- Parallel processing where possible (context loading, entity retrieval, knowledge retrieval)

### Cost Management (GPT-4o-mini Pricing)
- **Phase 1 (Intent Classification)**: ~500 tokens × $0.00015 per 1K = ~$0.000075 per interaction
- **Phase 2 (Response Generation)**: ~1500 tokens × $0.0006 per 1K = ~$0.0009 per interaction
- **Total**: ~$0.000975 per interaction (~$0.001)
- **GPT-4o Alternative**: ~30x more expensive (~$0.03 per interaction)
- **Fallback Rules**: Reduce costs during API failures using domain constants

### Monitoring & Analytics
- Intent classification accuracy tracking
- Entity accumulation effectiveness metrics (NEW)
- Entity correction frequency and accuracy (NEW)
- Response quality metrics with entity richness correlation (NEW)
- User satisfaction correlation with phases and entity context
- Lead scoring improvement with accumulated entities (NEW)
- Cost per conversation analysis with entity accumulation overhead 