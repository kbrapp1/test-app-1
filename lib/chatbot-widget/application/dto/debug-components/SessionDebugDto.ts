/**
 * Session Debug DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Session-related debug information
 * - Handle session state and conversation metrics
 * - Keep under 200-250 lines
 * - Focus on session debugging only
 * - Follow @golden-rule patterns exactly
 */

export interface SessionDebugDto {
  sessionId: string;
  userMessageId?: string;
  botMessageId?: string;
  shouldCaptureLeadInfo?: boolean;
  suggestedNextActions?: string[];
  
  conversationMetrics: {
    messageCount: number;
    sessionDuration: number;
    engagementScore: number;
    leadQualificationProgress: number;
    averageResponseTime?: number;
    userEngagementLevel?: 'low' | 'medium' | 'high';
    conversationQuality?: number;
  };
  
  sessionState?: {
    isActive: boolean;
    lastActivity: string;
    totalInteractions: number;
    sessionStartTime: string;
    currentStage: string;
    userContext?: Record<string, any>;
  };
  
  performanceMetrics?: {
    processingTimeMs: number;
    memoryUsage?: number;
    cpuUsage?: number;
    cacheHitRate?: number;
    databaseQueries?: number;
  };
} 