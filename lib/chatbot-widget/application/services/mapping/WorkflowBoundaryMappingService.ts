/**
 * Workflow Boundary Mapping Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service for mapping orchestration
 * - Coordinates domain services and infrastructure utilities
 * - Single responsibility: mapping coordination
 * - Preserves organization security throughout
 */

import { 
  ProcessMessageRequestDto, 
  IntentAnalysisDto,
  JourneyStateDto,
  RelevantKnowledgeItemDto,
  UnifiedAnalysisResultDto,
  WorkflowResponseDto,
  CallToActionDto
} from '../../dto/WorkflowBoundaryTypes';
import { ProcessChatMessageRequest } from '../../dto/ProcessChatMessageRequest';
import { WorkflowDataExtractor } from '../../../domain/services/mapping/WorkflowDataExtractor';
import { WorkflowDefaultFactory } from '../../../domain/services/mapping/WorkflowDefaultFactory';
import { JsonPathExtractor } from '../../../infrastructure/services/mapping/JsonPathExtractor';
import { ProcessMessageRequestMapper } from '../../mappers/ProcessMessageRequestMapper';
import { MappingResult as _MappingResult } from '../../../domain/value-objects/mapping/MappingResult';

export class WorkflowBoundaryMappingService {
  private readonly dataExtractor: WorkflowDataExtractor;
  private readonly defaultFactory: WorkflowDefaultFactory;
  private readonly pathExtractor: JsonPathExtractor;

  constructor() {
    this.dataExtractor = new WorkflowDataExtractor();
    this.defaultFactory = new WorkflowDefaultFactory();
    this.pathExtractor = new JsonPathExtractor();
  }

  /**
   * Convert ProcessChatMessageRequest with organization security preservation
   */
  public toProcessMessageRequest(request: ProcessChatMessageRequest): ProcessMessageRequestDto {
    const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);
    
    if (!result.isValid) {
      throw new Error(`Failed to map ProcessMessageRequest: ${result.errorMessage}`);
    }

    return result.value;
  }

  /**
   * Extract intent analysis from unknown result with fallback
   */
  public toIntentAnalysis(result: unknown): IntentAnalysisDto {
    const extractionResult = this.dataExtractor.extractIntentAnalysis(result);
    return extractionResult.getValueOrDefault(this.defaultFactory.createDefaultIntentAnalysis());
  }

  /**
   * Extract journey state from unknown result with fallback
   */
  public toJourneyState(result: unknown): JourneyStateDto {
    const extractionResult = this.dataExtractor.extractJourneyState(result);
    return extractionResult.getValueOrDefault(this.defaultFactory.createDefaultJourneyState());
  }

  /**
   * Extract relevant knowledge from unknown result with fallback
   */
  public toRelevantKnowledge(result: unknown): RelevantKnowledgeItemDto[] {
    const extractionResult = this.dataExtractor.extractRelevantKnowledge(result);
    return extractionResult.getValueOrDefault([]);
  }

  /**
   * Extract unified analysis from unknown result with fallback
   */
  public toUnifiedAnalysis(result: unknown): UnifiedAnalysisResultDto {
    const extractionResult = this.dataExtractor.extractUnifiedAnalysis(result);
    return extractionResult.getValueOrDefault(this.defaultFactory.createDefaultUnifiedAnalysis());
  }

  /**
   * Extract workflow response from unknown result with complex path extraction
   */
  public toWorkflowResponse(result: unknown): WorkflowResponseDto {
    if (!this.isObject(result)) {
      return this.defaultFactory.createDefaultWorkflowResponse();
    }

    // Extract content using complex path logic
    const contentResult = this.pathExtractor.extractContent(result);
    const content = contentResult.getValueOrDefault(
      this.defaultFactory.createDefaultWorkflowResponse().content
    );

    // Extract confidence using fallback paths
    const confidenceResult = this.pathExtractor.extractConfidence(result);
    const confidence = confidenceResult.getValueOrDefault(0);

    // Extract token usage
    const tokenUsageResult = this.pathExtractor.extractTokenUsage(result);
    const tokenUsage = tokenUsageResult.getValueOrDefault(
      this.defaultFactory.createDefaultTokenUsage()
    );

    // Extract model with fallback
    const model = this.extractStringWithDefault(result, 'model', 'gpt-4o-mini');

    return {
      content,
      confidence,
      model,
      tokenUsage
    };
  }

  /**
   * Extract call to action from unknown result with fallback
   */
  public toCallToAction(result: unknown): CallToActionDto | undefined {
    const extractionResult = this.dataExtractor.extractCallToAction(result);
    return extractionResult.getValueOrDefault(undefined);
  }

  // Private helper methods

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private extractStringWithDefault(obj: Record<string, unknown>, key: string, defaultValue: string): string {
    const value = obj[key];
    return typeof value === 'string' ? value : defaultValue;
  }
}