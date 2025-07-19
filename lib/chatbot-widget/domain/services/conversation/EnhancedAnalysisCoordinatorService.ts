/**
 * Enhanced Analysis Coordinator Service
 * 
 * Single responsibility: Coordinate enhanced conversation analysis
 * Orchestrates intent classification and knowledge retrieval
 * Follows DDD patterns with proper error handling and fallback strategies
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ChatSession } from '../../entities/ChatSession';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ContextAnalysis } from '../../value-objects/message-processing/ContextAnalysis';
import { IIntentClassificationService } from '../interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../interfaces/IKnowledgeRetrievalService';
import { ConversationEnhancedAnalysisService } from './ConversationEnhancedAnalysisService';
import { ContextAnalysisService } from './ContextAnalysisService';

interface EnhancedAnalysisResult {
  intentAnalysis?: { 
    intent?: string; 
    confidence?: number; 
    entities?: Record<string, unknown> 
  };
  relevantKnowledge?: Array<{ 
    id: string; 
    title: string; 
    content: string; 
    relevanceScore: number 
  }>;
}

export class EnhancedAnalysisCoordinatorService {
  private enhancedAnalysisService?: ConversationEnhancedAnalysisService;
  private contextAnalysisService: ContextAnalysisService;

  constructor(
    private intentClassificationService?: IIntentClassificationService,
    private knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    this.contextAnalysisService = new ContextAnalysisService();
    
    // Initialize enhanced analysis service if dependencies are available
    if (this.intentClassificationService || this.knowledgeRetrievalService) {
      this.enhancedAnalysisService = new ConversationEnhancedAnalysisService(
        this.intentClassificationService,
        this.knowledgeRetrievalService
      );
    }
  }

  async analyzeContextEnhanced(
    messages: ChatMessage[], 
    config: ChatbotConfig,
    session?: ChatSession,
    sharedLogFile?: string
  ): Promise<EnhancedAnalysisResult | ContextAnalysis> {
    try {
      // First get basic context analysis
      const baseAnalysis = this.contextAnalysisService.analyzeContext(messages, session);
      
      // If we have enhanced analysis service, use it to get intent + knowledge
      if (this.enhancedAnalysisService) {
        return await this.performEnhancedAnalysis(
          baseAnalysis,
          messages,
          config,
          session,
          sharedLogFile
        );
      }
      
      // Fallback to basic analysis if enhanced service not available
      return baseAnalysis;
    } catch (error) {
      // Log error and fallback to basic analysis
      return this.handleAnalysisError(messages, session, error);
    }
  }

  private async performEnhancedAnalysis(
    baseAnalysis: ContextAnalysis,
    messages: ChatMessage[],
    config: ChatbotConfig,
    session?: ChatSession,
    sharedLogFile?: string
  ): Promise<EnhancedAnalysisResult> {
    if (!this.enhancedAnalysisService) {
      throw new Error('Enhanced analysis service not available');
    }

    // This call triggers the vector embeddings pipeline
    // via ConversationEnhancedAnalysisService.retrieveRelevantKnowledge()
    const enhancedResult = await this.enhancedAnalysisService.enhanceAnalysis(
      baseAnalysis,
      messages,
      config,
      session,
      sharedLogFile
    );
    
    return enhancedResult;
  }

  private handleAnalysisError(
    messages: ChatMessage[],
    session?: ChatSession,
    _error?: unknown
  ): ContextAnalysis {
    // In a production system, this would log the error appropriately
    // For now, we silently fallback to basic analysis
    return this.contextAnalysisService.analyzeContext(messages, session);
  }

  hasEnhancedCapabilities(): boolean {
    return Boolean(this.enhancedAnalysisService);
  }
}