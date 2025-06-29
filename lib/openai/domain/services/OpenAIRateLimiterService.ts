/**
 * OpenAI Rate Limiter Domain Service
 *
 * AI INSTRUCTIONS:
 * - This is a pure, stateless domain service.
 * - It contains the core business logic for rate limit calculations.
 * - Do not include any state management here (e.g., counters, timers).
 * - All methods should be pure functions that take the current state and return a result.
 * - Follow @golden-rule patterns exactly.
 */

import { OpenAIRateLimitConfig } from '../value-objects/OpenAIRateLimitConfig';

export interface RateLimitState {
  requestsThisMinute: number;
  tokensThisMinute: number;
  requestsToday: number;
  tokensToday: number;
  minuteMarker: number;
  dayMarker: number;
}

export interface CapacityCheckResult {
  hasCapacity: boolean;
  timeToWaitMs: number;
  reason: 'rpm' | 'tpm' | 'rpd' | 'tpd' | null;
}

export class OpenAIRateLimiterService {
  constructor(private readonly config: OpenAIRateLimitConfig) {}

  public checkCapacity(
    state: RateLimitState,
    estimatedTokens: number,
  ): CapacityCheckResult {
    const now = Date.now();

    // Reset minute counters if a minute has passed
    if (now - state.minuteMarker > 60_000) {
      state.requestsThisMinute = 0;
      state.tokensThisMinute = 0;
      state.minuteMarker = now;
    }

    // Reset day counters if a day has passed
    if (now - state.dayMarker > 86_400_000) {
      state.requestsToday = 0;
      state.tokensToday = 0;
      state.dayMarker = now;
    }

    // Check requests per minute
    if (state.requestsThisMinute + 1 > this.config.rpm) {
      return {
        hasCapacity: false,
        timeToWaitMs: state.minuteMarker + 60_000 - now,
        reason: 'rpm',
      };
    }

    // Check tokens per minute
    if (state.tokensThisMinute + estimatedTokens > this.config.tpm) {
      return {
        hasCapacity: false,
        timeToWaitMs: state.minuteMarker + 60_000 - now,
        reason: 'tpm',
      };
    }

    // Check daily request limit if applicable
    if (
      this.config.requestsPerDay &&
      state.requestsToday + 1 > this.config.requestsPerDay
    ) {
      return {
        hasCapacity: false,
        timeToWaitMs: state.dayMarker + 86_400_000 - now,
        reason: 'rpd',
      };
    }

    // Check daily token limit if applicable
    if (
      this.config.tokensPerDay &&
      state.tokensToday + estimatedTokens > this.config.tokensPerDay
    ) {
      return {
        hasCapacity: false,
        timeToWaitMs: state.dayMarker + 86_400_000 - now,
        reason: 'tpd',
      };
    }

    return { hasCapacity: true, timeToWaitMs: 0, reason: null };
  }
} 