/**
 * Chat Session Types and Interfaces
 * Following DDD principles: Separate type definitions for clarity
 */

import { SessionContext } from './SessionContextTypes';
import { LeadQualificationState, SessionStatus } from './SessionSupportTypes';

// Re-export all types for backward compatibility
export type { SessionContext } from './SessionContextTypes';
export type { LeadQualificationState, SessionStatus, ContactInfo, SessionMetrics, AnsweredQuestion } from './SessionSupportTypes';
export type { PageView } from './SessionContextTypes';

export interface ChatSessionProps {
  id: string;
  chatbotConfigId: string;
  visitorId: string;
  sessionToken: string;
  contextData: SessionContext;
  leadQualificationState: LeadQualificationState;
  status: SessionStatus;
  startedAt: Date;
  lastActivityAt: Date;
  endedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  currentUrl?: string;
}


 