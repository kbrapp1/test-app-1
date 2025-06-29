/**
 * OpenAI Function Schema Builder
 * 
 * AI INSTRUCTIONS:
 * - This class is the single source of truth for generating OpenAI function schemas.
 * - It uses a dynamic, context-aware approach to build efficient schemas.
 * - All entity definitions are centralized in ENTITY_DEFINITIONS to prevent redundancy.
 * - Legacy static schema builders have been removed.
 */
import { OpenAIFunctionSchema } from '../types/OpenAITypes';

export class OpenAIFunctionSchemaBuilder {

  /**
   * @private
   * Centralized store for all entity definitions. Single source of truth.
   * Following @golden-rule: Enhanced descriptions for comprehensive extraction
   */
  private static readonly ENTITY_DEFINITIONS = {
    visitorName: {
      type: "string",
      description: "CRITICAL: Extract visitor's name when they introduce themselves. Include full names ('John Smith'), partial names ('John'), or professional titles ('Dr. Smith'). Never miss name introductions - essential for personalization."
    },
    company: { 
      type: "string", 
      description: "Company or organization name. Include formal names ('Acme Corp'), business descriptions ('my consulting firm'), or informal references ('our startup', 'my company'). Normalize capitalization." 
    },
    role: { 
      type: "string", 
      description: "Job title, position, or professional role. Extract executive roles (CEO, CTO), management (Manager, Director), functional roles (Developer, Engineer), or decision authority ('I make decisions', 'I handle procurement'). Normalize to standard categories." 
    },
    industry: { 
      type: "string", 
      description: "Industry, business sector, or market vertical. Extract from explicit mentions or infer from business context. Normalize to standard industry categories." 
    },
    budget: { 
      type: "string", 
      description: "Budget, investment capacity, or financial constraints. Extract specific amounts ('$50K'), ranges ('5-10K monthly'), or general indicators ('limited budget', 'enterprise budget'). Normalize format." 
    },
    timeline: { 
      type: "string", 
      description: "Implementation timeline, decision timeframe, or project deadlines. Extract specific dates ('Q2 2025'), durations ('3 months'), or urgency indicators ('ASAP', 'next quarter'). Normalize to specific timeframes." 
    },
    urgency: { 
      type: "string", 
      enum: ["low", "medium", "high"],
      description: "Urgency level inferred from context, timeline pressure, business impact, or explicit statements about timing requirements."
    },
    decisionMakers: {
      type: "array",
      items: { type: "string" },
      description: "Other decision makers, stakeholders, or people involved in the decision process. Extract names, roles, or references to approval processes. Validate authority levels."
    },
    teamSize: { 
      type: "string", 
      description: "Team size, department size, or company scale. Extract specific numbers ('10 people'), ranges ('50-100 employees'), or scale indicators ('small team', 'enterprise'). Normalize to ranges." 
    },
    currentSolution: { 
      type: "string", 
      description: "Current tools, solutions, vendors, or systems they use. Extract product names, competitor mentions, or technology stack references. Normalize to standard product/vendor names." 
    },
    painPoints: {
      type: "array",
      items: { type: "string" },
      description: "Specific business problems, challenges, inefficiencies, or obstacles mentioned. Extract explicit complaints, process issues, or improvement needs. Categorize by business function."
    },
    preferredTime: { 
      type: "string", 
      description: "Preferred meeting or contact time when mentioned. Extract specific times, date ranges, or scheduling preferences. Normalize to specific time formats." 
    },
    contactMethod: {
      type: "string",
      enum: ["email", "phone", "meeting"],
      description: "Preferred contact or communication method if explicitly mentioned or strongly implied from context."
    }
  };

