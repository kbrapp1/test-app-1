/**
 * Session Update Service
 * 
 * Application service for session state updates and journey state management.
 * Single responsibility: Handle session updates and state transitions.
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { UserJourneyState } from '../../../domain/value-objects/session-management/UserJourneyState';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';

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

    // Use the domain entity's updateContextData method to ensure proper state management
    return session.updateContextData(updatedContextData);
  }

  /**
   * Save updated session
   */
  async saveSession(session: ChatSession, sharedLogFile?: string): Promise<ChatSession> {
    if (sharedLogFile && 'update' in this.sessionRepository && typeof this.sessionRepository.update === 'function') {
      return await (this.sessionRepository as any).update(session, sharedLogFile);
    }
    return await this.sessionRepository.update(session);
  }
} 