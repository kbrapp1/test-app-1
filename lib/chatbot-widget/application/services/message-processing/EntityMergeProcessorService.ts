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
import { AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';
import { ExtractedEntities } from '../../../domain/value-objects/message-processing/IntentResult';
import { IChatbotLoggingService, ISessionLogger as _ISessionLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';


export class EntityMergeProcessorService {
  private readonly loggingService: IChatbotLoggingService;

  constructor() {
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }

  /** Process and merge entities from unified AI results */
  processUnifiedEntities(
    session: any,
    botMessage: ChatMessage,
    unifiedResult: any,
    logFileName?: string
  ): {
    finalAccumulatedEntities: AccumulatedEntities;
    apiProvidedData: any;
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
    const arrayEntities = {
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
    const entityMergeResult = EntityAccumulationService.mergeEntitiesWithCorrections(
      existingAccumulatedEntities,
      freshEntities,
      {
        messageId: botMessage.id,
        defaultConfidence: 0.9,
        enableDeduplication: true,
        confidenceThreshold: 0.7
      }
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
  private convertToExtractedEntitiesFormat(entities: any): ExtractedEntities {
    const extractedEntities: ExtractedEntities = {};
    
    // Core business entities
    const entityTypes: (keyof ExtractedEntities)[] = [
      'visitorName', 'budget', 'timeline', 'company', 'industry', 
      'teamSize', 'role', 'urgency', 'contactMethod', 'location', 
      'currentSolution', 'preferredTime', 'sentiment', 'emotionalTone',
      'conversationPhase', 'engagementLevel'
    ];
    
    entityTypes.forEach(entityType => {
      const value = entities[entityType];
      if (value !== undefined && value !== null) {
        (extractedEntities as any)[entityType] = value;
      }
    });
    
    return extractedEntities;
  }

  /** Build API provided data structure */
  private buildApiProvidedData(
    finalAccumulatedEntities: AccumulatedEntities,
    unifiedResult: any
  ): any {
    const accumulatedEntitiesPlain = finalAccumulatedEntities.toPlainObject();
    
    return {
      entities: {
        urgency: accumulatedEntitiesPlain.urgency?.value || 'medium' as const,
        goals: accumulatedEntitiesPlain.goals?.map((g: any) => g.value) || [],
        painPoints: accumulatedEntitiesPlain.painPoints?.map((p: any) => p.value) || [],
        integrationNeeds: accumulatedEntitiesPlain.integrationNeeds?.map((i: any) => i.value) || [],
        evaluationCriteria: accumulatedEntitiesPlain.evaluationCriteria?.map((e: any) => e.value) || [],
        company: accumulatedEntitiesPlain.company?.value,
        role: accumulatedEntitiesPlain.role?.value,
        budget: accumulatedEntitiesPlain.budget?.value,
        timeline: accumulatedEntitiesPlain.timeline?.value,
        teamSize: accumulatedEntitiesPlain.teamSize?.value,
        industry: accumulatedEntitiesPlain.industry?.value,
        contactMethod: accumulatedEntitiesPlain.contactMethod?.value,
        visitorName: accumulatedEntitiesPlain.visitorName?.value
      },
      personaInference: {
        role: accumulatedEntitiesPlain.role?.value,
        industry: accumulatedEntitiesPlain.industry?.value,
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