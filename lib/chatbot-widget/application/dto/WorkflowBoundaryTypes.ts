/**
 * Workflow Boundary Types
 * 
 * DDD-compliant boundary interfaces for cross-service communication.
 * These DTOs ensure type safety at application service boundaries.
 */

// Request transformation interface
export interface ProcessMessageRequestDto {
  readonly userMessage: string;
  readonly sessionId: string;
  readonly organizationId: string;
  readonly metadata?: MessageMetadataDto;
}

export interface MessageMetadataDto {
  readonly userId?: string;
  readonly timestamp?: Date;
  readonly clientInfo?: Record<string, unknown>;
}

// Intent analysis boundary type
export interface IntentAnalysisDto {
  readonly primaryIntent: string;
  readonly confidence: number;
  readonly entities: Record<string, unknown>;
  readonly sentiment?: 'positive' | 'neutral' | 'negative';
}

// Journey state boundary type
export interface JourneyStateDto {
  readonly currentStage: string;
  readonly completedStages: readonly string[];
  readonly nextRecommendedStage?: string;
  readonly progressPercentage: number;
}

// Relevant knowledge boundary type
export interface RelevantKnowledgeItemDto {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly relevanceScore: number;
}

// Unified analysis result boundary type
export interface UnifiedAnalysisResultDto {
  readonly primaryIntent: string;
  readonly primaryConfidence: number;
  readonly sentiment?: 'positive' | 'neutral' | 'negative';
  readonly emotionalTone?: string;
  readonly entities: Record<string, unknown>;
}

// Workflow response boundary type
export interface WorkflowResponseDto {
  readonly content: string;
  readonly confidence: number;
  readonly model?: string;
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

// Call to action boundary type
export interface CallToActionDto {
  readonly type: string;
  readonly text: string;
  readonly priority: number;
}