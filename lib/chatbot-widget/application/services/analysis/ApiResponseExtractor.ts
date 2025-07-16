/**
 * Service responsible for extracting data from API responses and payloads
 * Following DDD principles: Single responsibility for data extraction
 */

interface ApiPayload {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  maxTokens?: number;
  functions?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

interface ApiResponse {
  id?: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  choices?: Array<{
    message?: {
      content?: string;
      role?: string;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

export class ApiResponseExtractor {
  static extractModelFromPayload(payload: ApiPayload): string {
    return payload?.model || 'unknown';
  }

  static extractTemperatureFromPayload(payload: ApiPayload): number {
    return payload?.temperature || 0.7;
  }

  static extractMaxTokensFromPayload(payload: ApiPayload): number {
    return payload?.max_tokens || payload?.maxTokens || 1000;
  }

  static extractFunctionsFromPayload(payload: ApiPayload): Array<{name: string; description: string; parameters: Record<string, unknown>}> {
    return payload?.functions || [];
  }

  static extractIdFromResponse(response: ApiResponse): string {
    return response?.id || 'unknown';
  }

  static extractModelFromResponse(response: ApiResponse): string {
    return response?.model || 'unknown';
  }

  static extractUsageFromResponse(response: ApiResponse): {promptTokens: number; completionTokens: number; totalTokens: number} {
    const usage = response?.usage || {};
    return {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0
    };
  }

  static extractResponseLength(response: ApiResponse): number {
    return response?.choices?.[0]?.message?.content?.length || 0;
  }

  static extractResponseContent(response: ApiResponse): string {
    return response?.choices?.[0]?.message?.content || '';
  }

  static extractFunctionCallsFromResponse(response: ApiResponse): Array<{name: string; arguments: Record<string, unknown>; result: string; executionTime: number; success: boolean}> {
    const functionCall = response?.choices?.[0]?.message?.function_call;
    if (functionCall) {
      return [{
        name: functionCall.name || '',
        arguments: JSON.parse(functionCall.arguments || '{}'),
        result: functionCall.arguments || '',
        executionTime: 0,
        success: true
      }];
    }
    return [];
  }

  static extractIntentClassification(response: ApiResponse): {
    detectedIntent: string; 
    confidence: number; 
    alternativeIntents: Array<{ intent: string; confidence: number }>; 
    category: 'sales' | 'support' | 'qualification' | 'general'; 
    threshold: number; 
    isAmbiguous: boolean; 
    rawClassificationResult?: Record<string, unknown>; 
    processingTime?: number; 
    modelUsed?: string;
  } {
    const functionCall = response?.choices?.[0]?.message?.function_call;
    if (functionCall && functionCall.name === 'classify_intent_and_persona') {
      const args = JSON.parse(functionCall.arguments || '{}');
      const primaryIntent = args.primaryIntent || 'unknown';
      const primaryConfidence = args.primaryConfidence || 0;
      
      return {
        detectedIntent: primaryIntent,
        confidence: primaryConfidence,
        alternativeIntents: args.alternativeIntents || [],
        category: this.getIntentCategory(primaryIntent) as 'sales' | 'support' | 'qualification' | 'general',
        threshold: 0.7,
        isAmbiguous: primaryConfidence < 0.8,
        rawClassificationResult: args,
        processingTime: 0,
        modelUsed: response?.model || 'gpt-4o-mini'
      };
    }
    return {
      detectedIntent: 'unknown',
      confidence: 0,
      alternativeIntents: [],
      category: 'general',
      threshold: 0.7,
      isAmbiguous: true,
      rawClassificationResult: undefined,
      processingTime: 0,
      modelUsed: 'unknown'
    };
  }

  private static getIntentCategory(intent: string): 'sales' | 'support' | 'qualification' | 'general' {
    const categoryMap: Record<string, 'sales' | 'support' | 'qualification' | 'general'> = {
      'greeting': 'general',
      'faq_general': 'general',
      'faq_pricing': 'general',
      'faq_features': 'general',
      'sales_inquiry': 'sales',
      'demo_request': 'sales',
      'booking_request': 'sales',
      'support_request': 'support',
      'qualification': 'qualification',
      'objection_handling': 'sales',
      'closing': 'sales'
    };
    return categoryMap[intent] || 'general';
  }
} 