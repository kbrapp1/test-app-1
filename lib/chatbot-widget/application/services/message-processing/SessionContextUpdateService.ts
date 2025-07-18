/**
 * Session Context Update Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate session context updates
 * - Delegate to specialized services for specific concerns
 * - Keep under 200-250 lines following @golden-rule patterns
 * - Focus on coordination, not implementation
 * - Follow DDD application service patterns
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { AccumulatedEntities as _AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';
import { EntityMergeProcessorService } from './EntityMergeProcessorService';
import { LeadScoreCalculatorService } from './LeadScoreCalculatorService';
import { ConversationFlowAnalyzerService } from './ConversationFlowAnalyzerService';
import { UnifiedProcessingResult, ProcessingSession as _ProcessingSession } from './types/UnifiedResultTypes';
import { SessionContext } from '../../../domain/value-objects/session-management/ChatSessionTypes';

export class SessionContextUpdateService {
  constructor(
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly entityMergeProcessor: EntityMergeProcessorService,
    private readonly leadScoreCalculator: LeadScoreCalculatorService,
    private readonly conversationFlowAnalyzer: ConversationFlowAnalyzerService
  ) {}

  /** Update session with unified processing results */
  updateSessionWithUnifiedResults(
    session: ChatSession,
    botMessage: ChatMessage,
    allMessages: ChatMessage[],
    unifiedResult: UnifiedProcessingResult | Record<string, unknown>,
    sharedLogFile: string
  ): ChatSession {
    // Process and merge entities from unified result
    // Convert ChatSession to ProcessingSession format for compatibility
    const processingSession = {
      id: session.id,
      conversationId: session.id,
      contextData: {
        accumulatedEntities: session.contextData?.accumulatedEntities || {}
      }
    };
    
    const { finalAccumulatedEntities, apiProvidedData } = this.entityMergeProcessor.processUnifiedEntities(
      processingSession,
      botMessage,
      unifiedResult as UnifiedProcessingResult,
      sharedLogFile
    );

    // Update session through orchestrator
    const updatedSession = this.conversationContextOrchestrator.updateSessionContext(
      session,
      botMessage,
      allMessages,
      apiProvidedData
    );

    // Calculate domain-based lead scoring
    const leadScore = this.leadScoreCalculator.calculateDomainLeadScore(
      finalAccumulatedEntities,
      session.id,
      sharedLogFile
    );

    // Convert accumulated entities to session context format
    const serializedEntities = finalAccumulatedEntities.toPlainObject();
    const sessionContextEntities = {
      decisionMakers: serializedEntities.decisionMakers.map(e => e.value as string),
      painPoints: serializedEntities.painPoints.map(e => e.value as string),
      integrationNeeds: serializedEntities.integrationNeeds.map(e => e.value as string),
      evaluationCriteria: serializedEntities.evaluationCriteria.map(e => e.value as string),
      budget: serializedEntities.budget ? {
        value: serializedEntities.budget.value as string,
        confidence: serializedEntities.budget.confidence,
        lastUpdated: serializedEntities.budget.extractedAt,
        sourceMessageId: serializedEntities.budget.sourceMessageId
      } : undefined,
      timeline: serializedEntities.timeline ? {
        value: serializedEntities.timeline.value as string,
        confidence: serializedEntities.timeline.confidence,
        lastUpdated: serializedEntities.timeline.extractedAt,
        sourceMessageId: serializedEntities.timeline.sourceMessageId
      } : undefined,
      urgency: serializedEntities.urgency ? {
        value: serializedEntities.urgency.value as string,
        confidence: serializedEntities.urgency.confidence,
        lastUpdated: serializedEntities.urgency.extractedAt,
        sourceMessageId: serializedEntities.urgency.sourceMessageId
      } : undefined,
      contactMethod: serializedEntities.contactMethod ? {
        value: serializedEntities.contactMethod.value as string,
        confidence: serializedEntities.contactMethod.confidence,
        lastUpdated: serializedEntities.contactMethod.extractedAt,
        sourceMessageId: serializedEntities.contactMethod.sourceMessageId
      } : undefined,
      visitorName: serializedEntities.visitorName ? {
        value: serializedEntities.visitorName.value as string,
        confidence: serializedEntities.visitorName.confidence,
        lastUpdated: serializedEntities.visitorName.extractedAt,
        sourceMessageId: serializedEntities.visitorName.sourceMessageId
      } : undefined,
      role: serializedEntities.role ? {
        value: serializedEntities.role.value as string,
        confidence: serializedEntities.role.confidence,
        lastUpdated: serializedEntities.role.extractedAt,
        sourceMessageId: serializedEntities.role.sourceMessageId
      } : undefined,
      industry: serializedEntities.industry ? {
        value: serializedEntities.industry.value as string,
        confidence: serializedEntities.industry.confidence,
        lastUpdated: serializedEntities.industry.extractedAt,
        sourceMessageId: serializedEntities.industry.sourceMessageId
      } : undefined,
      company: serializedEntities.company ? {
        value: serializedEntities.company.value as string,
        confidence: serializedEntities.company.confidence,
        lastUpdated: serializedEntities.company.extractedAt,
        sourceMessageId: serializedEntities.company.sourceMessageId
      } : undefined,
      teamSize: serializedEntities.teamSize ? {
        value: serializedEntities.teamSize.value as string,
        confidence: serializedEntities.teamSize.confidence,
        lastUpdated: serializedEntities.teamSize.extractedAt,
        sourceMessageId: serializedEntities.teamSize.sourceMessageId
      } : undefined
    };

    // Build enhanced context data
    const enhancedContextData: Partial<SessionContext> = {
      ...updatedSession.contextData,
      accumulatedEntities: sessionContextEntities,
      leadScore
    };

    // Update session with enhanced context
    const finalUpdatedSession = updatedSession.updateContextData(enhancedContextData);

    // Process AI conversation flow decisions
    this.conversationFlowAnalyzer.processConversationFlowDecisions(
      unifiedResult as UnifiedProcessingResult,
      leadScore,
      finalAccumulatedEntities,
      session.id,
      sharedLogFile
    );

    return finalUpdatedSession;
  }
} 