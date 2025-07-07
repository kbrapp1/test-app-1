# Chatbot Widget - Use Case Examples & Walkthroughs

## Overview

This document provides comprehensive examples and walkthroughs demonstrating the practical use of the chatbot-widget domain. From basic chat interactions to advanced lead qualification scenarios, these examples showcase the platform's capabilities and provide implementation guidance.

## Table of Contents

1. [Basic Chat Interaction Examples](#basic-chat-interaction-examples)
2. [Lead Qualification Workflows](#lead-qualification-workflows)
3. [Knowledge Base Integration Scenarios](#knowledge-base-integration-scenarios)
4. [Advanced AI Features](#advanced-ai-features)
5. [Configuration & Setup Examples](#configuration--setup-examples)
6. [Testing & Simulation Scenarios](#testing--simulation-scenarios)
7. [Integration Examples](#integration-examples)
8. [Error Handling & Recovery](#error-handling--recovery)

## Basic Chat Interaction Examples

### Example 1: Simple Information Request

**Scenario**: User seeks basic company information.

```typescript
// 1. Initialize chat session
const sessionResponse = await fetch('/api/chatbot-widget/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatbotConfigId: 'config_marketing_bot',
    initialContext: {
      pageUrl: 'https://company.com/about',
      referrer: 'https://google.com'
    },
    options: {
      warmKnowledgeCache: true
    }
  })
});

const { sessionId } = await sessionResponse.json();

// 2. Send user message
const chatResponse = await fetch('/api/chatbot-widget/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What services does your company offer?",
    sessionId: sessionId,
    clientInfo: {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }
  })
});

const result = await chatResponse.json();
```

**Expected Response Flow**:
```
User: "What services does your company offer?"

Bot: "We offer comprehensive marketing automation solutions including:

• Data-driven marketing analytics and predictive modeling
• Multi-location marketing coordination and management  
• Advanced mail services and digital advertising
• Integrated marketing solutions for enterprises

Would you like me to provide more details about any specific service area? I can also help you understand which solutions might be the best fit for your business needs."

Lead Score: 15 (information gathering stage)
Knowledge Used: Company services, product catalog
```

### Example 2: Progressive Conversation Building

**Scenario**: Multi-turn conversation with context accumulation.

```typescript
// First interaction
await sendMessage("Hi, I'm looking for marketing automation tools");
// Response: Greeting + initial product overview
// Entities: {interests: ["marketing automation"]}

// Second interaction  
await sendMessage("We're a 50-person SaaS company based in Austin");
// Response: Tailored to SaaS company needs
// Entities: {companySize: "50-person", industry: "SaaS", location: "Austin"}

// Third interaction
await sendMessage("Our main challenge is lead qualification across multiple channels");
// Response: Specific solutions for lead qualification + multi-channel management
// Entities: {painPoints: ["lead qualification", "multi-channel management"]}
// Lead Score: 45 (showing specific needs)
```

**Context Evolution**:
```typescript
// Session context after 3 messages
{
  conversationSummary: "SaaS company (50 people, Austin) seeking marketing automation for lead qualification across multiple channels",
  currentPhase: "qualification",
  accumulatedEntities: {
    industry: { value: "SaaS", confidence: 0.95 },
    companySize: { value: "50-person", confidence: 0.90 },
    location: { value: "Austin", confidence: 0.85 },
    painPoints: ["lead qualification", "multi-channel management"],
    interests: ["marketing automation"]
  },
  leadScore: 45
}
```

## Lead Qualification Workflows

### Example 1: Enterprise Sales Lead

**Scenario**: High-value enterprise prospect identification and qualification.

```typescript
// Progressive conversation leading to qualification
const conversationFlow = [
  {
    user: "I'm researching marketing automation platforms for our enterprise",
    botResponse: "I'd love to help you find the right solution. What size organization are you working with?",
    entities: { interests: ["marketing automation"], role: "researcher" },
    leadScore: 25
  },
  
  {
    user: "We're a 2000-employee manufacturing company with multiple locations",
    botResponse: "Perfect! Multi-location coordination is one of our specialties. What's your biggest challenge with your current marketing approach?",
    entities: { 
      companySize: "2000-employee", 
      industry: "manufacturing", 
      setupType: "multi-location" 
    },
    leadScore: 50
  },
  
  {
    user: "We struggle with consistent messaging across regions and tracking ROI",
    botResponse: "Those are exactly the challenges our platform addresses. I'm Sarah, by the way - what's your name?",
    entities: { 
      painPoints: ["consistent messaging", "ROI tracking"],
      decisionContext: "multi-region"
    },
    leadScore: 65
  },
  
  {
    user: "I'm Mike Johnson, VP of Marketing",
    botResponse: "Great to meet you, Mike! As VP of Marketing, you're definitely the right person to evaluate this. What's your timeline for implementing a new solution?",
    entities: { 
      visitorName: "Mike Johnson", 
      jobTitle: "VP of Marketing",
      decisionMaker: true
    },
    leadScore: 80 // Triggers lead capture
  }
];
```

**Lead Capture Trigger**:
```typescript
// When lead score reaches 80+
const leadCaptureResult = {
  captured: true,
  lead: {
    contactInfo: {
      name: "Mike Johnson",
      jobTitle: "VP of Marketing",
      company: "2000-employee manufacturing company"
    },
    qualificationData: {
      companySize: "2000-employee",
      industry: "manufacturing",
      painPoints: ["consistent messaging", "ROI tracking"],
      timeline: "evaluating",
      decisionMaker: true
    },
    conversationSummary: "VP of Marketing at large manufacturing company seeking marketing automation for multi-location messaging consistency and ROI tracking",
    leadScore: 80,
    status: "sales_ready"
  },
  nextAction: "human_escalation"
};
```

### Example 2: Small Business Lead Nurturing

**Scenario**: Small business lead requiring nurturing and education.

```typescript
const smallBusinessFlow = [
  {
    user: "Do you have solutions for small businesses?",
    botResponse: "Absolutely! We work with businesses of all sizes. What kind of business do you run?",
    leadScore: 15
  },
  
  {
    user: "Local restaurant with 3 locations",
    botResponse: "Perfect! Multi-location restaurants benefit greatly from coordinated marketing. What's your biggest marketing challenge?",
    entities: { 
      industry: "restaurant", 
      companySize: "small", 
      locations: "3" 
    },
    leadScore: 35
  },
  
  {
    user: "Keeping our social media and promotions consistent across locations",
    botResponse: "That's a common challenge. Our multi-location marketing tools can help automate that consistency. What's your current marketing budget range?",
    entities: { 
      painPoints: ["social media consistency", "promotion coordination"] 
    },
    leadScore: 55
  },
  
  {
    user: "We're pretty tight on budget, maybe $500-1000/month",
    botResponse: "I understand budget considerations. We have solutions that can fit that range and often pay for themselves through improved efficiency. Would you like to see a demo of our small business package?",
    entities: { 
      budget: "$500-1000/month" 
    },
    leadScore: 70 // Qualified lead, needs nurturing
  }
];
```

**Nurturing Strategy**:
```typescript
// Automated follow-up sequence triggered
const nurturingSequence = {
  leadStatus: "qualified_nurturing",
  followUpActions: [
    {
      type: "email_sequence",
      template: "small_business_roi_calculator",
      delay: "1_hour"
    },
    {
      type: "demo_scheduling",
      template: "small_business_demo_invite", 
      delay: "24_hours"
    },
    {
      type: "case_study_share",
      template: "restaurant_success_stories",
      delay: "3_days"
    }
  ]
};
```

## Knowledge Base Integration Scenarios

### Example 1: Product Information Retrieval

**Scenario**: User asks about specific product features with semantic knowledge retrieval.

```typescript
// User query with complex product question
const userQuery = "How does your predictive analytics compare to competitors like HubSpot?";

// Knowledge retrieval process
const knowledgeRetrievalFlow = {
  // 1. Generate embedding for user query
  queryEmbedding: await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: userQuery
  }),
  
  // 2. Search knowledge base with semantic similarity
  knowledgeResults: await vectorSearch({
    embedding: queryEmbedding.data[0].embedding,
    threshold: 0.15,
    maxResults: 5,
    filters: {
      contentTypes: ["product_comparison", "features", "competitive_analysis"]
    }
  }),
  
  // 3. Retrieved knowledge items
  relevantKnowledge: [
    {
      title: "Predictive Analytics Features",
      content: "Our predictive analytics engine uses advanced machine learning models to forecast customer behavior, lead scoring, and campaign performance...",
      similarity: 0.87,
      source: "product_features"
    },
    {
      title: "Competitive Comparison - Marketing Platforms", 
      content: "Compared to HubSpot, our platform offers more advanced predictive modeling capabilities and better integration with multi-location businesses...",
      similarity: 0.82,
      source: "competitive_analysis"
    }
  ]
};
```

**AI Response Generation**:
```typescript
// System prompt enhanced with knowledge
const enhancedPrompt = `
You are a knowledgeable sales assistant for our marketing automation platform.

RELEVANT KNOWLEDGE:
${knowledgeResults.map(item => `
${item.title}:
${item.content}
`).join('\n')}

USER QUESTION: ${userQuery}

Provide a comprehensive comparison focusing on our unique advantages while being honest about areas where competitors may have strengths.
`;

// Generated response
const botResponse = `Great question! Our predictive analytics offers several advantages over HubSpot:

**Advanced Modeling**: We use more sophisticated machine learning algorithms that can predict customer lifetime value, churn probability, and optimal touchpoint timing with 15-20% higher accuracy.

**Multi-Location Focus**: Unlike HubSpot's one-size-fits-all approach, our predictive models are specifically designed for businesses with multiple locations, considering geographic and demographic variations.

**Real-Time Processing**: Our system processes customer behavior in real-time, updating predictions as new data comes in, while HubSpot's analytics typically have a 24-48 hour lag.

**Integration Depth**: We offer deeper integrations with location-specific data sources like foot traffic, local events, and regional market conditions.

That said, HubSpot has a larger ecosystem of third-party integrations and a more established user community.

Would you like to see a side-by-side comparison demo focusing on your specific use case?`;
```

### Example 2: FAQ-Powered Support

**Scenario**: User asks common support question with automatic FAQ matching.

```typescript
// User support question
const supportQuery = "How do I set up automated email campaigns for different locations?";

// FAQ matching process
const faqMatching = {
  // Semantic search through FAQ database
  matchedFAQs: [
    {
      question: "How to create location-specific email campaigns?",
      answer: "To set up location-specific campaigns: 1. Navigate to Campaign Builder 2. Select 'Multi-Location Campaign' 3. Define location parameters...",
      category: "campaign_setup",
      similarity: 0.91
    },
    {
      question: "Automating email sequences for different regions",
      answer: "Email automation can be configured per location using our regional triggers...",
      category: "automation",
      similarity: 0.85
    }
  ],
  
  // Knowledge synthesis
  synthesizedResponse: "I can help you set up automated email campaigns for different locations! Here's the step-by-step process:\n\n**Campaign Setup:**\n1. Go to Campaign Builder in your dashboard\n2. Select 'Multi-Location Campaign' template\n3. Define your location parameters (regions, zip codes, or specific addresses)\n\n**Automation Rules:**\n1. Set location-based triggers (customer visits, local events, weather)\n2. Configure timing for each location's timezone\n3. Customize content with location-specific offers or information\n\n**Best Practices:**\n- Use dynamic content blocks for local business hours\n- Include location-specific contact information\n- Test campaigns in each region before full deployment\n\nWould you like me to walk you through setting up your first location-specific campaign, or do you have questions about any of these steps?"
};
```

## Advanced AI Features

### Example 1: Multi-Intent Detection

**Scenario**: User message contains multiple intents that need to be addressed.

```typescript
// Complex user message with multiple intents
const userMessage = "I need pricing information for enterprise plans, but I also want to schedule a demo and understand your security compliance features";

// AI analysis result
const intentAnalysis = {
  detectedIntents: [
    {
      intent: "pricing_inquiry",
      confidence: 0.92,
      entities: ["enterprise plans"],
      priority: "high"
    },
    {
      intent: "demo_request", 
      confidence: 0.88,
      entities: ["schedule demo"],
      priority: "high"
    },
    {
      intent: "feature_inquiry",
      confidence: 0.85,
      entities: ["security compliance"],
      priority: "medium"
    }
  ],
  
  responseStrategy: "multi_intent_comprehensive"
};

// Generated response addressing all intents
const comprehensiveResponse = `I'd be happy to help with all of that! Let me address each of your needs:

**Enterprise Pricing:**
Our enterprise plans start at $2,000/month and scale based on:
- Number of contacts and locations
- Advanced features included
- Level of support and training

**Demo Scheduling:**
I can set up a personalized demo that covers enterprise features and pricing. Would you prefer this week or next? I'll make sure to include our enterprise-specific capabilities.

**Security & Compliance:**
Our platform is SOC 2 Type II certified and includes:
- End-to-end encryption
- GDPR compliance tools
- Role-based access controls
- Audit logging and compliance reporting

To give you the most accurate pricing and show you exactly how our security features work with your infrastructure, would you like to schedule a 30-minute enterprise demo? I can also send you our detailed security documentation right after this chat.

What's your preferred day and time for the demo?`;
```

### Example 2: Context-Aware Entity Extraction

**Scenario**: Progressive entity extraction across conversation with context preservation.

```typescript
// Conversation progression with entity accumulation
const entityEvolution = [
  {
    message: "We're a tech startup",
    extractedEntities: {
      industry: { value: "technology", confidence: 0.85, source: "startup" },
      companySize: { value: "startup", confidence: 0.90 }
    }
  },
  
  {
    message: "We're about 25 people and growing fast", 
    extractedEntities: {
      // Updates previous entity with more specific information
      companySize: { 
        value: "25 employees", 
        confidence: 0.95,
        previousValue: "startup",
        growthStage: "scaling"
      },
      growthPattern: { value: "fast growth", confidence: 0.80 }
    }
  },
  
  {
    message: "I'm the CEO and we're looking at Series A funding",
    extractedEntities: {
      jobTitle: { value: "CEO", confidence: 0.98 },
      decisionMaker: { value: true, confidence: 0.95 },
      fundingStage: { value: "Series A", confidence: 0.92 },
      // Context-aware enhancement
      authority: { value: "high", confidence: 0.90, derivedFrom: "CEO" },
      urgency: { value: "medium", confidence: 0.75, derivedFrom: "funding_round" }
    }
  }
];

// Final accumulated entity profile
const entityProfile = {
  company: {
    industry: "technology",
    size: "25 employees", 
    stage: "Series A startup",
    growthPattern: "fast growth"
  },
  contact: {
    jobTitle: "CEO",
    decisionMaker: true,
    authority: "high"
  },
  context: {
    urgency: "medium",
    fundingContext: "Series A",
    timing: "scaling phase"
  }
};
```

## Configuration & Setup Examples

### Example 1: Enterprise Configuration Setup

**Scenario**: Setting up a comprehensive enterprise chatbot configuration.

```typescript
// Enterprise configuration creation
const enterpriseConfig = await createChatbotConfig({
  organizationId: "org_enterprise_123",
  name: "Enterprise Sales Assistant",
  
  personalitySettings: {
    tone: "professional",
    responseStyle: {
      length: "detailed",
      emojiUsage: "minimal", 
      followUpQuestions: true,
      proactiveOffering: true
    },
    conversationFlow: {
      greeting: "Hello! I'm here to help you explore our enterprise marketing automation solutions. How can I assist you today?",
      fallbackMessage: "I want to make sure I provide you with the most accurate information. Let me connect you with a specialist who can address your specific needs.",
      escalationMessage: "Based on our conversation, it sounds like you'd benefit from speaking with one of our enterprise solution architects. Would you like me to schedule a call?"
    }
  },
  
  aiConfiguration: {
    model: {
      name: "gpt-4o",
      temperature: 0.3,
      maxTokens: 800
    },
    contextManagement: {
      windowSize: 16000,
      summaryThreshold: 10000,
      criticalMessageRetention: true
    },
    intentClassification: {
      confidenceThreshold: 0.7,
      multiIntentDetection: true,
      customIntents: [
        { name: "enterprise_pricing", keywords: ["enterprise", "pricing", "cost", "investment"] },
        { name: "security_compliance", keywords: ["security", "compliance", "SOC", "GDPR"] },
        { name: "integration_requirements", keywords: ["integration", "API", "connector", "sync"] }
      ]
    }
  },
  
  leadScoringConfiguration: {
    scoringCriteria: {
      contactInfoProvided: 20,
      budgetDisclosed: 25,
      timelineShared: 20,
      decisionMakerRole: 25,
      engagementLevel: 10
    },
    thresholds: {
      leadCapture: 60,
      qualified: 75,
      salesReady: 85
    },
    customQuestions: [
      {
        question: "What's your typical marketing budget range?",
        triggerScore: 50,
        category: "budget"
      },
      {
        question: "How soon are you looking to implement a solution?",
        triggerScore: 60,
        category: "timeline"
      }
    ]
  },
  
  operatingHours: {
    timezone: "America/New_York",
    businessHours: {
      monday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
      tuesday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
      wednesday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
      thursday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
      friday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
      saturday: { isOpen: false },
      sunday: { isOpen: false }
    },
    outsideHoursBehavior: {
      showOfflineMessage: true,
      offlineMessage: "Our sales team is currently offline. Please leave your contact information and we'll reach out first thing during business hours.",
      allowMessageCapture: true,
      escalateToEmail: true
    }
  }
});
```

### Example 2: Small Business Quick Setup

**Scenario**: Rapid setup for small business with sensible defaults.

```typescript
// Small business configuration with smart defaults
const smallBusinessConfig = await createChatbotConfig({
  organizationId: "org_smallbiz_456",
  name: "Local Business Assistant",
  
  // Use industry-specific defaults
  industryTemplate: "local_business",
  
  personalitySettings: {
    tone: "friendly",
    responseStyle: {
      length: "balanced",
      emojiUsage: "moderate",
      followUpQuestions: true,
      proactiveOffering: false  // Less aggressive for small business
    }
  },
  
  // Simplified AI configuration
  aiConfiguration: {
    model: { name: "gpt-4o-mini" },  // Cost-effective option
    contextManagement: {
      windowSize: 8000,  // Smaller context window
      summaryThreshold: 5000
    }
  },
  
  // Adjusted lead scoring for local business
  leadScoringConfiguration: {
    thresholds: {
      leadCapture: 50,   // Lower threshold
      qualified: 65,
      salesReady: 75
    }
  },
  
  // Extended hours for local business
  operatingHours: {
    timezone: "America/Chicago",
    businessHours: {
      // Open longer hours including weekends
      saturday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      sunday: { isOpen: true, openTime: "12:00", closeTime: "16:00" }
    }
  }
});
```

## Testing & Simulation Scenarios

### Example 1: Comprehensive Lead Generation Testing

**Scenario**: Testing lead generation capabilities with various user personas.

```typescript
// Lead generation test suite
const leadGenTestSuite = [
  {
    scenario: "Enterprise Decision Maker",
    userProfile: {
      persona: "enterprise_buyer",
      role: "VP Marketing",
      industry: "technology", 
      companySize: "500+",
      budget: "high",
      experience: "expert"
    },
    testSequence: [
      "I'm evaluating marketing automation platforms for our enterprise",
      "We're a 800-person SaaS company with global operations",
      "Our main challenge is coordinating campaigns across 15 countries",
      "I'm the VP of Marketing and I need this implemented in Q2",
      "What's your enterprise pricing for global deployment?"
    ],
    expectedOutcome: {
      leadScore: 85,
      leadCaptured: true,
      qualificationLevel: "sales_ready",
      recommendedAction: "enterprise_demo"
    }
  },
  
  {
    scenario: "Small Business Owner", 
    userProfile: {
      persona: "small_business",
      role: "owner",
      industry: "retail",
      companySize: "5-10",
      budget: "low",
      experience: "beginner"
    },
    testSequence: [
      "Hi, do you have marketing tools for small businesses?",
      "I own 2 local coffee shops and struggle with social media",
      "My budget is pretty tight, maybe $200-300 per month",
      "I'm not very tech-savvy, how hard is it to use?"
    ],
    expectedOutcome: {
      leadScore: 65,
      leadCaptured: true, 
      qualificationLevel: "nurturing",
      recommendedAction: "small_business_demo"
    }
  }
];

// Execute test suite
const testResults = await Promise.all(
  leadGenTestSuite.map(async (test) => {
    const simulation = await createSimulationSession(configId, test);
    
    for (const message of test.testSequence) {
      await sendSimulationMessage(simulation.id, message);
    }
    
    const results = await endSimulationSession(simulation.id);
    
    return {
      scenario: test.scenario,
      passed: results.leadScore >= test.expectedOutcome.leadScore,
      actualScore: results.leadScore,
      expectedScore: test.expectedOutcome.leadScore,
      leadCaptured: results.leadCaptured,
      qualificationLevel: results.qualificationLevel,
      processingMetrics: results.metrics
    };
  })
);
```

### Example 2: Performance Benchmarking

**Scenario**: Testing response time and quality under various conditions.

```typescript
// Performance benchmark test
const performanceBenchmark = {
  testConditions: [
    {
      name: "Cold Cache",
      setup: async () => await clearAllCaches(),
      description: "Test with empty caches"
    },
    {
      name: "Warm Knowledge Cache", 
      setup: async () => await warmKnowledgeCache(configId),
      description: "Test with pre-loaded knowledge vectors"
    },
    {
      name: "High Concurrency",
      setup: async () => await setupConcurrentSessions(10),
      description: "Test with multiple simultaneous sessions"
    }
  ],
  
  testQueries: [
    "What services do you offer?",           // Simple knowledge lookup
    "How does your pricing compare to competitors?", // Complex knowledge synthesis
    "I need a demo for our 500-person company",     // Lead qualification
    "Can you integrate with Salesforce and HubSpot?" // Technical integration query
  ],
  
  performanceMetrics: {
    responseTime: {
      target: 3000,    // 3 seconds max
      warning: 2000,   // 2 seconds warning
      excellent: 1000  // 1 second excellent
    },
    qualityScore: {
      target: 0.8,     // 80% minimum quality
      excellent: 0.9   // 90% excellent quality
    },
    knowledgeUtilization: {
      target: 0.7      // 70% knowledge utilization
    }
  }
};

// Execute performance tests
const benchmarkResults = await runPerformanceBenchmark(
  configId,
  performanceBenchmark
);
```

## Integration Examples

### Example 1: React Component Integration

**Scenario**: Embedding the chatbot widget in a React application.

```tsx
import React, { useState, useEffect } from 'react';
import { ChatbotWidget } from '@yourapp/chatbot-widget-react';

function ProductPage({ productId }: { productId: string }) {
  const [chatConfig, setChatConfig] = useState(null);
  
  // Load chatbot configuration
  useEffect(() => {
    fetch(`/api/chatbot-widget/config/${process.env.NEXT_PUBLIC_CHATBOT_CONFIG_ID}`)
      .then(res => res.json())
      .then(config => setChatConfig(config));
  }, []);
  
  // Handle lead capture events
  const handleLeadCaptured = (leadData) => {
    // Track lead capture in analytics
    analytics.track('Lead Captured', {
      source: 'chatbot',
      page: 'product',
      productId,
      leadScore: leadData.score
    });
    
    // Optionally show success message
    toast.success('Thanks for your interest! A team member will contact you soon.');
  };
  
  // Handle conversation events
  const handleConversationEnd = (summary) => {
    // Track conversation completion
    analytics.track('Conversation Completed', {
      duration: summary.duration,
      messageCount: summary.messageCount,
      satisfaction: summary.satisfactionScore
    });
  };
  
  if (!chatConfig) return null;
  
  return (
    <div>
      {/* Your product page content */}
      <main>
        <h1>Product Details</h1>
        {/* ... product content ... */}
      </main>
      
      {/* Chatbot Widget */}
      <ChatbotWidget
        config={chatConfig}
        initialContext={{
          pageType: 'product',
          productId,
          userIntent: 'product_inquiry'
        }}
        theme={{
          colors: {
            primary: '#0066cc',
            secondary: '#f0f8ff'
          }
        }}
        position="bottom-right"
        onLeadCaptured={handleLeadCaptured}
        onConversationEnd={handleConversationEnd}
        onError={(error) => console.error('Chatbot error:', error)}
      />
    </div>
  );
}
```

### Example 2: WordPress Plugin Integration

**Scenario**: Using the chatbot in a WordPress environment.

```php
<?php
// WordPress plugin integration
class ChatbotWidgetPlugin {
    
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_widget'));
        add_shortcode('chatbot_widget', array($this, 'shortcode_handler'));
    }
    
    public function enqueue_scripts() {
        wp_enqueue_script(
            'chatbot-widget',
            'https://cdn.yourapp.com/chatbot-widget.js',
            array(),
            '1.0.0',
            true
        );
        
        // Pass configuration to JavaScript
        wp_localize_script('chatbot-widget', 'chatbotConfig', array(
            'configId' => get_option('chatbot_config_id'),
            'apiUrl' => home_url('/api/chatbot-widget'),
            'currentPage' => get_queried_object_id(),
            'userLoggedIn' => is_user_logged_in()
        ));
    }
    
    public function render_widget() {
        if (!get_option('chatbot_enabled')) return;
        
        ?>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            window.ChatbotWidget.init({
                configId: chatbotConfig.configId,
                theme: 'wordpress',
                position: '<?php echo get_option('chatbot_position', 'bottom-right'); ?>',
                initialContext: {
                    pageType: '<?php echo is_page() ? "page" : (is_single() ? "post" : "other"); ?>',
                    pageId: chatbotConfig.currentPage,
                    userLoggedIn: chatbotConfig.userLoggedIn
                },
                onLeadCaptured: function(lead) {
                    // Send lead data to WordPress
                    fetch('/wp-admin/admin-ajax.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            action: 'chatbot_lead_captured',
                            lead_data: JSON.stringify(lead),
                            nonce: '<?php echo wp_create_nonce('chatbot_lead'); ?>'
                        })
                    });
                }
            });
        });
        </script>
        <?php
    }
    
    public function shortcode_handler($atts) {
        $atts = shortcode_atts(array(
            'config_id' => get_option('chatbot_config_id'),
            'theme' => 'default',
            'position' => 'inline'
        ), $atts);
        
        return sprintf(
            '<div class="chatbot-widget-inline" data-config-id="%s" data-theme="%s"></div>',
            esc_attr($atts['config_id']),
            esc_attr($atts['theme'])
        );
    }
}

new ChatbotWidgetPlugin();
?>
```

### Example 3: Shopify Store Integration

**Scenario**: E-commerce integration with product context awareness.

```javascript
// Shopify theme integration
(function() {
    // Extract product context from Shopify
    const productContext = {
        productId: window.ShopifyAnalytics?.meta?.product?.id,
        productTitle: window.ShopifyAnalytics?.meta?.product?.title,
        productPrice: window.ShopifyAnalytics?.meta?.product?.price,
        productType: window.ShopifyAnalytics?.meta?.product?.type,
        cartValue: window.ShopifyAnalytics?.meta?.cart?.total_price,
        currency: window.Shopify?.currency?.active
    };
    
    // Initialize chatbot with e-commerce context
    window.ChatbotWidget.init({
        configId: 'config_ecommerce_123',
        theme: 'shopify',
        position: 'bottom-right',
        
        initialContext: {
            pageType: window.location.pathname.includes('/products/') ? 'product' : 'general',
            ecommerce: productContext,
            userAgent: navigator.userAgent
        },
        
        // E-commerce specific event handlers
        onLeadCaptured: function(lead) {
            // Track in Shopify analytics
            if (window.ShopifyAnalytics && window.ShopifyAnalytics.lib) {
                window.ShopifyAnalytics.lib.track('Lead Captured', {
                    source: 'chatbot',
                    product_id: productContext.productId,
                    lead_score: lead.score
                });
            }
            
            // Add lead to Shopify customer notes
            if (lead.contactInfo.email) {
                fetch('/api/chatbot-widget/shopify/customer-note', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: lead.contactInfo.email,
                        note: `Chatbot lead: ${lead.conversationSummary}`,
                        leadScore: lead.score
                    })
                });
            }
        },
        
        // Product recommendation integration
        onProductInquiry: function(inquiry) {
            // Query Shopify product recommendations
            fetch(`/recommendations/products.json?product_id=${productContext.productId}&limit=4`)
                .then(response => response.json())
                .then(data => {
                    // Send recommendations back to chatbot
                    return window.ChatbotWidget.injectContext({
                        type: 'product_recommendations',
                        products: data.products.map(p => ({
                            title: p.title,
                            price: p.price,
                            url: p.url,
                            image: p.featured_image
                        }))
                    });
                });
        }
    });
})();
```

## Error Handling & Recovery

### Example 1: Graceful Service Degradation

**Scenario**: Handling AI service outages with fallback responses.

```typescript
// Error handling configuration
const errorHandlingConfig = {
  fallbackStrategies: {
    aiServiceDown: {
      strategy: 'template_responses',
      templates: {
        greeting: "Hello! I'm currently experiencing technical difficulties with my AI features, but I can still help connect you with our team.",
        generalInquiry: "I apologize, but I'm having trouble processing your request right now. Would you like me to connect you with a human representative?",
        leadCapture: "I'd love to help you, but I'm experiencing some technical issues. Can you please provide your contact information so our team can follow up directly?"
      }
    },
    
    knowledgeBaseDown: {
      strategy: 'cached_responses',
      cacheValidation: true,
      fallbackMessage: "I'm having trouble accessing our knowledge base right now, but I can connect you with someone who can help immediately."
    },
    
    databaseDown: {
      strategy: 'graceful_degradation',
      allowReadOnly: true,
      disableFeatures: ['session_persistence', 'lead_storage'],
      userMessage: "We're experiencing temporary technical difficulties. Your conversation will continue, but some features may be limited."
    }
  }
};

