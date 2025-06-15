import { ChatSessionProps, SessionStatus } from '../../value-objects/session-management/ChatSessionTypes';

/**
 * Session State Service
 * Domain Service: Pure business logic for session state management
 * Following DDD principles: Single responsibility for state transitions
 */
export class SessionStateService {
  
  /**
   * Update session activity and potentially change status
   */
  static updateActivity(props: ChatSessionProps): ChatSessionProps {
    const now = new Date();
    const newStatus = props.status === 'idle' ? 'active' : props.status;
    
    return {
      ...props,
      lastActivityAt: now,
      status: newStatus
    };
  }

  /**
   * Mark session as idle
   */
  static markAsIdle(props: ChatSessionProps): ChatSessionProps {
    return {
      ...props,
      status: 'idle',
      lastActivityAt: new Date()
    };
  }

  /**
   * Mark session as abandoned
   */
  static markAsAbandoned(props: ChatSessionProps): ChatSessionProps {
    return {
      ...props,
      status: 'abandoned',
      endedAt: new Date()
    };
  }

  /**
   * End session
   */
  static endSession(props: ChatSessionProps): ChatSessionProps {
    return {
      ...props,
      status: 'ended',
      endedAt: new Date()
    };
  }

  /**
   * Mark session as completed
   */
  static markAsCompleted(props: ChatSessionProps): ChatSessionProps {
    return {
      ...props,
      status: 'completed',
      endedAt: new Date()
    };
  }

  /**
   * Update current URL
   */
  static updateCurrentUrl(props: ChatSessionProps, url: string): ChatSessionProps {
    return {
      ...props,
      currentUrl: url,
      lastActivityAt: new Date()
    };
  }

  /**
   * Update session metadata
   */
  static updateSessionMetadata(
    props: ChatSessionProps,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      referrerUrl?: string;
    }
  ): ChatSessionProps {
    return {
      ...props,
      ipAddress: metadata.ipAddress || props.ipAddress,
      userAgent: metadata.userAgent || props.userAgent,
      referrerUrl: metadata.referrerUrl || props.referrerUrl,
      lastActivityAt: new Date()
    };
  }

  /**
   * Check if session can be ended
   */
  static canEndSession(status: SessionStatus): boolean {
    return ['active', 'idle'].includes(status);
  }

  /**
   * Check if session is active
   */
  static isActive(status: SessionStatus): boolean {
    return status === 'active';
  }

  /**
   * Check if session is ended
   */
  static isEnded(status: SessionStatus): boolean {
    return ['ended', 'abandoned', 'completed'].includes(status);
  }
} 