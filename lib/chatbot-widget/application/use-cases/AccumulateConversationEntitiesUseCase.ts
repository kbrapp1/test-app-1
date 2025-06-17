/**
 * Accumulate Conversation Entities Use Case
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate entity accumulation workflows
 * - Coordinate entity extraction, correction processing, and persistence
 * - Handle error scenarios and fallback mechanisms
 * - Follow @golden-rule patterns exactly
 * - Keep under 200-250 lines by delegating to application services
 * - Use proper error handling with domain-specific error types
 */

import { EntityAccumulationApplicationService, EntityAccumulationRequest, EntityAccumulationResult } from '../services/context/EntityAccumulationApplicationService';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { IDebugInformationService } from '../../domain/services/interfaces/IDebugInformationService';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { BusinessRuleViolationError } from '../../domain/errors/BusinessRuleViolationError';
import { ChatSessionNotFoundError } from '../../domain/errors/LeadManagementErrors';

export interface AccumulateEntitiesRequest {
  sessionId: string;
  userMessage: string;
  messageHistory: ChatMessage[];
  messageId: string;
  enableDebugging?: boolean;
  customConfig?: {
    defaultConfidence?: number;
    enableDeduplication?: boolean;
    confidenceThreshold?: number;
    maxEntityAge?: number;
  };
}

export interface AccumulateEntitiesResult {
  success: boolean;
  sessionId: string;
  accumulation: {
    accumulatedEntities: any;
    extractedEntities: any;
    entityCorrections: any | null;
    contextPrompt: string;
  };
  metadata: {
    totalEntitiesProcessed: number;
    correctionsApplied: number;
    newEntitiesAdded: number;
    entitiesRemoved: number;
    processingTimestamp: Date;
    processingTimeMs: number;
  };
  debugInfo?: {
    extractionMethod: 'enhanced' | 'basic' | 'fallback';
    apiCalls: any[];
    errors: string[];
    confidence: number;
  };
}

export interface AccumulateEntitiesError {
  success: false;
  error: {
    code: string;
    message: string;
    context: Record<string, any>;
  };
  sessionId?: string;
}

