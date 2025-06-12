import OpenAI from 'openai';
import { BaseProvider, ProviderType, ProviderConfig } from '../../../../infrastructure/providers/registry/types';

export interface OpenAIConfig extends ProviderConfig {
  apiKey: string;
  apiUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * OpenAI provider for chatbot widget
 * Handles GPT-4o conversation generation with function calling for lead capture
 */
export class OpenAIProvider implements BaseProvider {
  readonly type = ProviderType.OPENAI;
  private config: OpenAIConfig;
  private client: OpenAI | null = null;
  
  get isConnected(): boolean {
    return this.client !== null;
  }

  constructor(config: OpenAIConfig) {
    this.config = {
      apiUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1000,
      ...config
    };
  }

  async connect(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.apiUrl,
    });
  }

  async disconnect(): Promise<void> {
    this.client = null;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      // Simple health check - list models
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate chat completion with optional function calling
   */
  async createChatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    functions?: OpenAI.Chat.Completions.ChatCompletionCreateParams.Function[],
    functionCall?: 'auto' | 'none' | { name: string }
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    if (!this.isConnected || !this.client) {
      throw new Error('OpenAI provider not connected. Call connect() first.');
    }

    const params: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: this.config.model!,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    };

    if (functions && functions.length > 0) {
      params.functions = functions;
      params.function_call = functionCall || 'auto';
    }

    try {
      console.log('🤖 OpenAI API Request:', {
        model: params.model,
        messagesCount: params.messages.length,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        timestamp: new Date().toISOString()
      });

      const response = await this.client.chat.completions.create(params);
      
      console.log('✅ OpenAI API Response:', {
        id: response.id,
        model: response.model,
        usage: response.usage,
        responseLength: response.choices[0]?.message?.content?.length || 0,
        functionCall: response.choices[0]?.message?.function_call?.name,
        timestamp: new Date().toISOString()
      });

      // Calculate and log actual costs
      if (response.usage) {
        const costEstimate = this.estimateCost(
          response.usage.prompt_tokens,
          response.usage.completion_tokens
        );
        
        console.log('💰 OpenAI API Costs:', {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          estimatedCost: `$${costEstimate.toFixed(4)}`,
          model: response.model
        });
      }

      return response;
    } catch (error) {
      console.error('❌ OpenAI API Error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('OpenAI API key is invalid or missing');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('OpenAI API rate limit exceeded');
        }
        if (error.message.includes('quota')) {
          throw new Error('OpenAI API quota exceeded');
        }
      }
      
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Get token usage tracking
   */
  async getUsageStats(): Promise<{
    tokensUsed: number;
    requestsCount: number;
    estimatedCost: number;
  }> {
    // For MVP, return placeholder stats
    // In production, implement proper usage tracking
    return {
      tokensUsed: 0,
      requestsCount: 0,
      estimatedCost: 0,
    };
  }

  /**
   * Calculate estimated cost for a request
   */
  estimateCost(promptTokens: number, completionTokens: number): number {
    // GPT-4o pricing (as of 2024)
    const promptCostPer1K = 0.005; // $5.00 per 1M tokens = $0.005 per 1K tokens
    const completionCostPer1K = 0.020; // $20.00 per 1M tokens = $0.020 per 1K tokens
    
    const promptCost = (promptTokens / 1000) * promptCostPer1K;
    const completionCost = (completionTokens / 1000) * completionCostPer1K;
    
    return promptCost + completionCost;
  }
} 