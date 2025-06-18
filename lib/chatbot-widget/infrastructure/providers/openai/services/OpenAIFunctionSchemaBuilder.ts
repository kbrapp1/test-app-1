/**
 * OpenAI Function Schema Builder
 * 
 * Service for building OpenAI function calling schemas.
 * Single responsibility: Construct and manage function schemas for intent classification.
 */

import { OpenAIFunctionSchema } from '../types/OpenAITypes';

export class OpenAIFunctionSchemaBuilder {


  /**
   * Build unified intent classification and entity extraction schema
   * 
   * AI INSTRUCTIONS:
   * - Single unified schema following @golden-rule no redundancy principle
   * - Handles intent classification, entity extraction, and corrections in one call
   * - Eliminates need for separate schemas and methods
   * - Follow @golden-rule patterns exactly
   * - Maintains single responsibility: complete message analysis
   */
  static buildUnifiedAnalysisSchema(): OpenAIFunctionSchema {
    return {
      name: "analyze_message_complete",
      description: "Complete message analysis: classify intent, extract entities, detect corrections, and infer persona",
      parameters: {
        type: "object",
        properties: {
          // Intent classification (from buildIntentClassificationSchema)
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

          // Entity extraction (from buildEntitySchema)
          entities: this.buildEntitySchema(),

          // Persona inference (from buildPersonaSchema)
          personaInference: this.buildPersonaSchema(),

          // Corrections detection (from corrections schema)
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
          },

          // Disambiguation context (from buildDisambiguationSchema)
          disambiguationContext: this.buildDisambiguationSchema(),

          reasoning: {
            type: "string",
            description: "Explanation of the classification and extraction decisions"
          }
        },
        required: ["primaryIntent", "primaryConfidence", "entities", "reasoning"]
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

  /**
   * Build unified analysis, response, and lead scoring function schema
   * 
   * AI INSTRUCTIONS:
   * - Single API call that handles all chatbot logic
   * - Reduces cost by 50% compared to separate analysis + response calls
   * - Maintains business functionality: intent, entities, persona, corrections, scoring, response
   * - Follow @golden-rule patterns: single responsibility, no redundancy
   */
  static buildUnifiedChatbotSchema(): OpenAIFunctionSchema {
    return {
      name: "process_chatbot_interaction_complete",
      description: "Complete chatbot processing: analyze user intent and entities, generate appropriate response, calculate lead score, and determine next actions",
      parameters: {
        type: "object",
        properties: {
          // ANALYSIS SECTION (from existing analyzeMessageComplete)
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
              entities: this.buildEntitySchema(),
              personaInference: this.buildPersonaSchema(),
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
              },
              reasoning: {
                type: "string",
                description: "Analysis reasoning and context"
              }
            },
            required: ["primaryIntent", "primaryConfidence", "entities", "reasoning"]
          },

          // LEAD SCORING SECTION
          leadScore: {
            type: "object",
            properties: {
              totalScore: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Total lead score based on all factors"
              },
              scoreBreakdown: {
                type: "object",
                properties: {
                  intentQuality: {
                    type: "number",
                    minimum: 0,
                    maximum: 25,
                    description: "0-25 points: generic questions=0-5, feature inquiries=6-15, pricing/demo=16-25"
                  },
                  entityCompleteness: {
                    type: "number", 
                    minimum: 0,
                    maximum: 25,
                    description: "0-25 points: no contact=0-5, name only=6-10, name+company=11-20, full details=21-25"
                  },
                  personaFit: {
                    type: "number",
                    minimum: 0, 
                    maximum: 25,
                    description: "0-25 points: individual=0-10, team member=11-15, manager=16-20, VP/C-level=21-25"
                  },
                  engagementLevel: {
                    type: "number",
                    minimum: 0,
                    maximum: 25,
                    description: "0-25 points: basic questions=0-10, specific requirements=11-20, timeline+budget=21-25"
                  }
                },
                required: ["intentQuality", "entityCompleteness", "personaFit", "engagementLevel"]
              },
              scoringReasoning: {
                type: "string",
                description: "Detailed explanation of why this score was assigned"
              },
              qualificationStatus: {
                type: "object",
                properties: {
                  isQualified: {
                    type: "boolean",
                    description: "Whether lead meets qualification criteria (score >= 70)"
                  },
                  readyForSales: {
                    type: "boolean", 
                    description: "Whether lead is ready for sales contact (high intent + contact info)"
                  },
                  missingInfo: {
                    type: "array",
                    items: { type: "string" },
                    description: "What information is still needed to fully qualify"
                  },
                  nextSteps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Recommended next actions based on current state"
                  }
                },
                required: ["isQualified", "readyForSales", "missingInfo", "nextSteps"]
              }
            },
            required: ["totalScore", "scoreBreakdown", "scoringReasoning", "qualificationStatus"]
          },

          // RESPONSE GENERATION SECTION
          response: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "Generated response content based on intent analysis and persona"
              },
              tone: {
                type: "string",
                enum: ["professional", "friendly", "consultative", "educational", "urgent"],
                description: "Response tone based on intent and persona"
              },
              callToAction: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["demo_request", "contact_capture", "information_gathering", "next_question", "escalation", "none"],
                    description: "Type of call-to-action based on lead score and intent"
                  },
                  message: {
                    type: "string",
                    description: "Specific CTA message if applicable"
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                    description: "CTA priority based on lead qualification"
                  }
                },
                required: ["type", "priority"]
              },
              shouldTriggerLeadCapture: {
                type: "boolean",
                description: "Whether this interaction should trigger lead capture workflow"
              },
              personalization: {
                type: "object", 
                properties: {
                  usedEntities: {
                    type: "array",
                    items: { type: "string" },
                    description: "Which extracted entities were used for personalization"
                  },
                  personaAdaptations: {
                    type: "array",
                    items: { type: "string" },
                    description: "How response was adapted based on persona inference"
                  }
                }
              }
            },
            required: ["content", "tone", "callToAction", "shouldTriggerLeadCapture"]
          }
        },
        required: ["analysis", "leadScore", "response"]
      }
    };
  }
} 