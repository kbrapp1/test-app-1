import { ChatSessionProps } from '../../value-objects/session-management/ChatSessionTypes';

/**
 * Chat Session Validation Service
 * Domain Service: Pure business logic for validating session data
 * Following DDD principles: Single responsibility for validation
 */
export class ChatSessionValidationService {
  
  /** Validate chat session properties */
  static validateSessionProps(props: ChatSessionProps): void {
    if (!props.chatbotConfigId?.trim()) {
      throw new Error('Chatbot config ID is required');
    }
    
    if (!props.visitorId?.trim()) {
      throw new Error('Visitor ID is required');
    }
    
    if (!props.sessionToken?.trim()) {
      throw new Error('Session token is required');
    }

    if (!props.id?.trim()) {
      throw new Error('Session ID is required');
    }

    this.validateDates(props);
    this.validateStatus(props.status);
    this.validateEngagementScore(props.contextData.engagementScore);
  }

  /** Validate session dates */
  private static validateDates(props: ChatSessionProps): void {
    if (!(props.startedAt instanceof Date)) {
      throw new Error('startedAt must be a valid Date');
    }

    if (!(props.lastActivityAt instanceof Date)) {
      throw new Error('lastActivityAt must be a valid Date');
    }

    if (props.endedAt && !(props.endedAt instanceof Date)) {
      throw new Error('endedAt must be a valid Date');
    }

    if (props.lastActivityAt < props.startedAt) {
      throw new Error('lastActivityAt cannot be before startedAt');
    }

    if (props.endedAt && props.endedAt < props.startedAt) {
      throw new Error('endedAt cannot be before startedAt');
    }
  }

  /** Validate session status */
  private static validateStatus(status: string): void {
    const validStatuses = ['active', 'idle', 'completed', 'abandoned', 'ended'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid session status: ${status}`);
    }
  }

  /** Validate engagement score */
  private static validateEngagementScore(score: number): void {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('Engagement score must be a number between 0 and 100');
    }
  }

  /** Validate timeout value */
  static validateTimeout(timeoutMinutes: number): void {
    if (typeof timeoutMinutes !== 'number' || timeoutMinutes <= 0) {
      throw new Error('Timeout must be a positive number');
    }
  }
} 