/**
 * OpenAI Function Schema Builder
 * 
 * AI INSTRUCTIONS:
 * - This class builds simplified lead generation schemas for optimal performance
 * - Focused on essential lead qualification without complex dynamic entity building
 * - Maintains 70-85% token reduction compared to previous complex extraction
 * - Single responsibility: Generate lead qualification function schema
 */
import { OpenAIFunctionSchema } from '../types/OpenAITypes';

export class OpenAIFunctionSchemaBuilder {

  /**
   * Simplified Lead Generation Schema (2025 Optimized)
   * 
   * AI INSTRUCTIONS:
   * - Focus on lead generation essentials only
   * - Reduce token usage by 70-85% compared to complex extraction
   * - Prioritize conversation flow and lead qualification
   * - Extract only critical business information
   * - Parameters kept for backward compatibility but not used in simplified approach
   */
  static buildUnifiedChatbotSchemaWithContext(
    _existingEntities?: Record<string, unknown>, 
    _conversationPhase?: string, 
    _userMessage?: string
  ): OpenAIFunctionSchema {
    return {
      name: "lead_qualification_response",
      description: "Generate response and extract key lead information for intelligent lead generation",
      parameters: {
        type: "object",
        properties: {
          intent: {
            type: "string",
            enum: ["inquiry", "qualification", "demo", "pricing", "objection", "greeting"],
            description: "Primary user intent"
          },
          lead_data: {
            type: "object",
            properties: {
              name: { 
                type: "string",
                description: "Visitor's name when introduced"
              },
              company: { 
                type: "string",
                description: "Company or organization name"
              },
              role: { 
                type: "string",
                description: "Job title or professional role"
              },
              budget: { 
                type: "string",
                description: "Budget range or investment capacity"
              },
              timeline: {
                type: "string", 
                description: "Implementation timeline or decision timeframe"
              },
              urgency: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Urgency level for their needs"
              },
              goals: {
                type: "array",
                items: { type: "string" },
                description: "Business goals or objectives they want to achieve"
              },
              pain_points: {
                type: "array", 
                items: { type: "string" },
                description: "Specific business problems or challenges mentioned"
              }
            }
          },
          response: {
            type: "object",
            properties: {
              content: { 
                type: "string",
                description: "Natural, conversational response content"
              },
              capture_contact: { 
                type: "boolean",
                description: "Whether to capture contact information now"
              },
              next_question: { 
                type: "string",
                description: "Next qualifying question to ask (if appropriate)"
              }
            },
            required: ["content", "capture_contact"]
          }
        },
        required: ["intent", "lead_data", "response"]
      }
    };
  }

  // AI: Simplified schema approach - no complex dynamic entity building needed
  // All lead data fields are statically defined for optimal performance
} 