/**
 * Session Update Service
 * 
 * Application service for session state updates and journey state management.
 * Single responsibility: Handle session updates and state transitions.
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
// Removed UserJourneyState import - using pure API-driven approach
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';

export class SessionUpdateService {
  constructor(
    private readonly sessionRepository: IChatSessionRepository
  ) {}

  /**
   * Update session with journey state information - REMOVED
   * Using pure API-driven approach per user requirements
   */
  // updateSessionWithJourneyState method removed - using pure API-driven approach

  /**
   * Save updated session
   */
  async saveSession(session: ChatSession, sharedLogFile: string): Promise<ChatSession> {
    return await this.sessionRepository.update(session, sharedLogFile);
  }
} 