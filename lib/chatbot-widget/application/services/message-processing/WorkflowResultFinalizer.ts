/**
 * Workflow Result Finalizer
 * 
 * AI INSTRUCTIONS:
 * - Handles workflow finalization, metrics calculation, and result assembly
 * - Manages session updates, lead capture decisions, and debug information
 * - Maintains DDD principle: Application orchestration with business rule delegation
 * - Preserves all organizationId security variables and context patterns
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { IDebugInformationService } from '../../../domain/services/interfaces/IDebugInformationService';
import { ConversationMetricsService } from '../conversation-management/ConversationMetricsService';
import { LeadCaptureDecisionService } from '../lead-management/LeadCaptureDecisionService';
import { SessionUpdateService } from '../configuration-management/SessionUpdateService';
import { ConversationFlowService, AIConversationFlowDecision } from '../../../domain/services/conversation-management/ConversationFlowService';
import { JourneyStageMapper } from './JourneyStageMapper';
import { 
  ResponseResult, 
  WorkflowFinalResult, 
  EnhancedContext,
  ConversationMetrics,
  IntentAnalysis,
  JourneyState
} from './WorkflowTypes';

export class WorkflowResultFinalizer {
  private readonly conversationMetricsService: ConversationMetricsService;
  private readonly leadCaptureDecisionService: LeadCaptureDecisionService;
  private readonly sessionUpdateService: SessionUpdateService;

  constructor(
    sessionUpdateService: SessionUpdateService,
    private readonly debugInformationService?: IDebugInformationService
  ) {
    this.conversationMetricsService = new ConversationMetricsService();
    
    // Create ConversationFlowService for LeadCaptureDecisionService
    const conversationFlowService = new ConversationFlowService();
    this.leadCaptureDecisionService = new LeadCaptureDecisionService(conversationFlowService);
    this.sessionUpdateService = sessionUpdateService;
  }

  /**
   * Finalize workflow and return complete result
   */
  async finalizeWorkflow(
    responseResult: ResponseResult,
    startTime: number,
    sharedLogFile: string
  ): Promise<WorkflowFinalResult> {
    const { session, userMessage, botMessage, allMessages, config, enhancedContext } = responseResult;

    // Save updated session
    const finalSession = await this.sessionUpdateService.saveSession(session, sharedLogFile);

    // Calculate metrics and determine actions
    const aiFlowContext = this.createAIFlowContext(enhancedContext);
    const shouldCaptureLeadInfo = this.leadCaptureDecisionService.shouldTriggerLeadCapture(
      finalSession, 
      config, 
      aiFlowContext
    );
    const conversationMetrics = await this.conversationMetricsService.calculateConversationMetrics(
      finalSession, 
      allMessages
    );

    // Update debug session with processing time
    const totalProcessingTime = Date.now() - startTime;
    this.updateDebugProcessingTime(finalSession.id, totalProcessingTime);

    return {
      session: finalSession,
      userMessage,
      botMessage,
      shouldCaptureLeadInfo,
      suggestedNextActions: [], // Empty array - using log file tracking only
      conversationMetrics,
      intentAnalysis: JourneyStageMapper.buildIntentAnalysis(enhancedContext),
      journeyState: JourneyStageMapper.buildJourneyState(enhancedContext),
      relevantKnowledge: enhancedContext?.relevantKnowledge,
      callToAction: enhancedContext?.callToAction
    };
  }

  /**
   * Create AI flow context from enhanced context data
   */
  private createAIFlowContext(enhancedContext: EnhancedContext): { aiFlowDecision: AIConversationFlowDecision } {
    // Use the LeadCaptureDecisionService's createAIFlowContext method
    // This ensures consistency and proper mapping
    return this.leadCaptureDecisionService.createAIFlowContext(enhancedContext);
  }

  /**
   * Update debug session with processing time
   */
  private updateDebugProcessingTime(sessionId: string, processingTime: number): void {
    if (this.debugInformationService) {
      this.debugInformationService.updateProcessingTime(sessionId, processingTime);
    }
  }

  /**
   * Determine conversation phase based on lead score
   */
  private determineConversationPhase(enhancedContext: EnhancedContext): string {
    const totalScore = enhancedContext.leadScore?.totalScore;
    if (totalScore !== undefined && totalScore >= 70) return 'qualification';
    if (totalScore !== undefined && totalScore >= 40) return 'discovery';
    return 'introduction';
  }

  /**
   * Determine engagement level based on confidence score
   */
  private determineEngagementLevel(enhancedContext: EnhancedContext): string {
    const confidence = enhancedContext.unifiedAnalysis?.primaryConfidence || 0;
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }
}