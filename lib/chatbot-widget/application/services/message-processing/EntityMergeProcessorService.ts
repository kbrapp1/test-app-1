/**
 * Entity Merge Processor Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Process and merge entities from unified AI results
 * - Handle entity accumulation and transformation
 * - Keep under 200-250 lines following @golden-rule patterns
 * - Focus on entity processing only
 * - Follow DDD application service patterns
 * - Use centralized logging service for consistent logging
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { EntityAccumulationService } from '../../../domain/services/context/EntityAccumulationService';
import { EntityMergeContext } from '../../../domain/value-objects/context/EntityMergeContext';
import { AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';
import { ExtractedEntities } from '../../../domain/value-objects/message-processing/IntentResult';
import { IChatbotLoggingService, ISessionLogger as _ISessionLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { 
  UnifiedProcessingResult, 
  ProcessingSession, 
  ArrayEntities, 
  ApiProvidedData,
  UnifiedEntities
} from './types/UnifiedResultTypes';


export class EntityMergeProcessorService {
  private readonly loggingService: IChatbotLoggingService;

  constructor() {
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }

  /** Process and merge entities from unified AI results */
  processUnifiedEntities(
    session: ProcessingSession,
    botMessage: ChatMessage,
    unifiedResult: UnifiedProcessingResult,
    logFileName?: string
  ): {
    finalAccumulatedEntities: AccumulatedEntities;
    apiProvidedData: ApiProvidedData;
  } {
    // Create session logger with context - shared log file is required
    if (!logFileName) {
      throw new Error('LogFileName is required for entity merge processing - all logging must be conversation-specific');
    }
    const logger = this.loggingService.createSessionLogger(
      session.id,
      logFileName,
      {
        sessionId: session.id,
        operation: 'entity-merge-processing',
        messageId: botMessage.id
      }
    );
    const { analysis } = unifiedResult;
    const conversationFlow = analysis.conversationFlow;
    
    // Combine API entities for processing
    const combinedApiData = {
      ...analysis.entities,
      conversationPhase: conversationFlow?.conversationPhase,
      engagementLevel: conversationFlow?.engagementLevel,
      sentiment: analysis.sentiment,
      emotionalTone: analysis.emotionalTone
    };

    // Separate array entities from single entities
    const arrayEntities: ArrayEntities = {
      goals: analysis.entities?.goals || [],
      painPoints: analysis.entities?.painPoints || [],
      decisionMakers: analysis.entities?.decisionMakers || [],
      integrationNeeds: analysis.entities?.integrationNeeds || [],
      evaluationCriteria: analysis.entities?.evaluationCriteria || []
    };

    // Convert to extracted entities format
    const freshEntities = this.convertToExtractedEntitiesFormat(combinedApiData);
    
    // Get existing accumulated entities
    const existingAccumulatedEntities = session.contextData?.accumulatedEntities 
      ? AccumulatedEntities.fromObject(session.contextData.accumulatedEntities)
      : null;

    // Merge single entities
    const mergeContext = EntityMergeContext.create({
      messageId: botMessage.id,
      defaultConfidence: 0.9,
      enableDeduplication: true,
      confidenceThreshold: 0.7
    });
    
    const entityMergeResult = EntityAccumulationService.mergeEntitiesWithCorrections(
      existingAccumulatedEntities,
      freshEntities,
      mergeContext
    );

    // Process array entities separately
    let finalAccumulatedEntities = entityMergeResult.accumulatedEntities;
    
    // Add array entities using withAdditiveEntity method
    const validArrayEntityTypes = ['goals', 'painPoints', 'decisionMakers', 'integrationNeeds', 'evaluationCriteria'] as const;
    
    validArrayEntityTypes.forEach(entityType => {
      const values = arrayEntities[entityType];
      if (Array.isArray(values) && values.length > 0) {
        finalAccumulatedEntities = finalAccumulatedEntities.withAdditiveEntity(
          entityType,
          values,
          botMessage.id,
          0.9
        );
      }
    });

    // Log entity processing results
    logger.logStep('Entity merge completed', {
      newEntitiesAdded: entityMergeResult.mergeMetadata.newEntitiesAdded,
      finalAccumulatedEntities: finalAccumulatedEntities.getAllEntitiesSummary()
    });

    // Build API provided data structure
    const apiProvidedData = this.buildApiProvidedData(finalAccumulatedEntities, unifiedResult);

    return { finalAccumulatedEntities, apiProvidedData };
  }

  /**
   * Convert API entities to ExtractedEntities format
   * 
   * AI INSTRUCTIONS:
   * - Transform API entity values to domain service format
   * - Handle missing data gracefully
   * - Single entities only - arrays handled separately
   */
  private convertToExtractedEntitiesFormat(entities: UnifiedEntities): ExtractedEntities {
    const extractedEntities: ExtractedEntities = {};
    
    // Core business entities
    const entityTypes: (keyof ExtractedEntities)[] = [
      'visitorName', 'budget', 'timeline', 'company', 'industry', 
      'teamSize', 'role', 'urgency', 'contactMethod', 'location', 
      'currentSolution', 'preferredTime', 'sentiment', 'emotionalTone',
      'conversationPhase', 'engagementLevel'
    ];
    
    entityTypes.forEach(entityType => {
      const value = entities[entityType as keyof UnifiedEntities];
      if (value !== undefined && value !== null) {
        (extractedEntities as Record<string, unknown>)[entityType] = value;
      }
    });
    
    return extractedEntities;
  }

  /** Build API provided data structure */
  private buildApiProvidedData(
    finalAccumulatedEntities: AccumulatedEntities,
    unifiedResult: UnifiedProcessingResult
  ): ApiProvidedData {
    const accumulatedEntitiesPlain = finalAccumulatedEntities.toPlainObject();
    
    return {
      entities: {
        urgency: (accumulatedEntitiesPlain.urgency as { value?: string } | undefined)?.value as 'low' | 'medium' | 'high' || 'medium',
        goals: Array.isArray(accumulatedEntitiesPlain.goals) 
          ? accumulatedEntitiesPlain.goals.map((g: unknown) => (g as { value?: string })?.value || '').filter(Boolean)
          : [],
        painPoints: Array.isArray(accumulatedEntitiesPlain.painPoints)
          ? accumulatedEntitiesPlain.painPoints.map((p: unknown) => (p as { value?: string })?.value || '').filter(Boolean)
          : [],
        integrationNeeds: Array.isArray(accumulatedEntitiesPlain.integrationNeeds)
          ? accumulatedEntitiesPlain.integrationNeeds.map((i: unknown) => (i as { value?: string })?.value || '').filter(Boolean)
          : [],
        evaluationCriteria: Array.isArray(accumulatedEntitiesPlain.evaluationCriteria)
          ? accumulatedEntitiesPlain.evaluationCriteria.map((e: unknown) => (e as { value?: string })?.value || '').filter(Boolean)
          : [],
        company: (accumulatedEntitiesPlain.company as { value?: string } | undefined)?.value,
        role: (accumulatedEntitiesPlain.role as { value?: string } | undefined)?.value,
        budget: (accumulatedEntitiesPlain.budget as { value?: string } | undefined)?.value,
        timeline: (accumulatedEntitiesPlain.timeline as { value?: string } | undefined)?.value,
        teamSize: (accumulatedEntitiesPlain.teamSize as { value?: string } | undefined)?.value,
        industry: (accumulatedEntitiesPlain.industry as { value?: string } | undefined)?.value,
        contactMethod: (accumulatedEntitiesPlain.contactMethod as { value?: string } | undefined)?.value,
        visitorName: (accumulatedEntitiesPlain.visitorName as { value?: string } | undefined)?.value
      },
      personaInference: {
        role: (accumulatedEntitiesPlain.role as { value?: string } | undefined)?.value,
        industry: (accumulatedEntitiesPlain.industry as { value?: string } | undefined)?.value,
        evidence: unifiedResult?.analysis?.personaInference?.evidence || []
      },
      leadScore: {
        scoreBreakdown: {
          engagementLevel: unifiedResult?.leadScore?.scoreBreakdown?.engagementLevel || 0
        }
      }
    };
  }


} 