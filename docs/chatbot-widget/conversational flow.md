
# 🤖 Intelligent Chatbot System

A sophisticated chatbot implementation using Domain-Driven Design (DDD) architecture with advanced intent classification, user journey tracking, and knowledge retrieval capabilities.

## 🎯 Overview

This chatbot goes beyond simple Q&A to provide an **intelligent conversation partner** that:
- **Understands user intent** through OpenAI function calling
- **Tracks user journey** from visitor to qualified lead
- **Manages conversation context** with token-aware memory
- **Retrieves relevant knowledge** from FAQ and knowledge bases
- **Provides business intelligence** through intent analytics

## 🏗️ Architecture

### DDD Layer Structure
```
lib/chatbot-widget/
├── domain/                          # Pure business logic
│   ├── entities/                    # Core business objects
│   ├── value-objects/              # Immutable domain concepts
│   ├── services/                   # Domain business rules
│   └── repositories/               # Data access contracts
├── application/                     # Use cases & orchestration
│   ├── use-cases/                  # Application workflows
│   ├── services/                   # Application coordination
│   └── mappers/                    # Data transformation
├── infrastructure/                  # External integrations
│   ├── persistence/                # Database implementations
│   ├── providers/                  # External API clients
│   └── composition/                # Dependency injection
└── presentation/                    # User interface layer
    ├── components/                 # React components
    ├── hooks/                      # React state management
    └── actions/                    # Server actions
```

## 🎬 Conversation Flow: From "Hello" to "Let's Schedule a Demo"

### Act 1: The Conversation Begins
**User**: "Hi there!"

1. **Session Creation**: New chat session with unique ID
2. **User Profiling**: Track visitor behavior (page views, time on site)
3. **Intent Detection**: AI classifies "Hi there!" → `greeting` (confidence: 0.95)
4. **Journey Mapping**: User starts at `visitor` stage
5. **Response Generation**: Friendly greeting + probing questions

### Act 2: The Discovery Phase
**User**: "I'm looking for a CRM solution for my team of 15 people"

1. **Intent Classification**: AI detects `sales_inquiry` (confidence: 0.87)
2. **Entity Extraction**: 
   - Company size: "15 people"
   - Product interest: "CRM solution"
   - Urgency: "medium" (inferred)
3. **Journey Progression**: `visitor` → `curious`
4. **Knowledge Retrieval**: Search FAQ/knowledge base for CRM content
5. **Smart Response**: AI combines product info + qualification questions

### Act 3: The Qualification Dance
**User**: "We have a budget of around $5,000/month and need something within 3 months"

1. **Entity Extraction**:
   - Budget: "$5,000/month" 
   - Timeline: "3 months"
   - Urgency: "medium" → "high"
2. **Journey Progression**: `curious` → `interested` → `evaluating`
3. **Lead Scoring**: Engagement score jumps (qualified lead!)
4. **Context Memory**: System remembers all key details
5. **Smart Routing**: High-value lead triggers enhanced qualification

### Act 4: The Memory Management
**Token-Aware Context Window**:
- **Always Remembers**: Last 2 messages (immediate context)
- **Smart Summarization**: AI creates summaries when exceeding ~8,000 tokens
- **Key Information Preserved**: Budget, timeline, pain points, objections
- **Example**: "User is evaluating CRM solutions for 15-person team, $5K budget, 3-month timeline"

### Act 5: The Intelligence Layer
**Multi-Layered Context Analysis**:
1. **Intent Classification**: Every message gets classified
2. **Journey State Tracking**: Progression through sales funnel
3. **Knowledge Injection**: FAQ answers automatically surface
4. **Smart Prompting**: AI system prompt adapts in real-time

### Act 6: The Conversion Moment
**User**: "This looks perfect. How do we get started?"

1. **Intent Detection**: `closing` (confidence: 0.94)
2. **Journey Completion**: → `qualified_lead`
3. **Lead Capture**: Automatic contact collection
4. **Sales Handoff**: High-priority lead flagged for follow-up

## 🎯 Enhanced Intent Classification System

### The 12 Intent Types with Multi-Intent Detection

#### 🤝 Relationship Building
- **`greeting`**: "Hi there!", "Hello", "Good morning"
- **`unknown`**: Unclear or off-topic messages

