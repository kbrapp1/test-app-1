/**
 * Session Update Service
 * 
 * Application service for session state updates and journey state management.
 * Single responsibility: Handle session updates and state transitions.
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { UserJourneyState } from '../../domain/value-objects/UserJourneyState';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';

export class SessionUpdateService {
  constructor(
    private readonly sessionRepository: IChatSessionRepository
  ) {}

  /**
   * Update session with journey state information
   */
  updateSessionWithJourneyState(
    session: ChatSession,
    journeyState: UserJourneyState
  ): ChatSession {
    const updatedContextData = {
      ...session.contextData,
      journeyState: {
        stage: journeyState.stage,
        confidence: journeyState.confidence,
        metadata: journeyState.metadata
      }
    };

    return ChatSession.fromPersistence({
      ...session.toPlainObject(),
      contextData: updatedContextData,
      lastActivityAt: new Date()
    });
  }

  /**
   * Save updated session
   */
  async saveSession(session: ChatSession): Promise<ChatSession> {
    return await this.sessionRepository.update(session);
  }
} 