/**
 * Chat Session Application Service
 * 
 * Orchestrates chat session management use cases.
 * Following DDD principles: Application services coordinate domain objects
 * without containing business logic.
 */

import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ChatSessionMapper } from '../../mappers/ChatSessionMapper';
import { ChatSession } from '../../../domain/entities/ChatSession';
import {
  ChatSessionDto,
  CreateChatSessionDto,
  UpdateChatSessionDto,
} from '../../dto/ChatSessionDto';

export class ChatSessionService {
  private readonly chatSessionRepository;
  private readonly conversationContextService: unknown;
  
  // Simple token counting service for basic operations
  private readonly basicTokenCountingService = {
    async countTextTokens(text: string): Promise<number> {
      // Simple approximation: ~4 characters per token
      return Math.ceil(text.length / 4);
    },
    async countMessageTokens(): Promise<number> {
      return 10; // Default estimate
    },
    async countMessagesTokens(): Promise<number> {
      return 50; // Default estimate  
    },
    estimateTextTokens(text: string): number {
      // Return synchronous number, not Promise
      return Math.ceil(text.length / 4);
    },
    async getTokenUsage(): Promise<{ messageTokens: number; totalTokens: number; estimatedCost: number }> {
      // Return minimal TokenUsage interface
      return { 
        messageTokens: 50, 
        totalTokens: 100, 
        estimatedCost: 0.001 
      };
    }
  };

  constructor() {
    this.chatSessionRepository = ChatbotWidgetCompositionRoot.getChatSessionRepository();
    // AI INSTRUCTIONS: Following @golden-rule patterns - this service doesn't need ConversationContextOrchestrator
    // Session management is separate from conversation context processing
    this.conversationContextService = null;
  }

  /** Create a new chat session */
  async createChatSession(createDto: CreateChatSessionDto): Promise<ChatSessionDto> {
    // Validate chatbot configuration exists
    const chatbotConfigRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const chatbotConfig = await chatbotConfigRepository.findById(createDto.chatbotConfigId);
    
    if (!chatbotConfig) {
      throw new Error('Chatbot configuration not found');
    }

    if (!chatbotConfig.isActive) {
      throw new Error('Chatbot is not active');
    }

    // Check if chatbot is within operating hours
    if (!chatbotConfig.isWithinOperatingHours()) {
      // Return session with outside hours message
      const outsideHoursSession = ChatSessionMapper.createDtoToDomain({
        ...createDto,
        status: 'completed',
      });
      
      // Create operation-specific log file for outside hours session creation
      const outsideHoursLogFile = `session-outside-hours-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
      const savedSession = await this.chatSessionRepository.save(outsideHoursSession, outsideHoursLogFile);
      return ChatSessionMapper.toDto(savedSession);
    }

    // Create new session
    const chatSession = ChatSessionMapper.createDtoToDomain(createDto);
    // Create operation-specific log file for session creation
    const sessionCreateLogFile = `session-create-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
    const savedSession = await this.chatSessionRepository.save(chatSession, sessionCreateLogFile);
    
    return ChatSessionMapper.toDto(savedSession);
  }

  /** Update chat session context and state */
  async updateChatSession(
    sessionId: string,
    updateDto: UpdateChatSessionDto
  ): Promise<ChatSessionDto> {
    const existingSession = await this.chatSessionRepository.findById(sessionId);
    
    if (!existingSession) {
      throw new Error('Chat session not found');
    }

    // Apply updates through domain entity methods
    let updatedSession = existingSession;
    
    if (updateDto.contextData) {
      // Use specific update methods from domain entity
      if (updateDto.contextData.conversationSummary) {
        updatedSession = updatedSession.updateConversationSummary(updateDto.contextData.conversationSummary);
      }
      if (updateDto.contextData.engagementScore !== undefined) {
        updatedSession = updatedSession.updateEngagementScore(updateDto.contextData.engagementScore);
      }
      // Add other context updates as needed
    }

    if (updateDto.status) {
      // Map status updates to appropriate domain methods
      switch (updateDto.status) {
        case 'abandoned':
          updatedSession = updatedSession.markAsAbandoned();
          break;
        case 'completed':
          updatedSession = updatedSession.end();
          break;
        default:
          // For other status updates, update activity
          updatedSession = updatedSession.updateActivity();
      }
    }

    // Create operation-specific log file for session updates outside conversation context
    const operationLogFile = `session-update-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
    const savedSession = await this.chatSessionRepository.update(updatedSession, operationLogFile);
    return ChatSessionMapper.toDto(savedSession);
  }

  /** Get chat session by ID */
  async getChatSessionById(sessionId: string): Promise<ChatSessionDto | null> {
    const session = await this.chatSessionRepository.findById(sessionId);
    
    if (!session) {
      return null;
    }
    
    return ChatSessionMapper.toDto(session);
  }

  /** Get active chat sessions for a chatbot */
  async getActiveSessionsForChatbot(chatbotConfigId: string): Promise<ChatSessionDto[]> {
    const sessions = await this.chatSessionRepository.findActiveByChatbotConfigId(chatbotConfigId);
    return sessions.map((session: ChatSession) => ChatSessionMapper.toDto(session));
  }

  /** Get chat sessions by visitor ID */
  async getSessionsByVisitor(visitorId: string): Promise<ChatSessionDto[]> {
    const sessions = await this.chatSessionRepository.findByVisitorId(visitorId);
    return sessions.map((session: ChatSession) => ChatSessionMapper.toDto(session));
  }

  /** End a chat session */
  async endChatSession(sessionId: string): Promise<ChatSessionDto> {
    const session = await this.chatSessionRepository.findById(sessionId);
    
    if (!session) {
      throw new Error('Chat session not found');
    }

    const endedSession = session.end();
    // Create operation-specific log file for session ending operations
    const endSessionLogFile = `session-end-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
    const savedSession = await this.chatSessionRepository.update(endedSession, endSessionLogFile);
    
    return ChatSessionMapper.toDto(savedSession);
  }

  /** Escalate chat session to human agent */
  async escalateChatSession(sessionId: string): Promise<ChatSessionDto> {
    const session = await this.chatSessionRepository.findById(sessionId);
    
    if (!session) {
      throw new Error('Chat session not found');
    }

    // For escalation, we keep the session active but add a note
    const escalatedSession = session.updateActivity(); // Keep session active
    // Create operation-specific log file for session escalation operations
    const escalationLogFile = `session-escalation-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
    const savedSession = await this.chatSessionRepository.update(escalatedSession, escalationLogFile);
    
    return ChatSessionMapper.toDto(savedSession);
  }

  /** Update visitor activity (heartbeat) */
  async updateActivity(sessionId: string): Promise<void> {
    const session = await this.chatSessionRepository.findById(sessionId);
    
    if (!session) {
      throw new Error('Chat session not found');
    }

    const updatedSession = session.updateActivity();
    // Create operation-specific log file for activity updates
    const activityLogFile = `session-activity-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
    await this.chatSessionRepository.update(updatedSession, activityLogFile);
  }

  /** Get session analytics */
  async getSessionAnalytics(organizationId: string, timeframe: string = '7d') {
    const now = new Date();
    const days = parseInt(timeframe.replace('d', '')) || 7;
    const dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return await this.chatSessionRepository.getAnalytics(organizationId, dateFrom, now);
  }

  /** Check for abandoned sessions and clean up */
  async cleanupAbandonedSessions(): Promise<number> {
    const timeoutMinutes = 30; // 30 minutes timeout
    return await this.chatSessionRepository.markExpiredAsAbandoned(timeoutMinutes);
  }
} 