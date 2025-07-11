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

  /** Process AI conversation flow decisions
   * 
   * AI INSTRUCTIONS:
   * - Adapted for simplified schema without conversationFlow section
   * - Creates flow decisions from available lead_data and intent
   * - Maintains same logging output for debugging consistency
   */
  processConversationFlowDecisions(
    unifiedResult: any,
    leadScore: number,
    accumulatedEntities: AccumulatedEntities,
    sessionId: string,
    logFileName?: string
  ): void {
    if (!unifiedResult) {
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
      
      // AI: Create flow decision from simplified schema response
      const aiFlowDecision = this.createFlowDecisionFromSimplifiedResponse(unifiedResult, leadScore);
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

  /** Log AI flow decisions
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

  /** Calculate and log readiness indicators
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

  /** Convert accumulated entities to lead scoring format
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

  /**
   * Create flow decision from simplified schema response
   * 
   * AI INSTRUCTIONS:
   * - Maps simplified lead_qualification_response to expected flow decision format
   * - Maintains compatibility with existing logging and analysis
   * - Uses lead score and intent to determine flow decisions
   */
  private createFlowDecisionFromSimplifiedResponse(unifiedResult: any, leadScore: number): any {
    const intent = unifiedResult.intent || 'inquiry';
    const leadData = unifiedResult.lead_data || {};
    const response = unifiedResult.response || {};
    
    return {
      shouldCaptureLeadNow: response.capture_contact || leadScore >= 60,
      shouldAskQualificationQuestions: leadScore >= 30 && leadScore < 70,
      shouldEscalateToHuman: leadScore >= 80,
      nextBestAction: this.mapIntentToAction(intent, response.capture_contact),
      conversationPhase: this.mapIntentToPhase(intent, leadScore),
      engagementLevel: this.mapScoreToEngagement(leadScore),
      flowReasoning: `Intent: ${intent}, Lead score: ${leadScore}, Capture: ${response.capture_contact}`
    };
  }

  /** Map intent to next best action */
  private mapIntentToAction(intent: string, shouldCapture: boolean): string {
    if (shouldCapture) return 'capture_contact';
    
    switch (intent) {
      case 'demo': return 'request_demo';
      case 'pricing': return 'provide_resources';
      case 'qualification': return 'ask_qualification';
      case 'objection': return 'continue_conversation';
      default: return 'continue_conversation';
    }
  }

  /** Map intent and score to conversation phase */
  private mapIntentToPhase(intent: string, leadScore: number): string {
    if (leadScore >= 70) return 'qualification';
    if (intent === 'demo' || intent === 'pricing') return 'demonstration';
    if (leadScore >= 40) return 'discovery';
    return 'discovery';
  }

  /** Map lead score to engagement level */
  private mapScoreToEngagement(leadScore: number): string {
    if (leadScore >= 70) return 'high';
    if (leadScore >= 40) return 'medium';
    return 'low';
  }
} 