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

          // Sentiment analysis
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
            description: "Explanation of the classification and extraction decisions"
          }
        },
        required: ["primaryIntent", "primaryConfidence", "entities", "reasoning"]
      }
    };
  }

  /**
   * Build entity extraction schema with 2025 entity normalization best practices
   */
  private static buildEntitySchema() {
    return {
      type: "object",
      properties: {
        // Core business entities with normalization
        budget: { 
          type: "string", 
          description: "Budget information mentioned - normalize to standard format (e.g., '$5,000/month', '50K annually')" 
        },
        timeline: { 
          type: "string", 
          description: "Timeline or urgency mentioned - normalize to specific timeframes (e.g., 'Q2 2025', '3 months', 'ASAP')" 
        },
        company: { 
          type: "string", 
          description: "Company name - normalize capitalization and remove common suffixes (e.g., 'Microsoft Corporation' -> 'Microsoft')" 
        },
        teamSize: { 
          type: "string", 
          description: "Team or company size - normalize to ranges (e.g., '1-10', '50-100', '500+')" 
        },
        industry: { 
          type: "string", 
          description: "Industry or business type - normalize to standard industry categories (e.g., 'tech startup' -> 'technology')" 
        },
        role: { 
          type: "string", 
          description: "User's job title - normalize to standard role categories (e.g., 'VP of Sales' -> 'vp_sales')" 
        },
        location: { 
          type: "string", 
          description: "Geographic location - normalize to city, state/country format (e.g., 'NYC' -> 'New York, NY')" 
        },
        urgency: { 
          type: "string", 
          enum: ["low", "medium", "high"],
          description: "Urgency level inferred from context - classify based on timeline indicators"
        },
        contactMethod: {
          type: "string",
          enum: ["email", "phone", "meeting"],
          description: "Preferred contact method if mentioned - infer from communication patterns"
        },

        // Scheduling entities with temporal normalization
        preferredTime: { 
          type: "string", 
          description: "Preferred meeting time - normalize to specific time formats (e.g., 'morning' -> '9:00 AM - 12:00 PM')" 
        },
        timezone: { 
          type: "string", 
          description: "Timezone - normalize to standard timezone codes (e.g., 'EST', 'PST', 'UTC+1')" 
        },
        availability: { 
          type: "string", 
          description: "Availability preferences - normalize to day/time patterns (e.g., 'weekday mornings')" 
        },
        eventType: {
          type: "string",
          enum: ["demo", "consultation", "onboarding", "support_call", "sales_call"],
          description: "Type of meeting or event requested - classify based on intent and content"
        },

        // Product/feature entities with categorization
        productName: { 
          type: "string", 
          description: "Specific product mentioned - normalize to official product names and versions" 
        },
        featureName: { 
          type: "string", 
          description: "Specific feature mentioned - normalize to official feature terminology" 
        },
        integrationNeeds: {
          type: "array",
          items: { type: "string" },
          description: "Integration requirements - normalize to standard system names (e.g., 'Salesforce CRM', 'HubSpot')"
        },

        // Support entities with classification
        issueType: {
          type: "string",
          enum: ["technical", "billing", "feature_request", "bug_report", "general"],
          description: "Type of support issue - classify based on problem description"
        },
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Severity of the issue - assess based on business impact and urgency"
        },
        affectedFeature: { 
          type: "string", 
          description: "Feature experiencing issues - normalize to official feature names" 
        },

        // Advanced qualification entities with validation
        currentSolution: { 
          type: "string", 
          description: "Current solution they're using - normalize to standard product/vendor names" 
        },
        painPoints: {
          type: "array",
          items: { type: "string" },
          description: "Specific problems mentioned - categorize by business function (sales, marketing, operations)"
        },
        decisionMakers: {
          type: "array",
          items: { type: "string" },
          description: "Other people involved in decision - normalize roles and validate authority levels"
        },
        evaluationCriteria: {
          type: "array",
          items: { type: "string" },
          description: "Factors important in evaluation - categorize by priority and business impact"
        },

        // 2025 Enhancement: Entity Quality Metrics
        entityQuality: {
          type: "object",
          properties: {
            completenessScore: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Completeness score for extracted entities (0=minimal, 1=comprehensive)"
            },
            confidenceScore: {
              type: "number", 
              minimum: 0,
              maximum: 1,
              description: "Overall confidence in entity extraction accuracy"
            },
            normalizedEntities: {
              type: "array",
              items: { type: "string" },
              description: "List of entities that were normalized or corrected during extraction"
            },
            ambiguousEntities: {
              type: "array",
              items: { 
                type: "object",
                properties: {
                  entity: { type: "string" },
                  ambiguity: { type: "string" },
                  possibleValues: { 
                    type: "array", 
                    items: { type: "string" } 
                  }
                }
              },
              description: "Entities with potential ambiguities that need clarification"
            },
            missingCriticalEntities: {
              type: "array",
              items: { type: "string" },
              description: "Critical entities needed for qualification that are still missing"
            }
          },
          required: ["completenessScore", "confidenceScore"]
        },

        // 2025 Enhancement: Context-Aware Entity Relationships
        entityRelationships: {
          type: "object",
          properties: {
            roleCompanyAlignment: {
              type: "boolean",
              description: "Whether inferred role aligns with company size and industry context"
            },
            budgetRoleConsistency: {
              type: "boolean", 
              description: "Whether mentioned budget aligns with user's inferred decision authority"
            },
            timelineBudgetRealism: {
              type: "boolean",
              description: "Whether timeline expectations align with budget and complexity"
            },
            industryContextValidation: {
              type: "object",
              properties: {
                industryMatch: { type: "boolean" },
                commonPainPoints: { 
                  type: "array", 
                  items: { type: "string" } 
                },
                typicalBudgetRange: { type: "string" },
                standardTimeline: { type: "string" }
              }
            }
          }
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
          // ANALYSIS SECTION with Dynamic Entity Extraction
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
              // 🎯 DYNAMIC ENTITY EXTRACTION - Only extract missing/relevant entities
              entities: this.buildDynamicEntitySchema(existingEntities, conversationPhase, userMessage),
              personaInference: this.buildPersonaSchema(),
              corrections: this.buildCorrectionsSchema(),
              // Sentiment analysis
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

          // CONVERSATION FLOW DECISIONS (same as original)
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

          // LEAD SCORING (same as original)
          leadScore: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Comprehensive lead score (0-100) based on intent quality, entity completeness, persona fit, and engagement"
          },

          // RESPONSE GENERATION (same as original)
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
        required: ["analysis", "conversationFlow", "leadScore", "response"]
      }
    };
  }

  /**
   * Build dynamic entity schema based on conversation context (2025 best practice)
   * Only extracts missing entities or those relevant to current conversation phase
   */
  private static buildDynamicEntitySchema(existingEntities?: any, conversationPhase?: string, userMessage?: string): any {
    const schema: any = {
      type: "object",
      properties: {}
    };

    // Always extract corrections if user is making corrections
    if (userMessage && this.detectsCorrection(userMessage)) {
      schema.properties.corrections = this.buildCorrectionsSchema();
    }

    // Phase-based entity extraction
    switch (conversationPhase) {
      case 'greeting':
      case 'introduction':
        // Only extract identity entities if not already known
        if (!existingEntities?.company) {
          schema.properties.company = { 
            type: "string", 
            description: "Company name - normalize capitalization and remove common suffixes" 
          };
        }
        if (!existingEntities?.role) {
          schema.properties.role = { 
            type: "string", 
            description: "User's job title - normalize to standard role categories" 
          };
        }
        if (!existingEntities?.industry) {
          schema.properties.industry = { 
            type: "string", 
            description: "Industry or business type - normalize to standard categories" 
          };
        }
        break;

      case 'business_inquiry':
      case 'discovery':
        // Extract business context entities if not known
        if (!existingEntities?.teamSize) {
          schema.properties.teamSize = { 
            type: "string", 
            description: "Team or company size - normalize to ranges (e.g., '1-10', '50-100', '500+')" 
          };
        }
        if (!existingEntities?.currentSolution) {
          schema.properties.currentSolution = { 
            type: "string", 
            description: "Current solution they're using - normalize to standard product/vendor names" 
          };
        }
        schema.properties.painPoints = {
          type: "array",
          items: { type: "string" },
          description: "Specific problems mentioned - categorize by business function"
        };
        break;

      case 'qualification':
      case 'pricing_discussion':
        // Extract qualification entities
        if (!existingEntities?.budget) {
          schema.properties.budget = { 
            type: "string", 
            description: "Budget information - normalize to standard format (e.g., '$5,000/month', '50K annually')" 
          };
        }
        if (!existingEntities?.timeline) {
          schema.properties.timeline = { 
            type: "string", 
            description: "Timeline or urgency - normalize to specific timeframes (e.g., 'Q2 2025', '3 months')" 
          };
        }
        if (!existingEntities?.urgency) {
          schema.properties.urgency = { 
            type: "string", 
            enum: ["low", "medium", "high"],
            description: "Urgency level inferred from context"
          };
        }
        schema.properties.decisionMakers = {
          type: "array",
          items: { type: "string" },
          description: "Other people involved in decision - normalize roles and validate authority levels"
        };
        break;

      case 'scheduling':
      case 'booking':
        // Extract scheduling entities
        schema.properties.preferredTime = { 
          type: "string", 
          description: "Preferred meeting time - normalize to specific time formats" 
        };
        schema.properties.contactMethod = {
          type: "string",
          enum: ["email", "phone", "meeting"],
          description: "Preferred contact method if mentioned"
        };
        break;
    }

    // Always extract intent-relevant entities based on message content
    if (userMessage) {
      if (this.detectsPricingIntent(userMessage) && !schema.properties.budget) {
        schema.properties.budget = { 
          type: "string", 
          description: "Budget information mentioned in pricing context" 
        };
      }
      
      if (this.detectsTimelineIntent(userMessage) && !schema.properties.timeline) {
        schema.properties.timeline = { 
          type: "string", 
          description: "Timeline information mentioned" 
        };
      }
    }

    return schema;
  }

  /**
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
        // ... other correction fields
      }
    };
  }
} 