// Error recovery implementation
const handleChatError = async (error, context) => {
  try {
    // Classify error type
    const errorType = classifyError(error);
    
    switch (errorType) {
      case 'AI_SERVICE_UNAVAILABLE':
        return {
          response: errorHandlingConfig.fallbackStrategies.aiServiceDown.templates.generalInquiry,
          fallbackMode: true,
          suggestedAction: 'escalate_to_human'
        };
        
      case 'KNOWLEDGE_BASE_ERROR':
        // Try cached knowledge first
        const cachedResponse = await tryKnowledgeCache(context.userMessage);
        if (cachedResponse) {
          return {
            response: cachedResponse,
            source: 'cache',
            disclaimer: "This response is from our cached knowledge and may not be the most current information."
          };
        }
        
        return {
          response: "I'm having trouble accessing our knowledge base. Let me connect you with a specialist who can provide the most accurate information.",
          fallbackMode: true,
          suggestedAction: 'escalate_to_human'
        };
        
      case 'RATE_LIMIT_EXCEEDED':
        return {
          response: "I'm currently experiencing high demand. Please wait a moment and try again, or I can connect you with our team for immediate assistance.",
          retryAfter: 30,
          suggestedAction: 'wait_and_retry'
        };
        
      default:
        // Log unknown error for investigation
        await logError(error, context);
        
        return {
          response: "I encountered an unexpected issue. Let me connect you with our support team to ensure you get the help you need.",
          fallbackMode: true,
          suggestedAction: 'escalate_to_human'
        };
    }
  } catch (recoveryError) {
    // Ultimate fallback
    return {
      response: "I apologize, but I'm experiencing technical difficulties. Please contact our support team directly at support@company.com or call 1-800-SUPPORT.",
      criticalFailure: true
    };
  }
};
```

### Example 2: User Input Validation & Sanitization

**Scenario**: Handling malicious or problematic user inputs.

```typescript
// Input validation pipeline
const validateUserInput = async (userMessage, sessionContext) => {
  const validationResults = {
    isValid: true,
    sanitizedMessage: userMessage,
    warnings: [],
    blocked: false
  };
  
  // 1. Length validation
  if (userMessage.length > 4000) {
    validationResults.warnings.push('Message truncated to maximum length');
    validationResults.sanitizedMessage = userMessage.substring(0, 4000);
  }
  
  if (userMessage.length < 1) {
    validationResults.isValid = false;
    validationResults.warnings.push('Empty message not allowed');
  }
  
  // 2. Content sanitization
  validationResults.sanitizedMessage = sanitizeHtml(validationResults.sanitizedMessage, {
    allowedTags: [],
    allowedAttributes: {}
  });
  
  // 3. Prompt injection detection
  const injectionPatterns = [
    /ignore (previous|all) instructions/i,
    /you are now (a|an)/i,
    /system prompt/i,
    /\[INST\]|\[\/INST\]/g,
    /<\|system\|>|<\|user\|>|<\|assistant\|>/g
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(userMessage)) {
      validationResults.warnings.push('Potential prompt injection detected');
      validationResults.sanitizedMessage = validationResults.sanitizedMessage.replace(pattern, '[FILTERED]');
    }
  }
  
  // 4. Spam detection
  if (sessionContext.messageCount > 20 && sessionContext.timeSpan < 300000) { // 20 messages in 5 minutes
    validationResults.warnings.push('High message frequency detected');
    if (sessionContext.messageCount > 50) {
      validationResults.blocked = true;
      validationResults.isValid = false;
    }
  }
  
  // 5. Inappropriate content detection
  const inappropriateContent = await detectInappropriateContent(userMessage);
  if (inappropriateContent.confidence > 0.8) {
    validationResults.blocked = true;
    validationResults.isValid = false;
    validationResults.warnings.push('Inappropriate content detected');
  }
  
  // 6. PII detection and handling
  const piiDetection = detectPII(userMessage);
  if (piiDetection.found) {
    validationResults.warnings.push('Personal information detected');
    // Optionally redact PII for logging while preserving for conversation
    validationResults.sanitizedForLogging = redactPII(userMessage, piiDetection.entities);
  }
  
  return validationResults;
};

