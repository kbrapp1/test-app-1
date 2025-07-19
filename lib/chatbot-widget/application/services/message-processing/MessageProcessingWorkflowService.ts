/**
 * Message Processing Workflow Service - DDD Refactored
 * 
 * AI INSTRUCTIONS:
 * - REFACTORED: Main orchestrator now delegates to specialized workflow components
 * - Single responsibility: Coordinate high-level workflow steps only
 * - Maintains DDD principle: Application orchestration without implementation details
 * - Preserves all organizationId security variables and workflow patterns
 * - Uses composition pattern with focused, testable components
 */

import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { IChatbotConfigRepository } from '../../../domain/repositories/IChatbotConfigRepository';
import { IDebugInformationService } from '../../../domain/services/interfaces/IDebugInformationService';
import { SessionUpdateService } from '../configuration-management/SessionUpdateService';
import { IAIConversationService } from '../../../domain/services/interfaces/IAIConversationService';
import { WorkflowContextBuilder } from './WorkflowContextBuilder';
import { WorkflowResultFinalizer } from './WorkflowResultFinalizer';
import { 
  ProcessMessageRequest, 
  WorkflowContext, 
  WorkflowFinalResult, 
  ResponseResult 
} from './WorkflowTypes';

// Re-export types for backward compatibility
export type { 
  ProcessMessageRequest, 
  WorkflowContext, 
  WorkflowFinalResult, 
  ResponseResult 
} from './WorkflowTypes';


export class MessageProcessingWorkflowService {
  private readonly workflowContextBuilder: WorkflowContextBuilder;
  private readonly workflowResultFinalizer: WorkflowResultFinalizer;
  private readonly sessionUpdateService: SessionUpdateService;

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository,
    private readonly chatbotConfigRepository: IChatbotConfigRepository,
    private readonly aiConversationService: IAIConversationService,
    private readonly debugInformationService?: IDebugInformationService
  ) {
    this.sessionUpdateService = new SessionUpdateService(sessionRepository);
    
    this.workflowContextBuilder = new WorkflowContextBuilder(
      sessionRepository,
      messageRepository,
      chatbotConfigRepository,
      debugInformationService
    );
    
    this.workflowResultFinalizer = new WorkflowResultFinalizer(
      this.sessionUpdateService,
      debugInformationService
    );
  }

  /** Delegate workflow initialization to specialized context builder */
  async initializeWorkflow(request: ProcessMessageRequest, sharedLogFile: string): Promise<WorkflowContext> {
    return this.workflowContextBuilder.initializeWorkflow(request, sharedLogFile);
  }

  /** Delegate workflow finalization to specialized result finalizer */
  async finalizeWorkflow(
    responseResult: ResponseResult,
    startTime: number,
    sharedLogFile: string
  ): Promise<WorkflowFinalResult> {
    return this.workflowResultFinalizer.finalizeWorkflow(responseResult, startTime, sharedLogFile);
  }
} 