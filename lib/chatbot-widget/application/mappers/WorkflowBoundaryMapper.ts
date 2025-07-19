/**
 * Workflow Boundary Mapper (Legacy Adapter)
 * 
 * AI INSTRUCTIONS:
 * - Maintains backward compatibility
 * - Delegates to new DDD-structured services
 * - Preserves existing API surface
 * - Single responsibility: API compatibility
 */

import { 
  ProcessMessageRequestDto, 
  IntentAnalysisDto,
  JourneyStateDto,
  RelevantKnowledgeItemDto,
  UnifiedAnalysisResultDto,
  WorkflowResponseDto,
  CallToActionDto
} from '../dto/WorkflowBoundaryTypes';
import { ProcessChatMessageRequest } from '../dto/ProcessChatMessageRequest';
import { WorkflowBoundaryMappingService } from '../services/mapping/WorkflowBoundaryMappingService';

export class WorkflowBoundaryMapper {
  private static readonly mappingService = new WorkflowBoundaryMappingService();

  /**
   * Convert ProcessChatMessageRequest to ProcessMessageRequestDto with security preservation
   */
  static toProcessMessageRequest(request: ProcessChatMessageRequest): ProcessMessageRequestDto {
    return this.mappingService.toProcessMessageRequest(request);
  }

  /**
   * Safely extract intent analysis from unknown result
   */
  static toIntentAnalysis(result: unknown): IntentAnalysisDto {
    return this.mappingService.toIntentAnalysis(result);
  }

  /**
   * Safely extract journey state from unknown result
   */
  static toJourneyState(result: unknown): JourneyStateDto {
    return this.mappingService.toJourneyState(result);
  }

  /**
   * Safely extract relevant knowledge from unknown result
   */
  static toRelevantKnowledge(result: unknown): RelevantKnowledgeItemDto[] {
    return this.mappingService.toRelevantKnowledge(result);
  }

  /**
   * Safely extract unified analysis from unknown result
   */
  static toUnifiedAnalysis(result: unknown): UnifiedAnalysisResultDto {
    return this.mappingService.toUnifiedAnalysis(result);
  }

  /**
   * Safely extract workflow response from unknown result
   */
  static toWorkflowResponse(result: unknown): WorkflowResponseDto {
    return this.mappingService.toWorkflowResponse(result);
  }

  /**
   * Safely extract call to action from unknown result
   */
  static toCallToAction(result: unknown): CallToActionDto | undefined {
    return this.mappingService.toCallToAction(result);
  }
}