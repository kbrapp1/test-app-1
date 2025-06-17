/**
 * Entity Accumulation Application Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service that orchestrates entity accumulation workflows
 * - Coordinates domain services without containing business logic
 * - Handles session persistence and repository operations
 * - Follows @golden-rule patterns exactly
 * - Single responsibility: Entity accumulation workflow coordination
 * - Keep under 200-250 lines by delegating business logic to domain services
 * - Use proper error handling with domain-specific error types
 */

import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { IIntentClassificationService } from '../../../domain/services/interfaces/IIntentClassificationService';
import { EntityAccumulationService, EntityMergeContext, EntityMergeResult } from '../../../domain/services/context/EntityAccumulationService';
import { AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';
import { EntityCorrections } from '../../../domain/value-objects/context/EntityCorrections';
import { ExtractedEntities } from '../../../domain/value-objects/message-processing/IntentResult';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { BusinessRuleViolationError } from '../../../domain/errors/BusinessRuleViolationError';
import { ChatSessionNotFoundError, EntityPersistenceError } from '../../../domain/errors/LeadManagementErrors';

export interface EntityAccumulationRequest {
  sessionId: string;
  userMessage: string;
  messageHistory: ChatMessage[];
  messageId: string;
  enableDeduplication?: boolean;
  confidenceThreshold?: number;
}

export interface EntityAccumulationResult {
  sessionId: string;
  accumulatedEntities: AccumulatedEntities;
  extractedEntities: ExtractedEntities;
  entityCorrections: EntityCorrections | null;
  mergeMetadata: {
    totalEntitiesProcessed: number;
    correctionsApplied: number;
    newEntitiesAdded: number;
    entitiesRemoved: number;
    processingTimestamp: Date;
  };
  contextPrompt: string;
}

export interface EntityAccumulationConfig {
  defaultConfidence: number;
  enableDeduplication: boolean;
  confidenceThreshold: number;
  maxEntityAge: number; // hours
}

export class EntityAccumulationApplicationService {
  private readonly defaultConfig: EntityAccumulationConfig = {
    defaultConfidence: 0.8,
    enableDeduplication: true,
    confidenceThreshold: 0.7,
    maxEntityAge: 24
  };

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly intentClassificationService: IIntentClassificationService
  ) {}

  /**
   * Extract and accumulate entities from user message
   */
  async accumulateEntities(
    request: EntityAccumulationRequest,
    config: Partial<EntityAccumulationConfig> = {}
  ): Promise<EntityAccumulationResult> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    
    // Load existing session with context
    const session = await this.loadSessionWithContext(request.sessionId);
    
    // Extract entities with corrections from the message
    const extractionResult = await this.extractEntitiesWithCorrections(
      request.userMessage,
      request.messageHistory,
      request.sessionId
    );

    // Build merge context
    const mergeContext: EntityMergeContext = {
      messageId: request.messageId,
      defaultConfidence: mergedConfig.defaultConfidence,
      enableDeduplication: mergedConfig.enableDeduplication,
      confidenceThreshold: mergedConfig.confidenceThreshold
    };

    // Load existing accumulated entities from session
    const existingEntities = this.loadExistingEntities(session);

    // Merge entities using domain service
    const mergeResult = EntityAccumulationService.mergeEntitiesWithCorrections(
      existingEntities,
      extractionResult,
      mergeContext
    );

    // Persist updated entities to session
    await this.persistEntities(session, mergeResult.accumulatedEntities);

    // Build context prompt for AI system
    const contextPrompt = EntityAccumulationService.buildEntityContextPrompt(
      mergeResult.accumulatedEntities
    );

    return {
      sessionId: request.sessionId,
      accumulatedEntities: mergeResult.accumulatedEntities,
      extractedEntities: extractionResult,
      entityCorrections: mergeResult.processedCorrections,
      mergeMetadata: mergeResult.mergeMetadata,
      contextPrompt
    };
  }

  /**
   * Get current accumulated entities for a session
   */
  async getCurrentEntities(sessionId: string): Promise<AccumulatedEntities | null> {
    const session = await this.loadSessionWithContext(sessionId);
    return this.loadExistingEntities(session);
  }

  /**
   * Build entity context prompt for AI system
   */
  async buildEntityContextPrompt(sessionId: string): Promise<string> {
    const entities = await this.getCurrentEntities(sessionId);
    if (!entities) {
      return '';
    }
    
    return EntityAccumulationService.buildEntityContextPrompt(entities);
  }

  /**
   * Clear accumulated entities for a session (admin operation)
   */
  async clearAccumulatedEntities(sessionId: string): Promise<void> {
    const session = await this.loadSessionWithContext(sessionId);
    const emptyEntities = AccumulatedEntities.create();
    
    await this.persistEntities(session, emptyEntities);
  }

  // Private helper methods
  private async loadSessionWithContext(sessionId: string): Promise<ChatSession> {
    const session = await this.sessionRepository.findById(sessionId);
    
    if (!session) {
      throw new ChatSessionNotFoundError(
        sessionId,
        { operation: 'accumulateEntities' }
      );
    }

    return session;
  }

  private async extractEntitiesWithCorrections(
    message: string,
    messageHistory: ChatMessage[],
    sessionId: string
  ): Promise<ExtractedEntities & { corrections?: EntityCorrections }> {
    try {
      // Check if the service has the enhanced method
      if ('extractEntitiesWithCorrections' in this.intentClassificationService) {
        const result = await (this.intentClassificationService as any).extractEntitiesWithCorrections(
          message,
          { messageHistory, sessionId }
        );
        return result;
      }
      
      // Fallback to basic entity extraction without corrections
      const basicResult = await this.extractBasicEntities(message, messageHistory);
      return {
        ...basicResult,
        corrections: undefined
      };
      
    } catch (error) {
      // Fallback to basic entity extraction without corrections
      const basicResult = await this.extractBasicEntities(message, messageHistory);
      return {
        ...basicResult,
        corrections: undefined
      };
    }
  }

  private async extractBasicEntities(
    message: string,
    messageHistory: ChatMessage[]
  ): Promise<ExtractedEntities> {
    // Fallback basic entity extraction using existing intent classification
    const context = {
      messageHistory,
      currentMessage: message,
      chatbotConfig: null as any,
      session: null as any
    };

    const intentResult = await this.intentClassificationService.classifyIntent(message, context);
    return intentResult.entities || {};
  }

  private loadExistingEntities(session: ChatSession): AccumulatedEntities | null {
    try {
      const contextData = session.contextData;
      const entitiesData = contextData.accumulatedEntities;
      
      if (!entitiesData) {
        return null;
      }

      // Use proper deserialization with fromObject method
      return AccumulatedEntities.fromObject(entitiesData);
      
    } catch (error) {
      console.warn(`Failed to load entities for session ${session.id}:`, error);
      // If deserialization fails, start fresh
      return null;
    }
  }

  /**
   * Persist accumulated entities to session storage
   * AI INSTRUCTIONS:
   * - Pure application service method following @golden-rule patterns
   * - Use UPDATE repository method for existing sessions (never SAVE)
   * - Delegate entity serialization to domain value objects
   * - Provide rich error context for debugging and monitoring
   * - Handle different error types with appropriate domain errors
   * - Always validate inputs before processing
   * - Use domain entity methods for context updates
   */
  private async persistEntities(
    session: ChatSession,
    entities: AccumulatedEntities
  ): Promise<void> {
    try {
      // Validate inputs according to @golden-rule principles
      if (!session || !entities) {
        throw new BusinessRuleViolationError(
          'Invalid input for entity persistence',
          { 
            sessionId: session?.id || 'unknown',
            hasSession: !!session,
            hasEntities: !!entities
          }
        );
      }

      // Use proper domain entity serialization
      const serializedEntities = entities.toPlainObject();
      
      // Build update data using domain service patterns
      const entityUpdateData = {
        accumulatedEntities: serializedEntities,
        lastEntityUpdate: new Date().toISOString(),
        entityMetadata: {
          totalEntitiesExtracted: entities.totalExtractions,
          correctionsApplied: 0, // Will be updated when corrections are processed
          lastExtractionMethod: 'enhanced',
          lastProcessedMessageId: 'unknown', // Will be passed from request context
          entityCategories: entities.getEntityCountByCategory(),
          lastUpdateTimestamp: new Date().toISOString()
        }
      };

      // Use domain entity's updateContextData method for proper immutability
      const updatedSession = session.updateContextData(entityUpdateData);

      // Use UPDATE method for existing session (following @golden-rule repository patterns)
      await this.sessionRepository.update(updatedSession);
      
    } catch (error) {
      // Provide specific error context for debugging and monitoring
      const errorContext = {
        sessionId: session?.id || 'unknown',
        entityCount: entities?.getEntityCountByCategory() || { additive: 0, replaceable: 0, confidenceBased: 0 },
        totalExtractions: entities?.totalExtractions || 0,
        operation: 'persistEntities',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name || 'UnknownError'
      };

      // Handle different error types appropriately
      if (error instanceof BusinessRuleViolationError) {
        // Re-throw business rule violations with enhanced context
        throw new BusinessRuleViolationError(
          `Entity persistence business rule violation: ${error.message}`,
          { ...errorContext, originalError: error.context }
        );
      }

      // Wrap technical errors as domain errors following @golden-rule patterns
      throw new EntityPersistenceError(
        'accumulateEntities',
        'AccumulatedEntities',
        errorContext
      );
    }
  }
} 