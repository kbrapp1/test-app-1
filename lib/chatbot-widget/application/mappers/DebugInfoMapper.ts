import { ProcessingDebugInfo } from '../../domain/services/IDebugInformationService';
import { DebugInfoDto } from '../dto/DebugInfoDto';

export class DebugInfoMapper {
  /**
   * Transform domain debug data to presentation DTO
   * Following DDD principles: Application layer handles data transformation
   */
  static toDto(
    domainDebugInfo: ProcessingDebugInfo | null,
    intentAnalysis?: any,
    journeyState?: any,
    conversationMetrics?: any,
    shouldCaptureLeadInfo?: boolean,
    suggestedNextActions?: string[]
  ): DebugInfoDto | null {
    if (!domainDebugInfo) {
      return null;
    }

    const dto: DebugInfoDto = {
      // Basic session info
      sessionId: domainDebugInfo.sessionId,
      userMessageId: domainDebugInfo.userMessageId,
      botMessageId: domainDebugInfo.botMessageId,
      processingTimeMs: domainDebugInfo.totalProcessingTime,
      
      // Additional context
      intentAnalysis,
      journeyState,
      conversationMetrics,
      shouldCaptureLeadInfo,
      suggestedNextActions,
      
      // Root-level requestData for RequestPreprocessingStep component
      requestData: domainDebugInfo.firstApiCall ? {
        model: this.extractModelFromPayload(domainDebugInfo.firstApiCall.requestData.payload),
        messagesCount: domainDebugInfo.firstApiCall.requestData.messageCount,
        temperature: this.extractTemperatureFromPayload(domainDebugInfo.firstApiCall.requestData.payload),
        maxTokens: this.extractMaxTokensFromPayload(domainDebugInfo.firstApiCall.requestData.payload),
        timestamp: domainDebugInfo.firstApiCall.requestData.timestamp,
        userMessage: domainDebugInfo.firstApiCall.requestData.userMessage,
        fullPrompt: `User: ${domainDebugInfo.firstApiCall.requestData.userMessage}`
      } : undefined,
    };

    // Transform first API call data
    if (domainDebugInfo.firstApiCall) {
      const firstCall = domainDebugInfo.firstApiCall;
      
      dto.firstApiCall = {
        requestData: {
          model: this.extractModelFromPayload(firstCall.requestData.payload),
          messagesCount: firstCall.requestData.messageCount,
          temperature: this.extractTemperatureFromPayload(firstCall.requestData.payload),
          maxTokens: this.extractMaxTokensFromPayload(firstCall.requestData.payload),
          timestamp: firstCall.requestData.timestamp,
          userMessage: firstCall.requestData.userMessage,
          apiEndpoint: firstCall.requestData.endpoint,
          requestSize: parseInt(firstCall.requestData.payloadSize.replace(' characters', '')),
          fullRequestPayload: firstCall.requestData.payload,
          functionsProvided: this.extractFunctionsFromPayload(firstCall.requestData.payload)
        },
        responseData: {
          id: this.extractIdFromResponse(firstCall.responseData.response),
          model: this.extractModelFromResponse(firstCall.responseData.response),
          usage: this.extractUsageFromResponse(firstCall.responseData.response),
          responseLength: this.extractResponseLength(firstCall.responseData.response),
          processingTime: parseInt(firstCall.responseData.processingTime.replace('ms', '')),
          fullResponse: this.extractResponseContent(firstCall.responseData.response),
          responseSize: parseInt(firstCall.responseData.responseSize.replace(' characters', '')),
          statusCode: 200,
          functionCallsExecuted: this.extractFunctionCallsFromResponse(firstCall.responseData.response)
        },
        costData: this.calculateCostData(firstCall.responseData.response, 'first')
      };

      // Extract intent classification from first API call
      dto.intentClassification = this.extractIntentClassification(firstCall.responseData.response);
      
      // Add functionCalls structure for debug components
      dto.functionCalls = {
        firstApiCall: {
          functions: this.extractFunctionsFromPayload(firstCall.requestData.payload),
          functionCallsMade: this.extractFunctionCallsFromResponse(firstCall.responseData.response),
          totalFunctionExecutionTime: parseInt(firstCall.responseData.processingTime.replace('ms', ''))
        }
      };
    }

    // Transform second API call data
    if (domainDebugInfo.secondApiCall) {
      const secondCall = domainDebugInfo.secondApiCall;
      
      dto.secondApiCall = {
        requestData: {
          model: this.extractModelFromPayload(secondCall.requestData.payload),
          messagesCount: secondCall.requestData.messageCount,
          temperature: this.extractTemperatureFromPayload(secondCall.requestData.payload),
          maxTokens: this.extractMaxTokensFromPayload(secondCall.requestData.payload),
          timestamp: secondCall.requestData.timestamp,
          userMessage: secondCall.requestData.userMessage,
          apiEndpoint: secondCall.requestData.endpoint,
          requestSize: parseInt(secondCall.requestData.payloadSize.replace(' characters', '')),
          fullRequestPayload: secondCall.requestData.payload
        },
        responseData: {
          id: this.extractIdFromResponse(secondCall.responseData.response),
          model: this.extractModelFromResponse(secondCall.responseData.response),
          usage: this.extractUsageFromResponse(secondCall.responseData.response),
          responseLength: this.extractResponseLength(secondCall.responseData.response),
          processingTime: parseInt(secondCall.responseData.processingTime.replace('ms', '')),
          fullResponse: this.extractResponseContent(secondCall.responseData.response),
          responseSize: parseInt(secondCall.responseData.responseSize.replace(' characters', '')),
          statusCode: 200
        },
        costData: this.calculateCostData(secondCall.responseData.response, 'second')
      };
    }

    // Add derived data for UI components
    if (intentAnalysis) {
      const entities = intentAnalysis.entities || {};
      dto.entityExtraction = {
        extractedEntities: Object.entries(entities).map(([type, value]) => ({
          type,
          value: String(value),
          confidence: 0.9,
          category: this.getEntityCategory(type),
          sourceText: String(value),
          normalizedValue: String(value)
        })),
        totalEntitiesFound: Object.keys(entities).length,
        extractionMode: 'comprehensive' as const,
        rawExtractionResult: entities,
        processingTime: domainDebugInfo.firstApiCall ? 
          parseInt(domainDebugInfo.firstApiCall.responseData.processingTime.replace('ms', '')) : 0,
        patternsMatched: Object.keys(entities)
      };
    }

    if (conversationMetrics) {
      const currentScore = conversationMetrics.engagementScore || 0;
      dto.leadScoring = {
        currentScore,
        maxPossibleScore: 100,
        qualificationThreshold: 70,
        isQualified: currentScore >= 70,
        scoreBreakdown: [
          {
            entityType: 'engagement',
            points: currentScore,
            reason: 'User engagement level',
            weight: 1.0,
            category: 'behavioral',
            ruleId: 'engagement_001'
          }
        ],
        previousScore: Math.max(0, currentScore - 10),
        scoreChange: 10,
        processingTime: 0
      };
    }

    if (journeyState) {
      const currentStage = journeyState.stage || 'discovery';
      const stageConfidence = journeyState.confidence || 0;
      dto.journeyProgression = {
        currentStage,
        previousStage: 'initial',
        stageConfidence,
        transitionReason: 'User engagement patterns indicate progression',
        engagementCategory: stageConfidence > 0.8 ? 'sales_ready' : 
                           stageConfidence > 0.5 ? 'actively_engaged' : 'general',
        progressionPath: ['initial', currentStage],
        stageAnalysis: {
          indicators: ['User asking questions', 'Showing interest'],
          signals: [
            {
              type: 'engagement',
              strength: stageConfidence,
              description: 'User interaction level'
            }
          ],
          nextPossibleStages: [
            {
              stage: 'qualification',
              probability: 0.7,
              requirements: ['Contact information', 'Budget discussion']
            }
          ]
        },
        processingTime: 0
      };
    }

    // Add business rules (placeholder for now)
    dto.businessRules = {
      rulesTriggered: [
        {
          ruleName: 'Intent Classification',
          condition: 'User message received',
          action: 'Classify intent using OpenAI',
          result: 'success'
        },
        {
          ruleName: 'Response Generation',
          condition: 'Intent classified',
          action: 'Generate contextual response',
          result: 'success'
        }
      ],
      thresholds: {
        intentConfidence: 0.7,
        stageTransition: 0.8,
        personaInference: 0.6
      },
      automatedBehaviors: [
        {
          behavior: 'Lead Capture Trigger',
          triggered: shouldCaptureLeadInfo || false,
          reason: shouldCaptureLeadInfo ? 'High engagement detected' : 'Engagement threshold not met'
        }
      ]
    };

    return dto;
  }