#### ❓ Information Seeking (Support)
- **`faq_general`**: "How does your product work?"
- **`faq_pricing`**: "What are your pricing tiers?"
- **`faq_features`**: "Do you have mobile apps?"
- **`support_request`**: "I'm having trouble with..."

#### 💰 Sales Pipeline
- **`sales_inquiry`**: "I'm looking for a CRM solution"
- **`demo_request`**: "Can I see a demo?"
- **`booking_request`**: "Let's schedule a call"
- **`qualification`**: Answering budget/timeline questions
- **`objection_handling`**: "This seems expensive..."
- **`closing`**: "How do we get started?"

### 🔀 Intent Overlap Resolution

**Challenge**: Messages can fall into multiple categories
```
User: "How much does your CRM cost?"
Could be:
- faq_pricing (just browsing, informational)
- sales_inquiry (serious buyer, qualification intent)
```

**Solution**: Multi-intent detection with disambiguation
```typescript
{
  primaryIntent: "faq_pricing",
  primaryConfidence: 0.75,
  alternativeIntents: [
    { intent: "sales_inquiry", confidence: 0.65, reasoning: "Budget inquiry suggests buying intent" }
  ],
  disambiguationContext: {
    isAmbiguous: true,
    contextualClues: ["first-time visitor", "no previous qualification"],
    suggestedClarifications: ["Are you actively evaluating CRM solutions?"]
  }
}
```

### Enhanced OpenAI Function Calling Process

#### Step 1: Enhanced Function Schema with Multi-Intent & Persona Detection
```typescript
const functions = [{
  name: "classify_intent_and_persona",
  description: "Classify user intent, extract entities, and infer persona information",
  parameters: {
    type: "object",
    properties: {
      // Primary intent classification
      primaryIntent: {
        type: "string",
        enum: ["greeting", "sales_inquiry", "demo_request", ...] // All 12 types
      },
      primaryConfidence: { type: "number", minimum: 0, maximum: 1 },
      
      // Alternative intents for disambiguation
      alternativeIntents: {
        type: "array",
        items: {
          type: "object",
          properties: {
            intent: { type: "string", enum: [...] },
            confidence: { type: "number" },
            reasoning: { type: "string" }
          }
        }
      },

      // Comprehensive entity extraction
      entities: {
        type: "object",
        properties: {
          // Core business entities
          budget: { type: "string" },
          timeline: { type: "string" },
          company: { type: "string" },
          teamSize: { type: "string" },
          industry: { type: "string" },
          role: { type: "string" },
          location: { type: "string" },
          urgency: { type: "string", enum: ["low", "medium", "high"] },
          contactMethod: { type: "string", enum: ["email", "phone", "meeting"] },

          // Scheduling entities
          preferredTime: { type: "string" },
          timezone: { type: "string" },
          availability: { type: "string" },
          eventType: { type: "string", enum: ["demo", "consultation", "onboarding", "support_call", "sales_call"] },

          // Product/feature entities
          productName: { type: "string" },
          featureName: { type: "string" },
          integrationNeeds: { type: "array", items: { type: "string" } },

          // Support entities
          issueType: { type: "string", enum: ["technical", "billing", "feature_request", "bug_report", "general"] },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          affectedFeature: { type: "string" },

          // Advanced qualification entities
          currentSolution: { type: "string" },
          painPoints: { type: "array", items: { type: "string" } },
          decisionMakers: { type: "array", items: { type: "string" } },
          evaluationCriteria: { type: "array", items: { type: "string" } }
        }
      },

      // Persona inference
      personaInference: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["ceo", "cto", "sales_manager", ...] },
          industry: { type: "string", enum: ["technology", "healthcare", ...] },
          companySize: { type: "string", enum: ["startup", "small", "medium", "large", "enterprise"] },
          confidence: { type: "number" },
          evidence: { type: "array", items: { type: "string" } }
        }
      },

      // Disambiguation context
      disambiguationContext: {
        type: "object",
        properties: {
          isAmbiguous: { type: "boolean" },
          contextualClues: { type: "array", items: { type: "string" } },
          suggestedClarifications: { type: "array", items: { type: "string" } }
        }
      },

      reasoning: { type: "string" }
    }
  }
}];
```

