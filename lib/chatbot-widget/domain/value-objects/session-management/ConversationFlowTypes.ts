/**
 * Conversation Flow Types
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Define conversation flow and tracking interfaces
 * - Domain value objects for conversation phase management
 * - Keep under 100 lines by focusing on flow structures only
 * - Follow DDD patterns exactly
 */

export interface ConversationFlowTypes {
  currentPhase: 'discovery' | 'qualification' | 'demo' | 'objection_handling' | 'closing';
  phaseStartedAt: Date;
  phaseHistory: Array<{
    phase: string;
    startedAt: Date;
    duration?: number;
    completionStatus: 'completed' | 'interrupted' | 'ongoing';
  }>;
  objectives: {
    primary?: string; // "schedule demo", "get pricing info"
    secondary: string[];
    achieved: string[];
    blocked: string[]; // objectives that hit obstacles
  };
}