export class AccumulateConversationEntitiesUseCase {
  private readonly entityAccumulationService: EntityAccumulationApplicationService;

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly intentClassificationService: IIntentClassificationService,
    private readonly debugInformationService?: IDebugInformationService
  ) {
    this.entityAccumulationService = new EntityAccumulationApplicationService(
      sessionRepository,
      intentClassificationService
    );
  }

  /**
   * Execute entity accumulation for a conversation
   */
  async execute(request: AccumulateEntitiesRequest): Promise<AccumulateEntitiesResult | AccumulateEntitiesError> {
    const startTime = Date.now();
    
    try {
      // Validate request
      this.validateRequest(request);

      // Build accumulation request
      const accumulationRequest: EntityAccumulationRequest = {
        sessionId: request.sessionId,
        userMessage: request.userMessage,
        messageHistory: request.messageHistory,
        messageId: request.messageId,
        enableDeduplication: request.customConfig?.enableDeduplication,
        confidenceThreshold: request.customConfig?.confidenceThreshold
      };

      // Execute entity accumulation
      const result = await this.entityAccumulationService.accumulateEntities(
        accumulationRequest,
        request.customConfig
      );

      const processingTime = Date.now() - startTime;

      // Capture debug information if enabled
      let debugInfo;
      if (request.enableDebugging && this.debugInformationService) {
        debugInfo = await this.captureDebugInformation(request, result, processingTime);
      }

      return {
        success: true,
        sessionId: request.sessionId,
        accumulation: {
          accumulatedEntities: result.accumulatedEntities,
          extractedEntities: result.extractedEntities,
          entityCorrections: result.entityCorrections,
          contextPrompt: result.contextPrompt
        },
        metadata: {
          ...result.mergeMetadata,
          processingTimeMs: processingTime
        },
        debugInfo
      };

    } catch (error) {
      return this.handleError(error, request.sessionId, Date.now() - startTime);
    }
  }

  /**
   * Get current accumulated entities for a session (read-only operation)
   */
  async getCurrentEntities(sessionId: string): Promise<any | null> {
    try {
      return await this.entityAccumulationService.getCurrentEntities(sessionId);
    } catch (error) {
      if (error instanceof ChatSessionNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Build entity context prompt for AI system (read-only operation)
   */
  async buildContextPrompt(sessionId: string): Promise<string> {
    try {
      return await this.entityAccumulationService.buildEntityContextPrompt(sessionId);
    } catch (error) {
      if (error instanceof ChatSessionNotFoundError) {
        return '';
      }
      throw error;
    }
  }

  /**
   * Clear accumulated entities for a session (admin operation)
   */
  async clearEntities(sessionId: string): Promise<void> {
    await this.entityAccumulationService.clearAccumulatedEntities(sessionId);
  }

  /**
   * Batch process multiple messages for entity accumulation
   */
  async executeBatch(requests: AccumulateEntitiesRequest[]): Promise<(AccumulateEntitiesResult | AccumulateEntitiesError)[]> {
    const results: (AccumulateEntitiesResult | AccumulateEntitiesError)[] = [];
    
    // Process sequentially to maintain entity accumulation order
    for (const request of requests) {
      const result = await this.execute(request);
      results.push(result);
      
      // Stop processing if a critical error occurs
      if (!result.success && this.isCriticalError((result as AccumulateEntitiesError).error)) {
        break;
      }
    }
    
    return results;
  }

  // Private helper methods
  private validateRequest(request: AccumulateEntitiesRequest): void {
    if (!request.sessionId?.trim()) {
      throw new BusinessRuleViolationError(
        'Session ID is required for entity accumulation',
        { request: { sessionId: request.sessionId } }
      );
    }

    if (!request.userMessage?.trim()) {
      throw new BusinessRuleViolationError(
        'User message is required for entity extraction',
        { request: { userMessage: request.userMessage, sessionId: request.sessionId } }
      );
    }

    if (!request.messageId?.trim()) {
      throw new BusinessRuleViolationError(
        'Message ID is required for entity tracking',
        { request: { messageId: request.messageId, sessionId: request.sessionId } }
      );
    }

    if (!Array.isArray(request.messageHistory)) {
      throw new BusinessRuleViolationError(
        'Message history must be an array',
        { request: { messageHistoryType: typeof request.messageHistory, sessionId: request.sessionId } }
      );
    }
  }

  private async captureDebugInformation(
    request: AccumulateEntitiesRequest,
    result: EntityAccumulationResult,
    processingTime: number
  ): Promise<any> {
    if (!this.debugInformationService) {
      return undefined;
    }

    try {
      return {
        extractionMethod: result.entityCorrections ? 'enhanced' : 'basic',
        processingTime,
        entityCounts: {
          extracted: this.countEntities(result.extractedEntities),
          accumulated: this.countEntities(result.accumulatedEntities.getAllEntitiesSummary()),
          corrections: result.entityCorrections?.totalCorrections || 0
        },
        confidence: this.calculateAverageConfidence(result.extractedEntities),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        extractionMethod: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown debug error'
      };
    }
  }

  private handleError(
    error: unknown,
    sessionId?: string,
    processingTime?: number
  ): AccumulateEntitiesError {
    if (error instanceof ChatSessionNotFoundError) {
      return {
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Chat session not found',
          context: { sessionId, processingTime }
        },
        sessionId
      };
    }

    if (error instanceof BusinessRuleViolationError) {
      return {
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
          message: error.message,
          context: { ...error.context, sessionId, processingTime }
        },
        sessionId
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during entity accumulation',
        context: { 
          sessionId, 
          processingTime,
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      sessionId
    };
  }

  private isCriticalError(error: { code: string }): boolean {
    const criticalErrorCodes = ['INTERNAL_ERROR', 'DATABASE_ERROR', 'SERVICE_UNAVAILABLE'];
    return criticalErrorCodes.includes(error.code);
  }

  private countEntities(entities: any): number {
    if (!entities || typeof entities !== 'object') {
      return 0;
    }

    let count = 0;
    for (const value of Object.values(entities)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value !== null && value !== undefined) {
        count += 1;
      }
    }
    return count;
  }

  private calculateAverageConfidence(entities: any): number {
    if (!entities || typeof entities !== 'object') {
      return 0;
    }

    const confidenceValues: number[] = [];
    Object.values(entities).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'object' && item && 'confidence' in item && typeof item.confidence === 'number') {
            confidenceValues.push(item.confidence);
          }
        });
      } else if (typeof value === 'object' && value && 'confidence' in value && typeof (value as any).confidence === 'number') {
        confidenceValues.push((value as any).confidence);
      }
    });

    return confidenceValues.length > 0
      ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length
      : 0;
  }
} 