  private static extractModelFromPayload(payload: any): string {
    return payload?.model || 'unknown';
  }

  private static extractTemperatureFromPayload(payload: any): number {
    return payload?.temperature || 0.7;
  }

  private static extractMaxTokensFromPayload(payload: any): number {
    return payload?.max_tokens || payload?.maxTokens || 1000;
  }

  private static extractFunctionsFromPayload(payload: any): Array<{name: string; description: string; parameters: any}> {
    return payload?.functions || [];
  }

  private static extractIdFromResponse(response: any): string {
    return response?.id || 'unknown';
  }

  private static extractModelFromResponse(response: any): string {
    return response?.model || 'unknown';
  }

  private static extractUsageFromResponse(response: any): {promptTokens: number; completionTokens: number; totalTokens: number} {
    const usage = response?.usage || {};
    return {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0
    };
  }

  private static extractResponseLength(response: any): number {
    return response?.choices?.[0]?.message?.content?.length || 0;
  }

  private static extractResponseContent(response: any): string {
    return response?.choices?.[0]?.message?.content || '';
  }

  private static extractFunctionCallsFromResponse(response: any): Array<{name: string; arguments: any; result: any; executionTime: number; success: boolean}> {
    const functionCall = response?.choices?.[0]?.message?.function_call;
    if (functionCall) {
      return [{
        name: functionCall.name,
        arguments: JSON.parse(functionCall.arguments || '{}'),
        result: functionCall.arguments,
        executionTime: 0,
        success: true
      }];
    }
    return [];
  }

