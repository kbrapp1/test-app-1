import { ProcessingDebugInfo } from '../../domain/services/interfaces/IDebugInformationService';
import { DebugInfoDto } from '../dto/DebugInfoDto';
import { ApiResponseExtractor, ApiResponse, ApiPayload } from '../services/analysis/ApiResponseExtractor';
import { MessageCostCalculationService } from '../../domain/services/utilities/MessageCostCalculationService';
import { DebugDataEnricher } from '../services/analysis/DebugDataEnricher';
import { RequestDebugDto } from '../dto/debug-components/RequestDebugDto';

// Internal API call interface for type safety
interface ApiCallData {
  requestData: {
    payload: ApiPayload;
    messageCount: number;
    timestamp: string;
    userMessage: string;
    endpoint: string;
    payloadSize: string;
  };
  responseData: {
    response: ApiResponse;
    processingTime: string;
    responseSize: string;
  };
}

// Intent analysis interface
interface IntentAnalysisData {
  intent?: string;
  confidence?: number;
  entities?: Record<string, unknown>;
}

// Journey state interface
interface JourneyStateData {
  stage?: string;
  phase?: string;
  progress?: number;
}

// Conversation metrics interface
interface ConversationMetricsData {
  messageCount: number;
  sessionDuration: number;
  engagementScore: number;
  leadQualificationProgress: number;
}

export class DebugInfoMapper {
  /**
   * Transform domain debug data to presentation DTO
   * Following DDD principles: Application layer handles data transformation
   */
  static toDto(
    domainDebugInfo: ProcessingDebugInfo | null,
    intentAnalysis?: IntentAnalysisData,
    journeyState?: JourneyStateData,
    conversationMetrics?: ConversationMetricsData,
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
        conversationMetrics: conversationMetrics || {
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
      request: this.buildRequestData(domainDebugInfo.firstApiCall as ApiCallData),
    };

    // Transform API calls
    if (domainDebugInfo.firstApiCall) {
      dto.firstApiCall = this.transformApiCall(domainDebugInfo.firstApiCall as ApiCallData, 'first');
      dto.intentClassification = ApiResponseExtractor.extractIntentClassification(
        (domainDebugInfo.firstApiCall as ApiCallData).responseData.response
      );
      dto.functionCalls = this.buildFunctionCallsStructure(domainDebugInfo.firstApiCall as ApiCallData);
    }

    if (domainDebugInfo.secondApiCall) {
      dto.secondApiCall = this.transformApiCall(domainDebugInfo.secondApiCall as ApiCallData, 'second');
    }

    // Enrich with derived data
    this.enrichWithDerivedData(dto, intentAnalysis, journeyState, conversationMetrics, shouldCaptureLeadInfo, domainDebugInfo);

    return dto;
  }

  private static buildRequestData(firstApiCall: ApiCallData | null): RequestDebugDto | undefined {
    if (!firstApiCall) return undefined;
    
    return {
      model: ApiResponseExtractor.extractModelFromPayload(firstApiCall.requestData.payload),
      messagesCount: firstApiCall.requestData.messageCount,
      temperature: ApiResponseExtractor.extractTemperatureFromPayload(firstApiCall.requestData.payload),
      maxTokens: ApiResponseExtractor.extractMaxTokensFromPayload(firstApiCall.requestData.payload),
      timestamp: firstApiCall.requestData.timestamp,
      userMessage: firstApiCall.requestData.userMessage,
      fullPrompt: `User: ${firstApiCall.requestData.userMessage}`
    };
  }

  private static transformApiCall(apiCall: ApiCallData, callType: 'first' | 'second') {
    // Already typed through parameter
    
    return {
      requestData: {
        model: ApiResponseExtractor.extractModelFromPayload(apiCall.requestData.payload),
        messagesCount: apiCall.requestData.messageCount,
        temperature: ApiResponseExtractor.extractTemperatureFromPayload(apiCall.requestData.payload),
        maxTokens: ApiResponseExtractor.extractMaxTokensFromPayload(apiCall.requestData.payload),
        timestamp: apiCall.requestData.timestamp,
        userMessage: apiCall.requestData.userMessage,
        apiEndpoint: apiCall.requestData.endpoint,
        requestSize: parseInt(apiCall.requestData.payloadSize.replace(' characters', '')),
        fullRequestPayload: apiCall.requestData.payload,
        ...(callType === 'first' && {
          functionsProvided: ApiResponseExtractor.extractFunctionsFromPayload(apiCall.requestData.payload)
        })
      },
      responseData: {
        id: ApiResponseExtractor.extractIdFromResponse(apiCall.responseData.response),
        model: ApiResponseExtractor.extractModelFromResponse(apiCall.responseData.response),
        usage: ApiResponseExtractor.extractUsageFromResponse(apiCall.responseData.response),
        responseLength: ApiResponseExtractor.extractResponseLength(apiCall.responseData.response),
        processingTime: parseInt(apiCall.responseData.processingTime.replace('ms', '')),
        fullResponse: ApiResponseExtractor.extractResponseContent(apiCall.responseData.response),
        responseSize: parseInt(apiCall.responseData.responseSize.replace(' characters', '')),
        statusCode: 200,
        ...(callType === 'first' && {
          functionCallsExecuted: ApiResponseExtractor.extractFunctionCallsFromResponse(apiCall.responseData.response)
        })
      },
      costData: this.calculateCostDataFromResponse(apiCall.responseData.response)
    };
  }

  private static buildFunctionCallsStructure(firstApiCall: ApiCallData) {
    // Already typed through parameter
    
    return {
      firstApiCall: {
        functions: ApiResponseExtractor.extractFunctionsFromPayload(firstApiCall.requestData.payload),
        functionCallsMade: ApiResponseExtractor.extractFunctionCallsFromResponse(firstApiCall.responseData.response),
        totalFunctionExecutionTime: parseInt(firstApiCall.responseData.processingTime.replace('ms', ''))
      }
    };
  }

  private static enrichWithDerivedData(
    dto: DebugInfoDto,
    intentAnalysis: IntentAnalysisData | undefined,
    journeyState: JourneyStateData | undefined,
    conversationMetrics: ConversationMetricsData | undefined,
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

  private static calculateCostDataFromResponse(response: ApiResponse) {
    const usage = response?.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const model = response?.model || 'gpt-4o-mini';
    
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