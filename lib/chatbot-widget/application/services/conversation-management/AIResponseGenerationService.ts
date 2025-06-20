/**
 * AI Response Generation Service
 * 
 * AI INSTRUCTIONS:
 * - Handles API-only response generation with error recovery
 * - No static fallbacks - all responses generated via OpenAI API
 * - Single responsibility: Generate AI responses for various scenarios
 * - Follow @golden-rule patterns: under 250 lines, single purpose
 */

import { ConversationContext, AIResponse } from '../../../domain/services/interfaces/IAIConversationService';
import { OpenAIProvider } from '../../../infrastructure/providers/openai/OpenAIProvider';
import OpenAI from 'openai';

export class AIResponseGenerationService {
  constructor(private readonly openAIProvider: OpenAIProvider) {}

  /**
   * Create lead capture function definition for OpenAI
   */
  createLeadCaptureFunction(): OpenAI.Chat.Completions.ChatCompletionCreateParams.Function {
    return {
      name: 'capture_lead',
      description: 'Capture lead information when visitor shows genuine interest in our services',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name of the potential lead' },
          email: { type: 'string', description: 'Email address of the potential lead' },
          company: { type: 'string', description: 'Company name of the potential lead' },
          phone: { type: 'string', description: 'Phone number of the potential lead (optional)' },
          interests: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific services or products they are interested in'
          },
          qualification_answers: {
            type: 'object',
            description: 'Answers to any qualification questions that were asked'
          }
        },
        required: ['name', 'email']
      }
    };
  }

  /**
   * Process AI provider response into domain format
   */
  processAIResponse(response: any, aiConfig: any): AIResponse {
    const choice = response.choices[0];
    const usage = response.usage;
    
    // Handle function calls (lead capture)
    if (choice.message.function_call && choice.message.function_call.name === 'capture_lead') {
      const leadData = JSON.parse(choice.message.function_call.arguments);
      
      return {
        content: choice.message.content || 'Thank you for your interest! I\'ll make sure someone follows up with you soon.',
        confidence: 0.9,
        processingTimeMs: 0,
        metadata: {
          model: response.model || aiConfig?.openaiModel || 'gpt-4o-mini',
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        functionCall: {
          name: 'capture_lead',
          arguments: leadData
        }
      };
    }

    // Return regular response
    return {
      content: choice.message.content || 'I apologize, but I\'m having trouble generating a response right now.',
      confidence: 0.8,
      sentiment: this.extractSentimentFromResponse(response),
      processingTimeMs: 0,
      metadata: {
        model: response.model || aiConfig?.openaiModel || 'gpt-4o-mini',
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      }
    };
  }

  /**
   * Extract sentiment from OpenAI response (when function calling includes sentiment)
   */
  private extractSentimentFromResponse(response: any): 'positive' | 'neutral' | 'negative' | undefined {
    try {
      // Check if response includes function call with sentiment analysis
      const choice = response.choices[0];
      if (choice?.message?.function_call?.arguments) {
        const functionArgs = JSON.parse(choice.message.function_call.arguments);
        if (functionArgs.analysis?.sentiment) {
          return functionArgs.analysis.sentiment;
        }
        if (functionArgs.sentiment) {
          return functionArgs.sentiment;
        }
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Generate error response for invalid context using OpenAI
   * 
   * AI INSTRUCTIONS:
   * - Use OpenAI to generate appropriate response for context validation errors
   * - Follow @golden-rule patterns for API-only approach
   * - Provide helpful guidance to user despite context issues
   */
  async generateContextErrorResponse(userMessage: string, context: ConversationContext): Promise<AIResponse> {
    const errorPrompt = `You are a helpful AI assistant. The conversation context has some validation issues, but you should still try to help the user with their message: "${userMessage}". 

Please provide a helpful response while suggesting they might want to start a fresh conversation if they continue having issues.`;

    const messages = [
      { role: 'system' as const, content: errorPrompt },
      { role: 'user' as const, content: userMessage }
    ];

    try {
      const response = await this.openAIProvider.createChatCompletion(
        messages,
        [],
        'auto',
        context.session?.id || 'unknown',
        'first'
      );

      return this.processAIResponse(response, context.chatbotConfig?.aiConfiguration);
    } catch (error) {
      // If API completely fails, throw error instead of fallback
      throw new Error(`Unable to generate context error response via API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate error response for API failures using OpenAI
   * 
   * AI INSTRUCTIONS:
   * - Use OpenAI to generate appropriate response for technical errors
   * - Include context about the issue without exposing technical details
   * - Follow @golden-rule patterns for error handling
   */
  async generateAPIErrorResponse(userMessage: string, context: ConversationContext, originalError: unknown): Promise<AIResponse> {
    const errorPrompt = `You are a helpful AI assistant. There was a brief technical issue while processing the user's request, but you should still provide a helpful response to their message: "${userMessage}".

Be professional, acknowledge there was a brief delay, and still try to address their needs as best you can. Don't mention specific technical details.`;

    const messages = [
      { role: 'system' as const, content: errorPrompt },
      { role: 'user' as const, content: userMessage }
    ];

    try {
      const response = await this.openAIProvider.createChatCompletion(
        messages,
        [],
        'auto',
        context.session?.id || 'unknown',
        'first'
      );

      return this.processAIResponse(response, context.chatbotConfig?.aiConfiguration);
    } catch (error) {
      // If API completely fails, throw error instead of fallback
      throw new Error(`API completely unavailable. Original error: ${originalError instanceof Error ? originalError.message : 'Unknown'}. Recovery error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Configure provider for this specific request
   */
  async configureProviderForRequest(aiConfig: any): Promise<void> {
    if (this.openAIProvider && aiConfig) {
      (this.openAIProvider as any).config = {
        ...(this.openAIProvider as any).config,
        model: aiConfig.openaiModel || 'gpt-4o-mini',
        temperature: aiConfig.temperature || 0.7,
        maxTokens: aiConfig.maxTokens || 1000
      };
    }
  }
} 