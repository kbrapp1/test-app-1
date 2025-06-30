/**
 * Conversation Flow Analyzer Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Analyze conversation flow and readiness indicators
 * - Handle AI flow decisions and logging
 * - Keep under 200-250 lines following @golden-rule patterns
 * - Focus on conversation flow analysis only
 * - Follow DDD application service patterns
 */

import { AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';
import { ReadinessIndicatorDomainService } from '../../../domain/services/conversation-management/ReadinessIndicatorDomainService';
import { IChatbotLoggingService, ISessionLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';

export class ConversationFlowAnalyzerService {
  private readonly loggingService: IChatbotLoggingService;

  constructor() {
    // Initialize centralized logging service
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }

  /**
   * Process AI conversation flow decisions
   * 
   * AI INSTRUCTIONS:
   * - Log AI flow recommendations
   * - Calculate readiness indicators using domain service
   * - Include comprehensive flow decision analysis
   */
  processConversationFlowDecisions(
    unifiedResult: any,
    leadScore: number,
    accumulatedEntities: AccumulatedEntities,
    sessionId: string,
    logFileName?: string
  ): void {
    if (!unifiedResult?.conversationFlow) {
      return;
    }

    try {
      // Create session logger with context - shared log file is required
      if (!logFileName) {
        throw new Error('LogFileName is required for conversation flow analysis - all logging must be conversation-specific');
      }
      const logger = this.loggingService.createSessionLogger(
        sessionId,
        logFileName,
        {
          sessionId,
          operation: 'conversation-flow-analysis'
        }
      );
      
      const aiFlowDecision = unifiedResult.conversationFlow;
      const leadScoreEntities = this.convertAccumulatedEntitiesToLeadScoringFormat(
        accumulatedEntities.toPlainObject()
      );
      
      // Log AI flow decisions
      this.logAIFlowDecisions(logger, aiFlowDecision, leadScore, leadScoreEntities);
      
      // Calculate and log readiness indicators
      this.calculateAndLogReadinessIndicators(logger, leadScore, leadScoreEntities, aiFlowDecision);
      
    } catch (error) {
      console.warn('Failed to process AI flow decisions:', error);
    }
  }

  /**
   * Log AI flow decisions
   * 
   * AI INSTRUCTIONS:
   * - Log comprehensive AI recommendations
   * - Include conversation phase and engagement level
   * - Show next best action recommendations
   */
  private logAIFlowDecisions(
    logger: ISessionLogger,
    aiFlowDecision: any,
    leadScore: number,
    leadScoreEntities: any
  ): void {
    logger.logRaw('🔄 =====================================');
    logger.logRaw('🔄 AI CONVERSATION FLOW DECISIONS');
    logger.logRaw('🔄 =====================================');
    
    logger.logMessage(`AI recommends lead capture: ${aiFlowDecision.shouldCaptureLeadNow}`);
    logger.logMessage(`AI recommends qualification: ${aiFlowDecision.shouldAskQualificationQuestions}`);
    logger.logMessage(`AI recommends escalation: ${aiFlowDecision.shouldEscalateToHuman}`);
    logger.logMessage(`Conversation phase: ${aiFlowDecision.conversationPhase}`);
    logger.logMessage(`Engagement level: ${aiFlowDecision.engagementLevel}`);
    logger.logMessage(`Next best action: ${aiFlowDecision.nextBestAction}`);
    
    logger.logRaw('');
    logger.logMessage('🎯 READINESS CALCULATION (DOMAIN-BASED):');
    logger.logMessage(`Using lead score: ${leadScore}`);
    logger.logMessage('Using entities:', leadScoreEntities);
  }

  /**
   * Calculate and log readiness indicators
   * 
   * AI INSTRUCTIONS:
   * - Use ReadinessIndicatorDomainService for calculations
   * - Log detailed readiness breakdown
   * - Include readiness score and indicators
   */
  private calculateAndLogReadinessIndicators(
    logger: ISessionLogger,
    leadScore: number,
    leadScoreEntities: any,
    aiFlowDecision: any
  ): void {
    // Calculate readiness indicators
    const context = {
      leadScore,
      entities: leadScoreEntities,
      conversationPhase: aiFlowDecision.conversationPhase || 'discovery',
      engagementLevel: aiFlowDecision.engagementLevel || 'low'
    };
    
    const readinessIndicators = ReadinessIndicatorDomainService.deriveReadinessIndicators(context);
    const readinessScore = ReadinessIndicatorDomainService.calculateReadinessScore(readinessIndicators);
    
    logger.logRaw('');
    logger.logMessage('📊 READINESS INDICATORS:', readinessIndicators);
    logger.logRaw('');
    logger.logMessage(`📈 Readiness Score: ${readinessScore}`);
    logger.logRaw('🔄 =====================================');
    logger.logRaw('');
  }

  /**
   * Convert accumulated entities to lead scoring format
   * 
   * AI INSTRUCTIONS:
   * - Extract values from accumulated entities structure
   * - Return format expected by readiness calculations
   */
  private convertAccumulatedEntitiesToLeadScoringFormat(accumulatedEntities: any): Partial<Record<string, any>> {
    const leadScoringEntities: Partial<Record<string, any>> = {};
    
    const scoringEntityTypes = [
      'budget', 'timeline', 'company', 'industry', 'teamSize', 
      'urgency', 'contactMethod', 'role'
    ];
    
    scoringEntityTypes.forEach(entityType => {
      if (accumulatedEntities[entityType]?.value) {
        leadScoringEntities[entityType] = accumulatedEntities[entityType].value;
      }
    });
    
    return leadScoringEntities;
  }
} 