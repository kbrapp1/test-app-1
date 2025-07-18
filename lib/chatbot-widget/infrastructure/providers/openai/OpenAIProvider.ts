import OpenAI from 'openai';
import { BaseProvider, ProviderType, ProviderConfig } from '../../../../infrastructure/providers/registry/types';
import { IDebugInformationService } from '../../../domain/services/interfaces/IDebugInformationService';

export interface OpenAIConfig extends ProviderConfig {
  apiKey: string;
  apiUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * AI INSTRUCTIONS:
 * - OpenAI provider for chatbot widget conversation generation
 * - Manage GPT-4o client lifecycle (connect/disconnect/health checks)
 * - Handle chat completions with function calling for lead capture
 * - Estimate costs using current GPT-4o pricing
 */
export class OpenAIProvider implements BaseProvider {
  readonly type = ProviderType.OPENAI;
  private config: OpenAIConfig;
  private client: OpenAI | null = null;
  private debugService: IDebugInformationService | null = null;
  
  get isConnected(): boolean {
    return this.client !== null;
  }

  constructor(config: OpenAIConfig, debugService?: IDebugInformationService) {
    this.config = {
      apiUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1000,
      ...config
    };
    this.debugService = debugService || null;
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
      await this.client.models.list();
      return true;
    } catch (error) {
      // Log authentication failure for security monitoring
      console.warn('OpenAI API authentication failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /** Capture API call for debugging when debug service available */
  private captureApiCall(
    sessionId: string | null,
    callType: 'first' | 'second',
    requestData: Record<string, unknown>,
    responseData: Record<string, unknown>,
    processingTime: number
  ): void {
    if (this.debugService && sessionId) {
      const apiCallInfo = this.debugService.captureApiCall(
        callType,
        requestData,
        responseData,
        processingTime
      );
      this.debugService.addApiCallToSession(sessionId, callType, apiCallInfo);
    }
  }

  /** Generate chat completion with optional function calling */
  async createChatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    functions?: OpenAI.Chat.Completions.ChatCompletionCreateParams.Function[],
    functionCall?: 'auto' | 'none' | { name: string },
    sessionId?: string,
    callType?: 'first' | 'second'
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
      const startTime = Date.now();
      
      const requestData = {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        timestamp: new Date().toISOString(),
        payload: params,
        payloadSize: `${JSON.stringify(params).length} characters`,
        messageCount: params.messages.length,
        conversationHistoryLength: params.messages.length - 1,
        userMessage: params.messages[params.messages.length - 1]?.content || ''
      };

      const response = await this.client.chat.completions.create(params);
      
      const processingTime = Date.now() - startTime;
      const responseData = {
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        response: response,
        responseSize: `${JSON.stringify(response).length} characters`
      };

      if (sessionId && callType) {
        this.captureApiCall(sessionId, callType, requestData, responseData, processingTime);
      }

      if (response.usage) {
        const _costEstimate = this.estimateCost(
          response.usage.prompt_tokens,
          response.usage.completion_tokens
        );
        
        // Log cost estimate for billing and monitoring
        console.debug('OpenAI API cost estimate:', {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          estimatedCost: _costEstimate,
          sessionId,
          callType
        });
      }

      return response;
    } catch (error) {
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

  /** Get token usage tracking */
  async getUsageStats(): Promise<{
    tokensUsed: number;
    requestsCount: number;
    estimatedCost: number;
  }> {
    // MVP placeholder - implement proper usage tracking in production
    return {
      tokensUsed: 0,
      requestsCount: 0,
      estimatedCost: 0,
    };
  }

  /** Calculate estimated cost for a request */
  estimateCost(promptTokens: number, completionTokens: number): number {
    // GPT-4o pricing (as of 2024): $5.00/$20.00 per 1M tokens
    const promptCostPer1K = 0.005;
    const completionCostPer1K = 0.020;
    
    const promptCost = (promptTokens / 1000) * promptCostPer1K;
    const completionCost = (completionTokens / 1000) * completionCostPer1K;
    
    return promptCost + completionCost;
  }
} 