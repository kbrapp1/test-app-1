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
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { AccumulatedEntities as _AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';
import { EntityMergeProcessorService } from './EntityMergeProcessorService';
import { LeadScoreCalculatorService } from './LeadScoreCalculatorService';
import { ConversationFlowAnalyzerService } from './ConversationFlowAnalyzerService';

export class SessionContextUpdateService {
  constructor(
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly entityMergeProcessor: EntityMergeProcessorService,
    private readonly leadScoreCalculator: LeadScoreCalculatorService,
    private readonly conversationFlowAnalyzer: ConversationFlowAnalyzerService
  ) {}

  /** Update session with unified processing results */
  updateSessionWithUnifiedResults(
    session: any,
    botMessage: ChatMessage,
    allMessages: ChatMessage[],
    unifiedResult: any,
    sharedLogFile: string
  ): any {
    // Process and merge entities from unified result
    const { finalAccumulatedEntities, apiProvidedData } = this.entityMergeProcessor.processUnifiedEntities(
      session,
      botMessage,
      unifiedResult,
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

    // Build enhanced context data
    const enhancedContextData = {
      ...updatedSession.contextData,
      accumulatedEntities: finalAccumulatedEntities.toPlainObject(),
      leadScore,
      sharedLogFile: sharedLogFile
    };

    // Update session with enhanced context
    const finalUpdatedSession = updatedSession.updateContextData(enhancedContextData);

    // Process AI conversation flow decisions
    this.conversationFlowAnalyzer.processConversationFlowDecisions(
      unifiedResult,
      leadScore,
      finalAccumulatedEntities,
      session.id,
      sharedLogFile
    );

    return finalUpdatedSession;
  }
} 