  private static extractIntentClassification(response: any): {
    detectedIntent: string; 
    confidence: number; 
    alternativeIntents: Array<{ intent: string; confidence: number }>; 
    category: 'sales' | 'support' | 'qualification' | 'general'; 
    threshold: number; 
    isAmbiguous: boolean; 
    rawClassificationResult?: any; 
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
      rawClassificationResult: null,
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

  private static getEntityCategory(entityType: string): 'core_business' | 'advanced' | 'contact' {
    const categoryMap: Record<string, 'core_business' | 'advanced' | 'contact'> = {
      'name': 'contact',
      'email': 'contact',
      'phone': 'contact',
      'company': 'core_business',
      'industry': 'core_business',
      'budget': 'core_business',
      'timeline': 'core_business',
      'pain_point': 'advanced',
      'use_case': 'advanced',
      'decision_maker': 'advanced'
    };
    return categoryMap[entityType] || 'core_business';
  }

  private static calculateCostData(response: any, callType: string): {inputTokens: number; outputTokens: number; totalTokens: number; estimatedCost: string; model: string} {
    const usage = response?.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;
    
    // GPT-4o-mini pricing
    const inputCostPer1K = 0.00015; // $0.15 per 1M tokens
    const outputCostPer1K = 0.0006; // $0.60 per 1M tokens
    
    const inputCost = (inputTokens / 1000) * inputCostPer1K;
    const outputCost = (outputTokens / 1000) * outputCostPer1K;
    const totalCost = inputCost + outputCost;
    
    return {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost: `$${totalCost.toFixed(6)}`,
      model: response?.model || 'gpt-4o-mini'
    };
  }
} 