#### Step 2: Send to OpenAI
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are an expert intent classifier..." },
    { role: "user", content: "I'm looking for a CRM solution for 20 people, budget $5K/month" }
  ],
  functions: functions,
  function_call: { name: "classify_intent" }
});
```

#### Step 3: OpenAI Returns Enhanced Structured JSON
```json
{
  "function_call": {
    "name": "classify_intent_and_persona",
    "arguments": "{
      \"primaryIntent\": \"sales_inquiry\",
      \"primaryConfidence\": 0.87,
      \"alternativeIntents\": [
        {
          \"intent\": \"qualification\",
          \"confidence\": 0.65,
          \"reasoning\": \"Providing specific budget and team size suggests qualification phase\"
        }
      ],
      \"entities\": {
        \"teamSize\": \"20 people\",
        \"budget\": \"$5K/month\",
        \"urgency\": \"medium\",
        \"industry\": \"technology\"
      },
      \"personaInference\": {
        \"role\": \"sales_manager\",
        \"industry\": \"technology\",
        \"companySize\": \"small\",
        \"confidence\": 0.75,
        \"evidence\": [\"Budget authority\", \"Team size context\", \"Solution evaluation language\"]
      },
      \"disambiguationContext\": {
        \"isAmbiguous\": false,
        \"contextualClues\": [\"Specific budget mentioned\", \"Team size provided\"],
        \"suggestedClarifications\": []
      },
      \"reasoning\": \"User explicitly mentions CRM solution with team size and budget, indicating sales inquiry with qualification elements\"
    }"
  }
}
```

### Comprehensive Entity Extraction & Persona Detection

#### Complete Entity Coverage (25+ Entity Types)
```typescript
interface ExtractedEntities {
  // Core business entities
  location?: string;      // For territory assignment
  budget?: string;        // For qualification
  timeline?: string;      // For urgency scoring
  company?: string;       // For lead enrichment
  industry?: string;      // For personalization
  teamSize?: string;      // For product fit
  urgency?: 'low' | 'medium' | 'high';  // For prioritization
  contactMethod?: 'email' | 'phone' | 'meeting';  // For follow-up
  role?: string;          // Job title/role mentioned

  // Scheduling entities
  preferredTime?: string;        // "next Tuesday", "this afternoon", "Q1 2024"
  timezone?: string;             // "EST", "PST", "UTC+2"
  availability?: string;         // "mornings", "weekdays", "flexible"
  eventType?: 'demo' | 'consultation' | 'onboarding' | 'support_call' | 'sales_call';
  
  // Product/feature entities
  productName?: string;          // "CRM", "Analytics Dashboard", "Mobile App"
  featureName?: string;          // "reporting", "integrations", "API access"
  integrationNeeds?: string[];   // ["Salesforce", "HubSpot", "Slack"]
  
  // Support entities
  issueType?: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  affectedFeature?: string;      // Which feature is having issues
  
  // Advanced qualification entities
  currentSolution?: string;      // What they're using now
  painPoints?: string[];         // Specific problems they're facing
  decisionMakers?: string[];     // Who else is involved in the decision
  evaluationCriteria?: string[]; // What factors matter most to them
}

interface PersonaInference {
  role: UserRole;         // ceo, cto, sales_manager, etc.
  industry: Industry;     // technology, healthcare, finance, etc.
  companySize: CompanySize; // startup, small, medium, large, enterprise
  confidence: number;     // How confident we are in this inference
  evidence: string[];     // What led to this conclusion
}
```

#### Persona-Driven Personalization
```typescript
// CEO persona gets different messaging than Developer
if (persona.role === 'ceo') {
  systemPrompt += "Focus on ROI, business impact, and strategic value.";
} else if (persona.role === 'developer') {
  systemPrompt += "Focus on technical features, integrations, and implementation.";
}

