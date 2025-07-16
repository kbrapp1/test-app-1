import { ProcessingDebugInfo } from '../../domain/services/interfaces/IDebugInformationService';
import { DebugInfoDto } from '../dto/DebugInfoDto';
import { ApiResponseExtractor } from '../services/analysis/ApiResponseExtractor';
import { MessageCostCalculationService } from '../../domain/services/utilities/MessageCostCalculationService';
import { DebugDataEnricher } from '../services/analysis/DebugDataEnricher';

export class DebugInfoMapper {
  /**
   * Transform domain debug data to presentation DTO
   * Following DDD principles: Application layer handles data transformation
   */
  static toDto(
    domainDebugInfo: ProcessingDebugInfo | null,
    intentAnalysis?: unknown,
    journeyState?: unknown,
    conversationMetrics?: unknown,
    shouldCaptureLeadInfo?: boolean,
    _suggestedNextActions?: string[]
  ): DebugInfoDto | null {
    if (!domainDebugInfo) {
      return null;
    }

    const dto: DebugInfoDto = {
      // Basic session info
      session: {
        sessionId: domainDebugInfo.sessionId,
        userMessageId: domainDebugInfo.userMessageId,
        botMessageId: domainDebugInfo.botMessageId,
        conversationMetrics: (conversationMetrics as {
          messageCount: number;
          sessionDuration: number;
          engagementScore: number;
          leadQualificationProgress: number;
        }) || {
          messageCount: 0,
          sessionDuration: 0,
          engagementScore: 0,
          leadQualificationProgress: 0,
        },
        performanceMetrics: {
          processingTimeMs: domainDebugInfo.totalProcessingTime,
        },
      },
      
      // Additional context
      intentClassification: intentAnalysis as import('../dto/debug-components/IntentClassificationDebugDto').IntentClassificationDebugDto | undefined,
      journeyProgression: journeyState as import('../dto/debug-components/JourneyProgressionDebugDto').JourneyProgressionDebugDto | undefined,
      
      // Request processing information
      request: this.buildRequestData(domainDebugInfo.firstApiCall),
    };

    // Transform API calls
    if (domainDebugInfo.firstApiCall) {
      dto.firstApiCall = this.transformApiCall(domainDebugInfo.firstApiCall, 'first');
      dto.intentClassification = ApiResponseExtractor.extractIntentClassification(
        domainDebugInfo.firstApiCall.responseData.response
      );
      dto.functionCalls = this.buildFunctionCallsStructure(domainDebugInfo.firstApiCall);
    }

    if (domainDebugInfo.secondApiCall) {
      dto.secondApiCall = this.transformApiCall(domainDebugInfo.secondApiCall, 'second');
    }

    // Enrich with derived data
    this.enrichWithDerivedData(dto, intentAnalysis, journeyState, conversationMetrics, shouldCaptureLeadInfo, domainDebugInfo);

    return dto;
  }

  private static buildRequestData(firstApiCall: unknown) {
    if (!firstApiCall) return undefined;
    
    const apiCall = firstApiCall as { 
      requestData: {
        payload: unknown;
        messageCount: number;
        timestamp: string;
        userMessage: string;
      }
    };
    
    return {
      model: ApiResponseExtractor.extractModelFromPayload(apiCall.requestData.payload),
      messagesCount: apiCall.requestData.messageCount,
      temperature: ApiResponseExtractor.extractTemperatureFromPayload(apiCall.requestData.payload),
      maxTokens: ApiResponseExtractor.extractMaxTokensFromPayload(apiCall.requestData.payload),
      timestamp: apiCall.requestData.timestamp,
      userMessage: apiCall.requestData.userMessage,
      fullPrompt: `User: ${apiCall.requestData.userMessage}`
    };
  }

  private static transformApiCall(apiCall: unknown, callType: 'first' | 'second') {
    const call = apiCall as {
      requestData: {
        payload: unknown;
        messageCount: number;
        timestamp: string;
        userMessage: string;
        endpoint: string;
        payloadSize: string;
      };
      responseData: {
        response: unknown;
        processingTime: string;
        responseSize: string;
      };
    };
    
    return {
      requestData: {
        model: ApiResponseExtractor.extractModelFromPayload(call.requestData.payload),
        messagesCount: call.requestData.messageCount,
        temperature: ApiResponseExtractor.extractTemperatureFromPayload(call.requestData.payload),
        maxTokens: ApiResponseExtractor.extractMaxTokensFromPayload(call.requestData.payload),
        timestamp: call.requestData.timestamp,
        userMessage: call.requestData.userMessage,
        apiEndpoint: call.requestData.endpoint,
        requestSize: parseInt(call.requestData.payloadSize.replace(' characters', '')),
        fullRequestPayload: call.requestData.payload as Record<string, unknown> | undefined,
        ...(callType === 'first' && {
          functionsProvided: ApiResponseExtractor.extractFunctionsFromPayload(call.requestData.payload)
        })
      },
      responseData: {
        id: ApiResponseExtractor.extractIdFromResponse(call.responseData.response),
        model: ApiResponseExtractor.extractModelFromResponse(call.responseData.response),
        usage: ApiResponseExtractor.extractUsageFromResponse(call.responseData.response),
        responseLength: ApiResponseExtractor.extractResponseLength(call.responseData.response),
        processingTime: parseInt(call.responseData.processingTime.replace('ms', '')),
        fullResponse: ApiResponseExtractor.extractResponseContent(call.responseData.response),
        responseSize: parseInt(call.responseData.responseSize.replace(' characters', '')),
        statusCode: 200,
        ...(callType === 'first' && {
          functionCallsExecuted: ApiResponseExtractor.extractFunctionCallsFromResponse(call.responseData.response)
        })
      },
      costData: this.calculateCostDataFromResponse(call.responseData.response)
    };
  }

  private static buildFunctionCallsStructure(firstApiCall: unknown) {
    const call = firstApiCall as {
      requestData: { payload: unknown };
      responseData: { response: unknown; processingTime: string };
    };
    
    return {
      firstApiCall: {
        functions: ApiResponseExtractor.extractFunctionsFromPayload(call.requestData.payload),
        functionCallsMade: ApiResponseExtractor.extractFunctionCallsFromResponse(call.responseData.response),
        totalFunctionExecutionTime: parseInt(call.responseData.processingTime.replace('ms', ''))
      }
    };
  }

  private static enrichWithDerivedData(
    dto: DebugInfoDto,
    intentAnalysis: unknown,
    journeyState: unknown,
    conversationMetrics: unknown,
    shouldCaptureLeadInfo: boolean | undefined,
    domainDebugInfo: ProcessingDebugInfo
  ) {
    if (intentAnalysis) {
      dto.entityExtraction = DebugDataEnricher.buildEntityExtraction(intentAnalysis, domainDebugInfo);
    }

    if (conversationMetrics) {
      dto.leadScoring = DebugDataEnricher.buildLeadScoring(conversationMetrics);
    }

    if (journeyState) {
      dto.journeyProgression = DebugDataEnricher.buildJourneyProgression(journeyState);
    }

    dto.businessRules = DebugDataEnricher.buildBusinessRules(shouldCaptureLeadInfo);
  }

  private static calculateCostDataFromResponse(response: unknown) {
    const responseData = response as {
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };
    
    const usage = responseData?.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const model = responseData?.model || 'gpt-4o-mini';
    
    // Use domain service for proper cost calculation
    const breakdown = MessageCostCalculationService.calculateCostBreakdown(
      model,
      promptTokens,
      completionTokens
    );
    
    return {
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCost: `$${breakdown.totalCents.toFixed(6)}`,
      model
    };
  }
} 