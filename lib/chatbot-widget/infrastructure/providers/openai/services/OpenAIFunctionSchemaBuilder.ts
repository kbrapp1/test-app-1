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
   */
  private static readonly ENTITY_DEFINITIONS = {
    visitorName: {
      type: "string",
      description: "Visitor's name when they introduce themselves (e.g., 'My name is John Smith'). Extract first name for personalization."
    },
    company: { 
      type: "string", 
      description: "Company name - normalize capitalization and remove common suffixes" 
    },
    role: { 
      type: "string", 
      description: "User's job title - normalize to standard role categories" 
    },
    industry: { 
      type: "string", 
      description: "Industry or business type - normalize to standard categories" 
    },
    budget: { 
      type: "string", 
      description: "Budget information - normalize to standard format (e.g., '$5,000/month', '50K annually')" 
    },
    timeline: { 
      type: "string", 
      description: "Timeline or urgency - normalize to specific timeframes (e.g., 'Q2 2025', '3 months')" 
    },
    urgency: { 
      type: "string", 
      enum: ["low", "medium", "high"],
      description: "Urgency level inferred from context"
    },
    decisionMakers: {
      type: "array",
      items: { type: "string" },
      description: "Other people involved in decision - normalize roles and validate authority levels"
    },
    teamSize: { 
      type: "string", 
      description: "Team or company size - normalize to ranges (e.g., '1-10', '50-100', '500+')" 
    },
    currentSolution: { 
      type: "string", 
      description: "Current solution they're using - normalize to standard product/vendor names" 
    },
    painPoints: {
      type: "array",
      items: { type: "string" },
      description: "Specific problems mentioned - categorize by business function"
    },
    preferredTime: { 
      type: "string", 
      description: "Preferred meeting time - normalize to specific time formats" 
    },
    contactMethod: {
      type: "string",
      enum: ["email", "phone", "meeting"],
      description: "Preferred contact method if mentioned"
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
   * Only extracts missing entities or those relevant to the current conversation phase.
   */
  private static buildDynamicEntitySchema(existingEntities?: any, conversationPhase?: string, userMessage?: string): any {
    const schema: any = {
      type: "object",
      properties: {}
    };

    const addEntity = (name: keyof typeof OpenAIFunctionSchemaBuilder.ENTITY_DEFINITIONS) => {
        if (!existingEntities?.[name]) {
            schema.properties[name] = this.ENTITY_DEFINITIONS[name];
        }
    }

    if (userMessage && this.detectsCorrection(userMessage)) {
      schema.properties.corrections = this.buildCorrectionsSchema();
    }

    switch (conversationPhase) {
      case 'greeting':
      case 'introduction':
        addEntity('visitorName');
        addEntity('company');
        addEntity('role');
        addEntity('industry');
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
    }

    if (userMessage) {
      if (this.detectsPricingIntent(userMessage) && !existingEntities?.budget && !schema.properties.budget) {
        schema.properties.budget = this.ENTITY_DEFINITIONS.budget;
      }
      if (this.detectsTimelineIntent(userMessage) && !existingEntities?.timeline && !schema.properties.timeline) {
        schema.properties.timeline = this.ENTITY_DEFINITIONS.timeline;
      }
    }
    
    if (Object.keys(schema.properties).length === 0) {
      schema.properties.generic = {
        type: "string",
        description: "Any relevant entity mentioned by the user, as no specific entities were targeted for extraction in this phase."
      };
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