// Industry-specific pain points
if (persona.industry === 'healthcare') {
  knowledgeContext += "Emphasize HIPAA compliance and patient data security.";
} else if (persona.industry === 'finance') {
  knowledgeContext += "Highlight regulatory compliance and risk management.";
}
```

#### Real Examples with Enhanced Entity Extraction

**Sales Inquiry**:
```
User: "We're a 50-person healthcare company, budget $10K/month, need by Q1. We're currently using Salesforce but struggling with reporting."
Extracted: {
  company: "50-person healthcare company",
  teamSize: "50-person",
  industry: "healthcare",
  budget: "$10K/month", 
  timeline: "Q1",
  urgency: "medium",
  currentSolution: "Salesforce",
  painPoints: ["struggling with reporting"],
  featureName: "reporting"
}
```

**Demo Request with Scheduling**:
```
User: "Can we schedule a demo for next Tuesday afternoon? I'm in EST and prefer mornings usually but Tuesday afternoon works."
Extracted: {
  eventType: "demo",
  preferredTime: "next Tuesday afternoon",
  timezone: "EST",
  availability: "mornings usually",
  urgency: "high",
  contactMethod: "meeting"
}
```

**Support Request**:
```
User: "I'm having a critical issue with the mobile app - users can't log in and it's affecting our entire sales team."
Extracted: {
  issueType: "technical",
  severity: "critical",
  affectedFeature: "mobile app",
  productName: "mobile app",
  painPoints: ["users can't log in"],
  teamSize: "sales team"
}
```

**Advanced Qualification**:
```
User: "We're evaluating CRM solutions. Key criteria are Slack integration, custom reporting, and API access. Our CEO and CTO need to approve any purchase over $5K."
Extracted: {
  productName: "CRM",
  integrationNeeds: ["Slack"],
  featureName: "custom reporting, API access",
  evaluationCriteria: ["Slack integration", "custom reporting", "API access"],
  decisionMakers: ["CEO", "CTO"],
  budget: "over $5K"
}
```

## 🗺️ Enhanced User Journey Tracking

### Journey Stages
1. **`visitor`**: Just arrived, browsing
2. **`curious`**: Asking questions, exploring
3. **`interested`**: Showing buying signals
4. **`evaluating`**: Comparing options, detailed questions
5. **`ready_to_buy`**: Strong purchase intent
6. **`qualified_lead`**: Provided contact info, sales-ready
7. **`lost`**: Disengaged or not interested
8. **`converted`**: Successfully converted

### 🔄 Non-Linear Journey Support

**Challenge**: Real conversations aren't linear
```
User Journey: visitor → curious → evaluating → curious (price shock) → interested (after discount)
```

**Solution**: Journey regressions and context switches
```typescript
interface JourneyTransition {
  fromStage: JourneyStage;
  toStage: JourneyStage;
  trigger: JourneyTransitionTrigger;
  timestamp: Date;
  isRegression: boolean;  // ← Tracks backward movement
  contextSwitch?: {       // ← Tracks topic changes
    previousContext: string;
    newContext: string;
    reason: string;
  };
}

// Example: User backs out after seeing pricing
{
  fromStage: "evaluating",
  toStage: "curious", 
  isRegression: true,
  contextSwitch: {
    previousContext: "feature evaluation",
    newContext: "pricing concerns",
    reason: "sticker shock - switched from features to pricing objections"
  }
}
```

### Enhanced Journey Transitions
```typescript
// Intent-based journey transitions with regression support
if (intent === 'sales_inquiry' && confidence > 0.7) {
  updateJourneyState('interested', confidence);
}

if (intent === 'objection_handling' && currentStage === 'evaluating') {
  // Regression detected - user has concerns
  updateJourneyState('curious', confidence, { isRegression: true });
}

if (intent === 'demo_request' && hasQualifyingEntities) {
  updateJourneyState('ready_to_buy', confidence);
}
```

### Journey Analytics
```typescript
interface JourneyStateMetadata {
  transitionHistory: JourneyTransition[];
  regressionCount: number;           // How many times user stepped back
  contextSwitches: number;           // How many topic changes
  stageVisitCount: Record<JourneyStage, number>;  // Frequency per stage
  alternativePaths: Array<{          // Possible next stages
    path: JourneyStage[];
    probability: number;
    triggers: string[];
  }>;
}
```

## 🧠 Memory Management

### Token-Aware Context Window
- **Total Budget**: 12,000 tokens
- **System Prompt**: 500 tokens
- **Response Reserved**: 3,000 tokens
- **Summary**: 200 tokens
- **Available for Messages**: ~8,300 tokens

### Smart Summarization
```typescript
// When context exceeds available tokens
if (totalTokens > availableTokens) {
  const summary = await createAISummary(olderMessages);
  // Keep: summary + recent 2 messages + current message
}
```

### Context Preservation
- **Always Includes**: Recent 2 messages for immediate context
- **AI Summaries**: When conversation gets long
- **Key Information**: Budget, timeline, pain points never lost

## 📚 Knowledge Retrieval

### Knowledge Categories
- **FAQ**: Frequently asked questions
- **Product Info**: Feature descriptions, capabilities
- **Pricing**: Pricing tiers, cost information
- **Support**: Troubleshooting, how-to guides
- **General**: Company info, policies

### Intent-Based Knowledge Search
```typescript
switch (intent) {
  case 'faq_pricing':
    searchKnowledge({ category: 'pricing', query: userMessage });
    break;
  case 'sales_inquiry':
    searchKnowledge({ category: 'product_info', query: userMessage });
    break;
  case 'support_request':
    searchKnowledge({ category: 'support', query: userMessage });
    break;
}
```

## 🎛️ Smart Response Generation

### Enhanced System Prompts
Based on detected intent, the AI system prompt gets enhanced:

```typescript
// Base system prompt
"You are a helpful sales assistant..."

