/**
 * Workflow Result Builder Service
 * 
 * AI INSTRUCTIONS:
 * - Handle result building and DTO conversion for workflow orchestration
 * - Transform internal workflow results to presentation DTOs
 * - Maintain single responsibility for result transformation
 * - Use boundary mappers for type-safe conversions
 * - Keep under 200 lines following SRP
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ProcessChatMessageResult, ProcessChatMessageResultBuilder } from '../../dto/ProcessChatMessageResult';
import { WorkflowBoundaryMapper } from '../../mappers/WorkflowBoundaryMapper';
import {
    CallToActionData,
    ConversationMetricsData,
    FinalWorkflowResult,
    IntentAnalysisData,
    JourneyStateData,
    SuggestedActionsData
} from '../../types/WorkflowOrchestrationTypes';

export class WorkflowResultBuilderService {
  /**
   * Build ProcessChatMessageResult from final workflow result
   */
  buildResult(finalResult: FinalWorkflowResult): ProcessChatMessageResult {
    // AI: Use boundary mapper for type-safe conversions
    const _intentAnalysis = WorkflowBoundaryMapper.toIntentAnalysis(finalResult);
    const _journeyState = WorkflowBoundaryMapper.toJourneyState(finalResult);
    const relevantKnowledge = WorkflowBoundaryMapper.toRelevantKnowledge(finalResult);
    const _callToAction = WorkflowBoundaryMapper.toCallToAction(finalResult);

    return new ProcessChatMessageResultBuilder()
      .withChatSession(finalResult.session as ChatSession)
      .withUserMessage(finalResult.userMessage as ChatMessage)
      .withBotResponse(finalResult.botMessage as ChatMessage)
      .withLeadCapture(finalResult.shouldCaptureLeadInfo)
      .withSuggestedActions(this.extractSuggestedActions(finalResult.suggestedNextActions))
      .withConversationMetrics(this.buildConversationMetrics(finalResult.conversationMetrics))
      .withIntentAnalysis(this.buildIntentAnalysis(finalResult.intentAnalysis))
      .withJourneyState(this.buildJourneyState(finalResult.journeyState))
      .withRelevantKnowledge(relevantKnowledge)
      .withCallToAction(this.buildCallToAction(finalResult.callToAction))
      .build();
  }

  /**
   * Extract suggested actions from workflow result
   */
  private extractSuggestedActions(suggestedNextActions: SuggestedActionsData[]): string[] {
    return (suggestedNextActions || []).map((action: string | SuggestedActionsData) => 
      typeof action === 'string' ? action : action.action || action.description || String(action)
    );
  }

  /**
   * Build conversation metrics from workflow result
   */
  private buildConversationMetrics(conversationMetrics: ConversationMetricsData) {
    return {
      messageCount: conversationMetrics?.messageCount || 0,
      sessionDuration: conversationMetrics?.sessionDuration || 0,
      engagementScore: conversationMetrics?.engagementScore || 0,
      leadQualificationProgress: conversationMetrics?.leadQualificationProgress || 0
    };
  }

  /**
   * Build intent analysis from workflow result
   */
  private buildIntentAnalysis(intentAnalysis: IntentAnalysisData) {
    return intentAnalysis ? {
      intent: intentAnalysis.intent || 'unknown',
      confidence: intentAnalysis.confidence || 0,
      entities: intentAnalysis.entities || {},
      category: 'general'
    } : undefined;
  }

  /**
   * Build journey state from workflow result
   */
  private buildJourneyState(journeyState: JourneyStateData) {
    return journeyState ? {
      stage: journeyState.stage || 'initial',
      confidence: 0.5,
      isSalesReady: false,
      recommendedActions: []
    } : undefined;
  }

  /**
   * Build call to action from workflow result
   */
  private buildCallToAction(callToAction: CallToActionData) {
    return callToAction ? {
      type: callToAction.type || 'none',
      message: callToAction.text || '',
      priority: String(callToAction.priority || 'low')
    } : undefined;
  }
} 