  /**
   * Unified Schema with Dynamic Entity Extraction (2025 Best Practice)
   * 
   * AI INSTRUCTIONS:
   * - Use selective entity extraction based on conversation context
   * - Only extract missing entities relevant to current conversation phase
   * - Reduce token usage by 70-85% compared to static extraction
   * - Follow progressive discovery pattern: "once discovered, stop looking"
   */
  static buildUnifiedChatbotSchemaWithContext(
    existingEntities?: any, 
    conversationPhase?: string, 
    userMessage?: string
  ): OpenAIFunctionSchema {
    return {
      name: "process_chatbot_interaction_complete",
      description: "Complete chatbot processing with selective entity extraction: analyze user intent and missing entities, generate appropriate response, calculate lead score, and determine next actions",
      parameters: {
        type: "object",
        properties: {
          analysis: {
            type: "object",
            properties: {
              primaryIntent: {
                type: "string",
                enum: [
                  "greeting", "faq_general", "faq_pricing", "faq_features",
                  "sales_inquiry", "booking_request", "demo_request", "support_request",
                  "objection_handling", "qualification", "closing", "unknown"
                ],
                description: "Primary user intent classification"
              },
              primaryConfidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Confidence score for primary intent"
              },
              entities: this.buildDynamicEntitySchema(existingEntities, conversationPhase, userMessage),
              corrections: this.buildCorrectionsSchema(),
              sentiment: {
                type: "string",
                enum: ["positive", "neutral", "negative"],
                description: "Overall sentiment of the user message"
              },
              sentimentConfidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Confidence score for sentiment classification"
              },
              emotionalTone: {
                type: "string",
                enum: ["excited", "frustrated", "curious", "concerned", "satisfied", "urgent", "casual", "formal"],
                description: "Specific emotional tone detected in the message"
              },
              reasoning: {
                type: "string",
                description: "Analysis reasoning and context"
              }
            },
            required: ["primaryIntent", "primaryConfidence", "entities", "sentiment", "reasoning"]
          },
          conversationFlow: {
            type: "object",
            properties: {
              shouldCaptureLeadNow: {
                type: "boolean",
                description: "Whether this is the optimal moment to capture lead information"
              },
              shouldAskQualificationQuestions: {
                type: "boolean", 
                description: "Whether qualification questions would be appropriate"
              },
              shouldEscalateToHuman: {
                type: "boolean",
                description: "Whether this conversation requires human intervention"
              },
              nextBestAction: {
                type: "string",
                enum: ["continue_conversation", "capture_contact", "ask_qualification", "request_demo", "escalate_human", "provide_resources"],
                description: "AI-recommended next action"
              },
              conversationPhase: {
                type: "string",
                enum: ["discovery", "qualification", "demonstration", "closing", "support", "escalation"],
                description: "Current phase of the conversation"
              },
              engagementLevel: {
                type: "string",
                enum: ["low", "medium", "high", "very_high"],
                description: "Current user engagement level"
              }
            },
            required: ["shouldCaptureLeadNow", "nextBestAction", "conversationPhase", "engagementLevel"]
          },
          // REMOVED: leadScore - Domain layer calculates this via DomainConstants
          // AI focuses on entity extraction only, not business scoring calculations
          response: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "Natural, conversational response content"
              },
              tone: {
                type: "string",
                enum: ["professional", "friendly", "consultative", "educational", "urgent"],
                description: "Appropriate tone for the response"
              },
              callToAction: {
                type: "string",
                enum: ["demo_request", "contact_capture", "information_gathering", "none"],
                description: "Suggested call-to-action if appropriate"
              },
              shouldTriggerLeadCapture: {
                type: "boolean",
                description: "Whether response should trigger lead capture flow"
              }
            },
            required: ["content", "tone", "callToAction", "shouldTriggerLeadCapture"]
          }
        },
        required: ["analysis", "conversationFlow", "response"]
      }
    };
  }

  /**
   * @private
   * Build dynamic entity schema based on conversation context.
   * FIXED: Always include core identity entities for re-extraction and validation
   */
  private static buildDynamicEntitySchema(existingEntities?: any, conversationPhase?: string, userMessage?: string): any {
    const schema: any = {
      type: "object",
      properties: {}
    };

    // FIXED: Always include core identity entities for validation and re-extraction
    // Following @golden-rule: AI should always have opportunity to extract all entity values
    const addEntity = (name: keyof typeof OpenAIFunctionSchemaBuilder.ENTITY_DEFINITIONS) => {
      schema.properties[name] = this.ENTITY_DEFINITIONS[name];
    };

    // Core identity entities - ALWAYS include these for comprehensive extraction
    addEntity('visitorName');
    addEntity('company');
    addEntity('role');
    addEntity('industry');

    // Add contextual entities based on conversation phase or content
    switch (conversationPhase) {
      case 'greeting':
      case 'introduction':
        // Identity entities already added above
        break;

      case 'business_inquiry':
      case 'discovery':
        addEntity('teamSize');
        addEntity('currentSolution');
        schema.properties.painPoints = this.ENTITY_DEFINITIONS.painPoints;
        break;

      case 'qualification':
      case 'pricing_discussion':
        addEntity('budget');
        addEntity('timeline');
        addEntity('urgency');
        schema.properties.decisionMakers = this.ENTITY_DEFINITIONS.decisionMakers;
        break;

      case 'scheduling':
      case 'booking':
        addEntity('preferredTime');
        addEntity('contactMethod');
        break;

      default:
        // For unknown phases, include business context entities
        addEntity('teamSize');
        addEntity('budget');
        addEntity('timeline');
        addEntity('urgency');
        addEntity('contactMethod');
        schema.properties.painPoints = this.ENTITY_DEFINITIONS.painPoints;
        schema.properties.decisionMakers = this.ENTITY_DEFINITIONS.decisionMakers;
    }

    // Always include budget and timeline if pricing/timeline intent detected
    if (userMessage) {
      if (this.detectsPricingIntent(userMessage)) {
        addEntity('budget');
      }
      if (this.detectsTimelineIntent(userMessage)) {
        addEntity('timeline');
      }
      if (this.detectsUrgencyIntent(userMessage)) {
        addEntity('urgency');
      }
    }

    // Add corrections schema if user message suggests corrections
    if (userMessage && this.detectsCorrection(userMessage)) {
      schema.properties.corrections = this.buildCorrectionsSchema();
    }
    
    return schema;
  }

  /**
   * @private
   * Helper methods for selective extraction
   */
  private static detectsCorrection(message: string): boolean {
    const correctionPatterns = [
      /actually|correction|wrong|mistake|meant to say|not|isn't|should be/i
    ];
    return correctionPatterns.some(pattern => pattern.test(message));
  }

  private static detectsPricingIntent(message: string): boolean {
    const pricingPatterns = [
      /budget|cost|price|pricing|expensive|affordable|investment|spend/i
    ];
    return pricingPatterns.some(pattern => pattern.test(message));
  }

  private static detectsTimelineIntent(message: string): boolean {
    const timelinePatterns = [
      /when|timeline|deadline|soon|urgent|asap|next|month|quarter|year/i
    ];
    return timelinePatterns.some(pattern => pattern.test(message));
  }

  private static detectsUrgencyIntent(message: string): boolean {
    const urgencyPatterns = [
      /urgent|asap|next|month|quarter|year/i
    ];
    return urgencyPatterns.some(pattern => pattern.test(message));
  }

  private static buildCorrectionsSchema(): any {
    return {
      type: "object",
      description: "Entity corrections, removals, and clarifications mentioned by user",
      properties: {
        correctedBudget: {
          type: "string",
          description: "Explicit budget correction"
        },
        correctedTimeline: {
          type: "string", 
          description: "Explicit timeline correction"
        },
        correctedCompany: {
          type: "string",
          description: "Explicit company name correction"
        }
      }
    };
  }
} 