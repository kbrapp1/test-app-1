import { ChatbotConfig } from '../../../entities/ChatbotConfig';
import { ChatSession } from '../../../entities/ChatSession';
import { ChatMessage } from '../../../entities/ChatMessage';
import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';

/** Simple Prompt Generation Types */
// Core input contract for prompt generation
export interface PromptGenerationInput {
  readonly chatbotConfig: ChatbotConfig;
  readonly session: ChatSession;
  readonly messageHistory: ChatMessage[];
  readonly logger?: ISessionLogger;
  readonly enhancedContext?: EnhancedPromptContext;
}

// Enhanced context for entity and vector injection
export interface EnhancedPromptContext {
  readonly entityContextPrompt?: string;
  readonly relevantKnowledge?: KnowledgeItem[];
  readonly journeyState?: JourneyState;
  readonly knowledgeRetrievalThreshold?: number;
}

// Knowledge item structure for vector search results
export interface KnowledgeItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly relevanceScore: number;
  readonly category?: string;
  readonly sourceType?: string;
}

// Journey state for conversation context
export interface JourneyState {
  readonly stage: string;
  readonly confidence: number;
  isSalesReady(): boolean;
  getRecommendedActions(): string[];
}

// Output structure with component breakdown
export interface SystemPromptResult {
  readonly content: string;
  readonly generatedAt: Date;
  readonly components: PromptComponents;
  readonly metadata: PromptMetadata;
}

// Individual prompt components for transparency
export interface PromptComponents {
  readonly persona: string;
  readonly knowledgeBase: string;
  readonly entityContext?: string;
  readonly relevantKnowledge?: string;
  readonly businessGuidance: string;
  readonly conversationContext: string;
  readonly journeyContext?: string;
}

// Metadata about prompt generation
export interface PromptMetadata {
  readonly totalLength: number;
  readonly estimatedTokens: number;
  readonly knowledgeItemsCount: number;
  readonly hasEntityContext: boolean;
  readonly hasJourneyContext: boolean;
  readonly processingTimeMs: number;
}

// Enum for different prompt sections
export enum PromptSection {
  PERSONA = 'persona',
  KNOWLEDGE_BASE = 'knowledge_base',
  ENTITY_CONTEXT = 'entity_context',
  RELEVANT_KNOWLEDGE = 'relevant_knowledge',
  BUSINESS_GUIDANCE = 'business_guidance',
  CONVERSATION_CONTEXT = 'conversation_context',
  JOURNEY_CONTEXT = 'journey_context'
}

// Value object for prompt generation options
export class PromptGenerationOptions {
  constructor(
    public readonly includeEntityContext: boolean = true,
    public readonly includeVectorSearch: boolean = true,
    public readonly includeJourneyState: boolean = true,
    public readonly maxKnowledgeItems: number = 5,
    public readonly minRelevanceScore: number = 0.15
  ) {
    // AI: Validate options to ensure business rules
    if (maxKnowledgeItems < 0 || maxKnowledgeItems > 20) {
      throw new Error('maxKnowledgeItems must be between 0 and 20');
    }
    if (minRelevanceScore < 0 || minRelevanceScore > 1) {
      throw new Error('minRelevanceScore must be between 0 and 1');
    }
  }

  // AI: Factory methods for common configurations
  static default(): PromptGenerationOptions {
    return new PromptGenerationOptions();
  }

  static minimal(): PromptGenerationOptions {
    return new PromptGenerationOptions(false, false, false, 0, 0.5);
  }

  static knowledgeOnly(): PromptGenerationOptions {
    return new PromptGenerationOptions(false, true, false, 3, 0.2);
  }
}

// Domain service interface for simple prompt generation
export interface ISimplePromptService {
  generateSystemPrompt(
    input: PromptGenerationInput,
    options?: PromptGenerationOptions
  ): Promise<SystemPromptResult>;
  
  generateSystemPromptSync(
    input: PromptGenerationInput,
    options?: PromptGenerationOptions
  ): SystemPromptResult;
} 