// Gets enhanced with:
"CURRENT USER INTENT: sales_inquiry (confidence: 0.87)
EXTRACTED ENTITIES: teamSize=20, urgency=medium
INTENT CATEGORY: sales
NOTE: User is showing sales interest. Focus on qualification and next steps.
RELEVANT KNOWLEDGE: [CRM features, pricing tiers, implementation timeline]"
```

### Confidence-Based Decision Making

#### High Confidence (0.8+)
- Trigger specific workflows
- Update journey state
- Capture lead information
- Route to specialized responses

#### Medium Confidence (0.5-0.8)
- Use intent as guidance
- Ask clarifying questions
- Provide multiple response options

#### Low Confidence (<0.5)
- Fall back to general responses
- Ask open-ended questions
- Log for manual review

## 📊 Enhanced Business Intelligence

### Intent Analytics
- Most common intents by time period
- Intent progression patterns (conversion funnels)
- Confidence score distributions (model accuracy)
- Entity extraction success rates
- **Intent overlap analysis** (disambiguation patterns)
- **Alternative intent tracking** (what users almost meant)

### Enhanced Lead Quality Scoring with Comprehensive Entity Analysis
```typescript
// Base intent scoring
leadScore += intent === 'sales_inquiry' ? 25 : 0;
leadScore += intent === 'demo_request' ? 35 : 0;
leadScore += intent === 'closing' ? 50 : 0;

// Persona-based scoring
leadScore += persona.role === 'ceo' ? 30 : 0;
leadScore += persona.role === 'cto' ? 25 : 0;
leadScore += persona.companySize === 'enterprise' ? 20 : 0;

// Core entity completeness scoring
leadScore += entities.budget ? 15 : 0;
leadScore += entities.timeline ? 10 : 0;
leadScore += entities.teamSize ? 8 : 0;
leadScore += entities.company ? 5 : 0;

// Advanced qualification scoring
leadScore += entities.decisionMakers?.length > 0 ? 20 : 0;  // Decision makers identified
leadScore += entities.evaluationCriteria?.length > 0 ? 15 : 0;  // Clear criteria
leadScore += entities.currentSolution ? 10 : 0;  // Existing solution context
leadScore += entities.painPoints?.length > 0 ? 12 : 0;  // Specific pain points

// Scheduling readiness scoring
leadScore += entities.eventType === 'demo' ? 25 : 0;
leadScore += entities.preferredTime ? 15 : 0;
leadScore += entities.timezone ? 8 : 0;

// Support urgency scoring
if (entities.issueType) {
  leadScore += entities.severity === 'critical' ? 30 : 0;
  leadScore += entities.severity === 'high' ? 20 : 0;
  leadScore += entities.affectedFeature ? 10 : 0;
}

// Integration complexity scoring (higher = more qualified)
leadScore += entities.integrationNeeds?.length > 0 ? 12 : 0;
leadScore += entities.integrationNeeds?.length > 2 ? 8 : 0;  // Complex needs

// Confidence and journey scoring
leadScore += confidence > 0.8 ? 10 : 0;
leadScore += journeyState.regressionCount === 0 ? 15 : 0; // No backtracking
leadScore += journeyState.contextSwitches < 2 ? 10 : 0;   // Focused conversation

