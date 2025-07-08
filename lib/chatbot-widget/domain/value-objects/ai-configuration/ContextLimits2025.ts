/**
 * 2025 Context Management Limits - Quick Win Optimizations
 * 
 * AI INSTRUCTIONS:
 * - These are the optimized limits based on 2025 LLM best practices
 * - Use these constants throughout the codebase for consistency
 * - Values are based on GPT-4 128k context window capabilities
 * - Balances performance, cost, and conversation quality
 */

export const CONTEXT_LIMITS_2025 = {
  // Message History Management
  MESSAGE_HISTORY_TURNS: 18,        // Up from 10 (80% increase)
  CRITICAL_MESSAGE_PRESERVE: 3,     // Always keep last 3 messages
  
  // Intent Tracking
  INTENT_HISTORY_LIMIT: 15,         // Up from 10 (50% increase)
  RECENT_INTENT_TRACKING: 8,        // Up from 5 (60% increase)
  
  // Token Management
  MAX_CONTEXT_TOKENS: 16000,        // Up from 12000 (33% increase)
  SYSTEM_PROMPT_TOKENS: 800,        // Up from 500 (60% increase)
  RESPONSE_RESERVED_TOKENS: 3500,   // Up from 3000 (17% increase)
  SUMMARY_TOKENS: 300,              // Up from 200 (50% increase)
  
  // Entity Retention
  ENTITY_RETENTION_LIMIT: 50,       // New: Keep more business entities
  ENTITY_CONFIDENCE_THRESHOLD: 0.7, // New: Quality threshold
  
  // Business Context
  BUSINESS_CONTEXT_DECAY: 0.15,     // Per-turn decay rate
  MIN_BUSINESS_CONTEXT_STRENGTH: 0.3, // Minimum baseline
  BUSINESS_INTENT_BOOST: 0.2,       // Boost for multiple business interactions
  
  // Performance Optimization
  TOKEN_BUFFER_SAFETY: 1000,        // Safety buffer for token counting
  SUMMARIZATION_TRIGGER_RATIO: 1.5, // When to trigger summarization
  COMPRESSION_EFFICIENCY_TARGET: 0.6 // Target compression ratio
} as const;

/** Validation function to ensure limits are sensible */
export function validateContextLimits(): boolean {
  const limits = CONTEXT_LIMITS_2025;
  
  // Validate token allocation doesn't exceed max
  const totalReserved = limits.SYSTEM_PROMPT_TOKENS + 
                       limits.RESPONSE_RESERVED_TOKENS + 
                       limits.SUMMARY_TOKENS + 
                       limits.TOKEN_BUFFER_SAFETY;
  
  if (totalReserved > limits.MAX_CONTEXT_TOKENS) {
    throw new Error(`Context limits validation failed: Reserved tokens (${totalReserved}) exceed max tokens (${limits.MAX_CONTEXT_TOKENS})`);
  }
  
  // Validate history limits are reasonable
  if (limits.MESSAGE_HISTORY_TURNS < limits.CRITICAL_MESSAGE_PRESERVE) {
    throw new Error('Message history turns must be greater than critical message preserve count');
  }
  
  return true;
}

/** Get available tokens for message content */
export function getAvailableMessageTokens(): number {
  const limits = CONTEXT_LIMITS_2025;
  return limits.MAX_CONTEXT_TOKENS - 
         limits.SYSTEM_PROMPT_TOKENS - 
         limits.RESPONSE_RESERVED_TOKENS - 
         limits.SUMMARY_TOKENS - 
         limits.TOKEN_BUFFER_SAFETY;
}

/** Calculate business context strength with 2025 optimization */
export function calculateBusinessContextStrength(
  turnsSinceLastBusiness: number,
  businessIntentCount: number
): number {
  const limits = CONTEXT_LIMITS_2025;
  
  // Base strength with decay
  let strength = Math.max(
    limits.MIN_BUSINESS_CONTEXT_STRENGTH, 
    1.0 - (turnsSinceLastBusiness * limits.BUSINESS_CONTEXT_DECAY)
  );
  
  // Boost for multiple business interactions
  if (businessIntentCount >= 2) {
    strength = Math.min(1.0, strength + limits.BUSINESS_INTENT_BOOST);
  }
  
  return strength;
} 