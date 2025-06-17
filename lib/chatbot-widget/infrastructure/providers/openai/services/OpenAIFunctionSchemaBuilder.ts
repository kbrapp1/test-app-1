/**
 * OpenAI Function Schema Builder
 * 
 * Service for building OpenAI function calling schemas.
 * Single responsibility: Construct and manage function schemas for intent classification.
 */

import { OpenAIFunctionSchema } from '../types/OpenAITypes';

export class OpenAIFunctionSchemaBuilder {
  /**
   * Build the main intent classification function schema
   */
  static buildIntentClassificationSchema(): OpenAIFunctionSchema {
    return {
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
          entities: this.buildEntitySchema(),

          // Persona inference
          personaInference: this.buildPersonaSchema(),

          // Disambiguation context
          disambiguationContext: this.buildDisambiguationSchema(),

          reasoning: {
            type: "string",
            description: "Explanation of the classification decision"
          }
        },
        required: ["primaryIntent", "primaryConfidence", "entities", "reasoning"]
      }
    };
  }

  /**
   * Build entity extraction with corrections schema
   * 
   * AI INSTRUCTIONS:
   * - Extends existing entity extraction to include corrections detection
   * - Maintains backward compatibility with existing extraction
   * - Follow @golden-rule patterns exactly
   * - Support all entity types for removal and correction operations
   */
  static buildEntityExtractionWithCorrectionsSchema(): OpenAIFunctionSchema {
    return {
      name: "extract_entities_with_corrections",
      description: "Extract entities from user message, including corrections and removals",
      parameters: {
        type: "object",
        properties: {
          // Standard entity extraction (from existing schema)
          ...this.buildEntitySchema().properties,
          
          // NEW: Corrections detection
          corrections: {
            type: "object",
            description: "Entity corrections, removals, and clarifications mentioned by user",
            properties: {
              removedDecisionMakers: {
                type: "array",
                items: { type: "string" },
                description: "People explicitly stated as NOT being decision makers or no longer involved"
              },
              removedPainPoints: {
                type: "array",
                items: { type: "string" },
                description: "Pain points explicitly stated as resolved, not applicable, or incorrect"
              },
              removedIntegrationNeeds: {
                type: "array",
                items: { type: "string" },
                description: "Integration needs explicitly stated as not needed or resolved"
              },
              removedEvaluationCriteria: {
                type: "array",
                items: { type: "string" },
                description: "Evaluation criteria explicitly stated as not important or incorrect"
              },
              correctedBudget: {
                type: "string",
                description: "Explicit budget correction (e.g., 'Actually our budget is X, not Y')"
              },
              correctedTimeline: {
                type: "string", 
                description: "Explicit timeline correction (e.g., 'I meant 6 months, not 3 months')"
              },
              correctedUrgency: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Explicit urgency correction"
              },
              correctedContactMethod: {
                type: "string",
                enum: ["email", "phone", "meeting"],
                description: "Explicit contact method correction"
              },
              correctedRole: {
                type: "string",
                description: "Explicit role correction (e.g., 'I'm actually a Director, not Manager')"
              },
              correctedIndustry: {
                type: "string",
                description: "Explicit industry correction"
              },
              correctedCompany: {
                type: "string",
                description: "Explicit company name correction"
              },
              correctedTeamSize: {
                type: "string",
                description: "Explicit team size correction"
              }
            }
          }
        },
        required: [] // corrections are optional
      }
    };
  }

  /**
   * Build entity extraction schema
   */
  private static buildEntitySchema() {
    return {
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
    };
  }

  /**
   * Build persona inference schema
   */
  private static buildPersonaSchema() {
    return {
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
    };
  }

  /**
   * Build disambiguation context schema
   */
  private static buildDisambiguationSchema() {
    return {
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
    };
  }
} 