// Entity richness bonus (comprehensive information)
const entityCount = Object.values(entities).filter(v => v !== undefined).length;
leadScore += entityCount > 8 ? 20 : 0;  // Rich entity extraction
leadScore += entityCount > 12 ? 15 : 0; // Exceptionally detailed
```

### Journey Pattern Recognition
- **Buying Journey**: greeting → faq_pricing → sales_inquiry → demo_request → closing
- **Support Journey**: greeting → faq_general → support_request
- **Research Journey**: faq_features → faq_pricing → unknown (left without converting)
- **Regression Patterns**: evaluating → curious (price shock) → objection_handling → interested
- **Context Switch Patterns**: sales_inquiry → support_request (existing customer)

### Persona Analytics
- **Role Distribution**: Which roles engage most (CEO vs. Developer vs. Sales Manager)
- **Industry Conversion Rates**: Which industries convert best
- **Company Size Patterns**: Enterprise vs. SMB engagement differences
- **Persona Journey Mapping**: How different personas navigate the funnel

### Disambiguation Intelligence
- **Ambiguous Intent Tracking**: Which messages cause confusion
- **Clarification Success Rates**: How often clarifying questions resolve ambiguity
- **Context Clue Effectiveness**: Which contextual signals improve accuracy
- **Alternative Intent Patterns**: What users almost meant vs. what they said

## 🚀 Business Outcomes

### For Sales Teams
- **Pre-qualified leads** with budget, timeline, and needs identified
- **Rich context** about prospect's journey and interests
- **Optimal timing** for human intervention
- **Higher conversion rates** from better qualification

### For Support Teams
- **Automatic FAQ resolution** reduces ticket volume
- **Context-aware responses** improve satisfaction
- **Knowledge base utilization** increases self-service

### For Marketing Teams
- **Intent data** reveals what prospects really want
- **Journey analytics** show conversion paths
- **Content gaps** identified through failed knowledge searches
- **Lead quality scoring** improves campaign targeting

## 🔧 Technical Implementation

### Key Components

#### Domain Layer
- **`IntentResult`**: Enhanced value object with multi-intent support and disambiguation
- **`UserJourneyState`**: Value object with regression tracking and context switches
- **`UserPersona`**: New value object for persona inference and personalization
- **`ConversationContextWindow`**: Token-aware context management
- **`IIntentClassificationService`**: Enhanced interface with persona support
- **`IKnowledgeRetrievalService`**: Knowledge search interface

#### Infrastructure Layer
- **`OpenAIIntentClassificationService`**: **FIXED** - Real OpenAI function calling implementation
- **`SimpleKnowledgeRetrievalService`**: FAQ/knowledge base search
- **`OpenAITokenCountingService`**: Accurate token counting

#### Application Layer
- **`ProcessChatMessageUseCase`**: Enhanced with intent classification and persona detection
- **`ConversationContextService`**: Smart context management with persona awareness
- **`ChatbotWidgetCompositionRoot`**: Dependency injection with OpenAI client setup

### Testing
- **181 tests passing** including enhanced intent classification tests
- **Comprehensive coverage** of value objects and domain services with new persona features
- **Integration tests** for complete conversation flows with multi-intent detection
- **All TODOs and hacks removed** - production-ready implementation

## 🔄 Continuous Improvement

The enhanced system gets smarter over time:
- **Intent accuracy** improves with more conversations and disambiguation data
- **Persona inference** becomes more precise with additional conversation patterns
- **Journey mapping** refines based on successful conversions and regression analysis
- **Knowledge base** expands based on common questions and failed searches
- **Response quality** enhances through feedback loops and persona-specific optimization
- **Disambiguation patterns** improve through ambiguous conversation analysis

## 🎯 Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key
- Supabase database

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Tests
```bash
# Run all chatbot tests
pnpm test chatbot

# Run specific intent tests
pnpm test IntentResult
```

### Key Files to Understand
1. **`IntentResult.ts`**: Enhanced intent classification with multi-intent support
2. **`UserJourneyState.ts`**: User journey tracking with regression and context switch support
3. **`UserPersona.ts`**: New persona inference and personalization logic
4. **`OpenAIIntentClassificationService.ts`**: **FIXED** - Real OpenAI integration with function calling
5. **`ProcessChatMessageUseCase.ts`**: Main conversation processing with persona detection
6. **`ConversationContextService.ts`**: Context and memory management with persona awareness

---

This enhanced intelligent chatbot system transforms simple Q&A into a sophisticated conversation partner that understands user intent with multi-dimensional analysis, tracks non-linear user journeys, infers user personas for personalized responses, handles intent disambiguation, and provides rich business intelligence about customer behavior, persona patterns, and conversation analytics.