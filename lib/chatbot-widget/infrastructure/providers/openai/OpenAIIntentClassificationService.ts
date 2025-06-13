import { IIntentClassificationService, IntentClassificationContext } from '../../../domain/services/IIntentClassificationService';
import { IntentResult, IntentType, ExtractedEntities } from '../../../domain/value-objects/IntentResult';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IDebugInformationService } from '../../../domain/services/IDebugInformationService';
import OpenAI from 'openai';

export interface OpenAIIntentConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export class OpenAIIntentClassificationService implements IIntentClassificationService {
  private readonly config: OpenAIIntentConfig;
  private readonly client: OpenAI;
  private readonly debugService: IDebugInformationService | null = null;

  constructor(config: OpenAIIntentConfig, debugService?: IDebugInformationService) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.debugService = debugService || null;
  }

  /**
   * Capture API call for debugging (if debug service available)
   */
  private captureApiCall(
    sessionId: string | null,
    requestData: any,
    responseData: any,
    processingTime: number
  ): void {
    if (this.debugService && sessionId) {
      const apiCallInfo = this.debugService.captureApiCall(
        'first',
        requestData,
        responseData,
        processingTime
      );
      this.debugService.addApiCallToSession(sessionId, 'first', apiCallInfo);
    }
  }

  /**
   * Classify intent using OpenAI function calling for structured output
   */
  async classifyIntent(
    message: string,
    context: IntentClassificationContext
  ): Promise<IntentResult> {
    return this.classifyIntentEnhanced(message, context.messageHistory, context.session?.id);
  }

  async classifyIntentEnhanced(
    message: string,
    messageHistory: ChatMessage[],
    sessionId?: string
  ): Promise<IntentResult> {
    try {
      const startTime = Date.now();

      // Enhanced function schema with multi-intent support
      const functions = [{
        name: "classify_intent_and_persona",
        description: "Classify user intent, extract entities, and infer persona information",
        parameters: {
          type: "object",
          properties: {
            // Primary intent classification
            primaryIntent: {
              type: "string",
              enum: [
                "greeting", "faq_general", "faq_pricing", "faq_features",
                "sales_inquiry", "booking_request", "demo_request", "support_request",
                "objection_handling", "qualification", "closing", "unknown"
              ],
              description: "The most likely intent of the user's message"
            },
            primaryConfidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Confidence score for the primary intent"
            },
            
            // Alternative intents for disambiguation
            alternativeIntents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  intent: {
                    type: "string",
                    enum: [
                      "greeting", "faq_general", "faq_pricing", "faq_features",
                      "sales_inquiry", "booking_request", "demo_request", "support_request",
                      "objection_handling", "qualification", "closing", "unknown"
                    ]
                  },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  reasoning: { type: "string" }
                }
              },
              description: "Alternative intent possibilities with confidence scores"
            },

            // Enhanced entity extraction
            entities: {
              type: "object",
              properties: {
                // Core business entities
                budget: { type: "string", description: "Budget information mentioned" },
                timeline: { type: "string", description: "Timeline or urgency mentioned" },
                company: { type: "string", description: "Company name or description" },
                teamSize: { type: "string", description: "Team or company size mentioned" },
                industry: { type: "string", description: "Industry or business type" },
                role: { type: "string", description: "User's job title or role" },
                location: { type: "string", description: "Geographic location mentioned" },
                urgency: { 
                  type: "string", 
                  enum: ["low", "medium", "high"],
                  description: "Urgency level inferred from context"
                },
                contactMethod: {
                  type: "string",
                  enum: ["email", "phone", "meeting"],
                  description: "Preferred contact method if mentioned"
                },

                // Scheduling entities
                preferredTime: { type: "string", description: "Preferred meeting time mentioned" },
                timezone: { type: "string", description: "Timezone mentioned or inferred" },
                availability: { type: "string", description: "Availability preferences mentioned" },
                eventType: {
                  type: "string",
                  enum: ["demo", "consultation", "onboarding", "support_call", "sales_call"],
                  description: "Type of meeting or event requested"
                },

                // Product/feature entities
                productName: { type: "string", description: "Specific product mentioned" },
                featureName: { type: "string", description: "Specific feature mentioned" },
                integrationNeeds: {
                  type: "array",
                  items: { type: "string" },
                  description: "Integration requirements mentioned"
                },

                // Support entities
                issueType: {
                  type: "string",
                  enum: ["technical", "billing", "feature_request", "bug_report", "general"],
                  description: "Type of support issue"
                },
                severity: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                  description: "Severity of the issue"
                },
                affectedFeature: { type: "string", description: "Feature experiencing issues" },

                // Advanced qualification entities
                currentSolution: { type: "string", description: "Current solution they're using" },
                painPoints: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific problems or pain points mentioned"
                },
                decisionMakers: {
                  type: "array",
                  items: { type: "string" },
                  description: "Other people involved in the decision"
                },
                evaluationCriteria: {
                  type: "array",
                  items: { type: "string" },
                  description: "Factors important in their evaluation"
                }
              }
            },

            // Persona inference
            personaInference: {
              type: "object",
              properties: {
                role: {
                  type: "string",
                  enum: [
                    "ceo", "cto", "cfo", "vp_sales", "vp_marketing", "vp_operations",
                    "sales_manager", "marketing_manager", "operations_manager",
                    "sales_rep", "marketing_specialist", "it_admin", "developer",
                    "consultant", "analyst", "coordinator", "assistant",
                    "founder", "owner", "director", "manager", "individual_contributor",
                    "unknown"
                  ]
                },
                industry: {
                  type: "string",
                  enum: [
                    "technology", "healthcare", "finance", "education", "retail",
                    "manufacturing", "real_estate", "consulting", "legal", "marketing",
                    "non_profit", "government", "automotive", "energy", "media",
                    "hospitality", "construction", "agriculture", "transportation",
                    "telecommunications", "unknown"
                  ]
                },
                companySize: {
                  type: "string",
                  enum: ["startup", "small", "medium", "large", "enterprise"]
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                evidence: {
                  type: "array",
                  items: { type: "string" },
                  description: "Evidence supporting the persona inference"
                }
              }
            },

            // Disambiguation context
            disambiguationContext: {
              type: "object",
              properties: {
                isAmbiguous: { type: "boolean" },
                contextualClues: {
                  type: "array",
                  items: { type: "string" },
                  description: "Contextual clues that help with disambiguation"
                },
                suggestedClarifications: {
                  type: "array",
                  items: { type: "string" },
                  description: "Questions to ask for clarification"
                }
              }
            },

            reasoning: {
              type: "string",
              description: "Explanation of the classification decision"
            }
          },
          required: ["primaryIntent", "primaryConfidence", "entities", "reasoning"]
        }
      }];

      // Enhanced system prompt with persona awareness
      const systemPrompt = this.buildEnhancedSystemPrompt(messageHistory);

      // Convert ChatMessage history to OpenAI format
      const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...this.formatConversationHistory(messageHistory),
        { role: "user", content: message }
      ];

      const requestPayload = {
        model: this.config.model,
        messages: openAIMessages,
        functions: functions,
        function_call: { name: "classify_intent_and_persona" },
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      };

      // Prepare request data for debug capture
      const requestData = {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        timestamp: new Date().toISOString(),
        payload: requestPayload,
        payloadSize: `${JSON.stringify(requestPayload).length} characters`,
        messageCount: openAIMessages.length,
        conversationHistoryLength: messageHistory.length,
        userMessage: message
      };

      // Console log the first API call request
      console.log('🔥 FIRST API CALL (Intent Classification) - REQUEST:');
      console.log(JSON.stringify(requestData, null, 2));

      const response = await this.client.chat.completions.create(requestPayload);

      const processingTime = Date.now() - startTime;
      
      // Prepare response data for debug capture
      const responseData = {
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        response: response,
        responseSize: `${JSON.stringify(response).length} characters`
      };

      // Console log the first API call response
      console.log('🔥 FIRST API CALL (Intent Classification) - RESPONSE:');
      console.log(JSON.stringify(responseData, null, 2));

      // Capture API call for debugging
      if (sessionId) {
        this.captureApiCall(sessionId, requestData, responseData, processingTime);
      }

      const functionCall = response.choices[0]?.message?.function_call;

      if (!functionCall || !functionCall.arguments) {
        throw new Error('No function call response received from OpenAI');
      }

      const result = JSON.parse(functionCall.arguments);

      // Create enhanced IntentResult with disambiguation support
      return IntentResult.create(
        result.primaryIntent,
        result.primaryConfidence,
        result.entities || {},
        result.reasoning,
        {
          model: this.config.model,
          processingTimeMs: processingTime,
          alternativeIntents: result.alternativeIntents || []
        }
      );

    } catch (error) {
      console.error('Error in OpenAI intent classification:', error);
      
      // Fallback to rule-based classification on error
      const fallbackResult = this.ruleBasedClassification(message, {
        chatbotConfig: {} as any,
        session: {} as any,
        messageHistory,
        currentMessage: message
      });

      return IntentResult.create(
        fallbackResult.intent,
        fallbackResult.confidence,
        fallbackResult.entities,
        fallbackResult.reasoning,
        {
          model: this.config.model,
          processingTimeMs: Date.now() - Date.now(),
          alternativeIntents: fallbackResult.alternativeIntents
        }
      );
    }
  }

  /**
   * Convert ChatMessage history to OpenAI message format
   */
  private formatConversationHistory(messageHistory: ChatMessage[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messageHistory.slice(-10).map(msg => ({
      role: msg.messageType === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
  }

  /**
   * Quick classification without full context
   */
  async classifyIntentQuick(message: string): Promise<IntentResult> {
    const startTime = Date.now();

    try {
      const quickMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { 
          role: "system", 
          content: "You are an intent classifier. Classify the user's message into one of these intents: greeting, faq_general, faq_pricing, faq_features, sales_inquiry, booking_request, demo_request, support_request, objection_handling, qualification, closing, unknown. Respond with just the intent name."
        },
        { role: "user", content: message }
      ];

      const quickRequestPayload = {
        model: this.config.model,
        messages: quickMessages,
        temperature: 0.1,
        max_tokens: 50
      };

      // Console log the quick intent classification request
      console.log('⚡ QUICK INTENT CLASSIFICATION - REQUEST:', {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        timestamp: new Date().toISOString(),
        payload: {
          model: quickRequestPayload.model,
          messages: quickMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: quickRequestPayload.temperature,
          max_tokens: quickRequestPayload.max_tokens
        },
        payloadSize: JSON.stringify(quickRequestPayload).length + ' characters',
        userMessage: message
      });

      const response = await this.client.chat.completions.create(quickRequestPayload);

      // Console log the quick intent classification response
      console.log('⚡ QUICK INTENT CLASSIFICATION - RESPONSE:', {
        timestamp: new Date().toISOString(),
        processingTime: (Date.now() - startTime) + 'ms',
        response: {
          id: response.id,
          model: response.model,
          usage: {
            prompt_tokens: response.usage?.prompt_tokens,
            completion_tokens: response.usage?.completion_tokens,
            total_tokens: response.usage?.total_tokens,
            prompt_tokens_details: response.usage?.prompt_tokens_details,
            completion_tokens_details: response.usage?.completion_tokens_details
          },
          choices: response.choices.map(choice => ({
            index: choice.index,
            message: {
              role: choice.message?.role,
              content: choice.message?.content,
              function_call: choice.message?.function_call ? {
                name: choice.message.function_call.name,
                arguments: choice.message.function_call.arguments
              } : null
            },
            finish_reason: choice.finish_reason
          })),
          responseSize: JSON.stringify(response).length + ' characters'
        }
      });

      const intentText = response.choices[0]?.message?.content?.trim().toLowerCase() || 'unknown';
      const validIntents: IntentType[] = [
        'greeting', 'faq_general', 'faq_pricing', 'faq_features',
        'sales_inquiry', 'booking_request', 'demo_request', 'support_request',
        'objection_handling', 'qualification', 'closing', 'unknown'
      ];

      const intent = validIntents.includes(intentText as IntentType) ? intentText as IntentType : 'unknown';
      const processingTime = Date.now() - startTime;

      return IntentResult.create(
        intent,
        intent === 'unknown' ? 0.1 : 0.8,
        {},
        `Quick classification: ${intent}`,
        {
          model: this.config.model,
          processingTimeMs: processingTime,
          alternativeIntents: []
        }
      );
    } catch (error) {
      console.error('Quick intent classification failed:', error);
      return IntentResult.createUnknown(`Quick classification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch classify multiple messages
   */
  async classifyIntentsBatch(
    messages: string[],
    context: IntentClassificationContext
  ): Promise<IntentResult[]> {
    // For now, process sequentially. Could be optimized for parallel processing
    const results: IntentResult[] = [];
    
    for (const message of messages) {
      const result = await this.classifyIntent(message, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Get confidence thresholds for different intent types
   */
  getConfidenceThreshold(intentType: string): number {
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

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const healthCheckPayload = {
        model: this.config.model,
        messages: [{ role: "user", content: "Hello" }] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        max_tokens: 5,
        temperature: 0
      };

      // Console log the health check request
      console.log('🏥 HEALTH CHECK - REQUEST:', {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        timestamp: new Date().toISOString(),
        payload: {
          model: healthCheckPayload.model,
          messages: healthCheckPayload.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: healthCheckPayload.max_tokens,
          temperature: healthCheckPayload.temperature
        }
      });

      const response = await this.client.chat.completions.create(healthCheckPayload);

      // Console log the health check response
      console.log('🏥 HEALTH CHECK - RESPONSE:', {
        timestamp: new Date().toISOString(),
        success: !!response.choices[0]?.message?.content,
        response: {
          id: response.id,
          model: response.model,
          usage: {
            prompt_tokens: response.usage?.prompt_tokens,
            completion_tokens: response.usage?.completion_tokens,
            total_tokens: response.usage?.total_tokens,
            prompt_tokens_details: response.usage?.prompt_tokens_details,
            completion_tokens_details: response.usage?.completion_tokens_details
          },
          choices: response.choices.map(choice => ({
            index: choice.index,
            message: {
              role: choice.message?.role,
              content: choice.message?.content,
              function_call: choice.message?.function_call ? {
                name: choice.message.function_call.name,
                arguments: choice.message.function_call.arguments
              } : null
            },
            finish_reason: choice.finish_reason
          }))
        }
      });

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('🏥 HEALTH CHECK - ERROR:', error);
      return false;
    }
  }

  /**
   * Build system prompt for intent classification
   */
  private buildSystemPrompt(context: IntentClassificationContext): string {
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
  private buildUserPrompt(message: string, context: IntentClassificationContext): string {
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
   * Rule-based classification fallback
   */
  private ruleBasedClassification(
    message: string,
    context: IntentClassificationContext
  ): {
    intent: IntentType;
    confidence: number;
    entities: ExtractedEntities;
    reasoning: string;
    alternativeIntents: Array<{ intent: IntentType; confidence: number }>;
  } {
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
   * Quick rule-based classification
   */
  private ruleBasedQuickClassification(message: string): {
    intent: IntentType;
    confidence: number;
    entities: ExtractedEntities;
    reasoning: string;
    alternativeIntents: Array<{ intent: IntentType; confidence: number }>;
  } {
    // Simplified version without context
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
  private extractEntitiesFromMessage(message: string, entities: ExtractedEntities): void {
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
  private matchesPattern(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

  /**
   * Build enhanced system prompt with persona awareness
   */
  private buildEnhancedSystemPrompt(
    conversationHistory: ChatMessage[]
  ): string {
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
- Consider conversation history for context`;

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
   * Extract behavior signals from conversation history
   */
  private extractBehaviorSignals(conversationHistory: ChatMessage[]): string[] {
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
   * Extract recent intents from conversation history
   */
  private extractRecentIntents(conversationHistory: ChatMessage[]): string[] {
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
} 