// Error response for blocked content
const handleBlockedContent = (validationResults) => {
  if (validationResults.blocked) {
    return {
      response: "I'm not able to process that type of message. Please keep our conversation professional and on-topic. How can I help you with our products or services?",
      blocked: true,
      sessionAction: 'warn_user'
    };
  }
  
  if (validationResults.warnings.length > 0) {
    // Log warnings but continue conversation
    console.warn('Input validation warnings:', validationResults.warnings);
  }
  
  return null; // Continue normal processing
};
```

---

## Conclusion

These comprehensive examples demonstrate the chatbot-widget domain's versatility and robust capabilities across various scenarios:

### Key Demonstrated Capabilities:
- **Sophisticated Lead Qualification**: Progressive scoring and context-aware lead nurturing
- **Advanced AI Integration**: Multi-intent detection, entity extraction, and knowledge retrieval  
- **Flexible Configuration**: Enterprise and small business setup examples
- **Comprehensive Testing**: Performance benchmarking and quality assessment
- **Multi-Platform Integration**: React, WordPress, and Shopify implementations
- **Robust Error Handling**: Graceful degradation and security validation

### Best Practices Illustrated:
- **Progressive Context Building**: Accumulating user information across conversation turns
- **Semantic Knowledge Integration**: Vector-based content retrieval and synthesis
- **Performance Optimization**: Caching strategies and response time management
- **Security Implementation**: Input validation, sanitization, and injection prevention
- **User Experience Focus**: Graceful error handling and fallback strategies

These examples serve as both implementation guides and demonstration of the platform's enterprise-grade capabilities, making it suitable for organizations of all sizes across various industries and use cases.