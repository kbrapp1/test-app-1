/**
 * Workflow Domain Value Objects
 * 
 * DDD-compliant value objects for workflow analysis and processing.
 * These represent immutable domain concepts used within the workflow domain.
 */

// Intent analysis value object
export interface IntentAnalysis {
  readonly primaryIntent: string;
  readonly confidence: number;
  readonly entities: Record<string, unknown>;
  readonly sentiment?: 'positive' | 'neutral' | 'negative';
}

// Journey state value object
export interface JourneyState {
  readonly currentStage: string;
  readonly completedStages: readonly string[];
  readonly nextRecommendedStage?: string;
  readonly progressPercentage: number;
}

// Relevant knowledge item value object
export interface RelevantKnowledgeItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly relevanceScore: number;
}

// Unified analysis result value object
export interface UnifiedAnalysisResult {
  readonly primaryIntent: string;
  readonly primaryConfidence: number;
  readonly sentiment?: 'positive' | 'neutral' | 'negative';
  readonly emotionalTone?: string;
  readonly entities: Record<string, unknown>;
}

// Workflow response value object
export interface WorkflowResponse {
  readonly content: string;
  readonly confidence: number;
  readonly model?: string;
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

// Call to action value object
export interface CallToAction {
  readonly type: string;
  readonly text: string;
  readonly priority: number;
}

// Message metadata value object
export interface MessageMetadata {
  readonly userId?: string;
  readonly timestamp?: Date;
  readonly clientInfo?: Record<string, unknown>;
}

// Process message request value object
export interface ProcessMessageRequest {
  readonly userMessage: string;
  readonly sessionId: string;
  readonly organizationId: string;
  readonly metadata?: MessageMetadata;
}