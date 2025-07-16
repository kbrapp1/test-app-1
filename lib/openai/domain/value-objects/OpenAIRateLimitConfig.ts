/**
 * OpenAI Rate Limit Configuration Value Object
 *
 * AI INSTRUCTIONS:
 * - This is an immutable value object representing OpenAI API rate limit configurations.
 * - Use for defining and validating rate limits for different usage tiers.
 * - Ensure all properties are readonly and that the constructor enforces validation rules.
 * - Follow @golden-rule patterns exactly.
 */

import {
  BusinessRuleViolationError,
} from '@/lib/errors/base';

export const OPENAI_USAGE_TIERS = {
  free: {
    rpm: 3,
    tpm: 40_000,
    requestsPerDay: 200,
    tokensPerDay: null, // No explicit daily token limit
    maxBatchSize: 2048,
    retryAttempts: 3,
    initialDelayMs: 20000,
    maxDelayMs: 60000,
  },
  tier1: {
    rpm: 3_000,
    tpm: 1_000_000,
    requestsPerDay: null,
    tokensPerDay: null,
    maxBatchSize: 2048,
    retryAttempts: 6,
    initialDelayMs: 1000,
    maxDelayMs: 20000,
  },
  tier2: {
    rpm: 5_000,
    tpm: 1_000_000,
    requestsPerDay: null,
    tokensPerDay: null,
    maxBatchSize: 2048,
    retryAttempts: 6,
    initialDelayMs: 1000,
    maxDelayMs: 20000,
  },
  tier3: {
    rpm: 5_000,
    tpm: 1_500_000,
    requestsPerDay: null,
    tokensPerDay: null,
    maxBatchSize: 2048,
    retryAttempts: 6,
    initialDelayMs: 500,
    maxDelayMs: 20000,
  },
  tier4: {
    rpm: 10_000,
    tpm: 5_000_000,
    requestsPerDay: null,
    tokensPerDay: null,
    maxBatchSize: 2048,
    retryAttempts: 8,
    initialDelayMs: 200,
    maxDelayMs: 20000,
  },
  tier5: {
    rpm: 10_000,
    tpm: 10_000_000,
    requestsPerDay: null,
    tokensPerDay: null,
    maxBatchSize: 2048,
    retryAttempts: 8,
    initialDelayMs: 100,
    maxDelayMs: 20000,
  },
} as const;

export type OpenaiUsageTier = keyof typeof OPENAI_USAGE_TIERS;

export interface OpenAIRateLimitConfigProps {
  usageTier: OpenaiUsageTier;
}

export class OpenAIRateLimitConfig {
  public readonly usageTier: OpenaiUsageTier;
  public readonly rpm: number;
  public readonly tpm: number;
  public readonly requestsPerDay: number | null;
  public readonly tokensPerDay: number | null;
  public readonly maxBatchSize: number;
  public readonly retryAttempts: number;
  public readonly initialDelayMs: number;
  public readonly maxDelayMs: number;

  constructor(props: OpenAIRateLimitConfigProps) {
    this.usageTier = props.usageTier;

    const tierConfig = OPENAI_USAGE_TIERS[this.usageTier];
    if (!tierConfig) {
      throw new BusinessRuleViolationError(
        `Invalid OpenAI usage tier: ${this.usageTier}`,
        { usageTier: this.usageTier },
      );
    }

    this.rpm = tierConfig.rpm;
    this.tpm = tierConfig.tpm;
    this.requestsPerDay = tierConfig.requestsPerDay;
    this.tokensPerDay = tierConfig.tokensPerDay;
    this.maxBatchSize = tierConfig.maxBatchSize;
    this.retryAttempts = tierConfig.retryAttempts;
    this.initialDelayMs = tierConfig.initialDelayMs;
    this.maxDelayMs = tierConfig.maxDelayMs;

    this.validate();
  }

  private validate(): void {
    if (this.rpm <= 0) {
      throw new BusinessRuleViolationError('RPM must be positive.', {
        rpm: this.rpm,
      });
    }
    if (this.tpm <= 0) {
      throw new BusinessRuleViolationError('TPM must be positive.', {
        tpm: this.tpm,
      });
    }
    if (this.requestsPerDay !== null && this.requestsPerDay <= 0) {
      throw new BusinessRuleViolationError(
        'Requests per day must be positive or null.',
        { requestsPerDay: this.requestsPerDay },
      );
    }
    if (this.retryAttempts < 0) {
      throw new BusinessRuleViolationError(
        'Retry attempts cannot be negative.',
        { retryAttempts: this.retryAttempts },
      );
    }
    if (this.initialDelayMs <= 0 || this.maxDelayMs <= this.initialDelayMs) {
      throw new BusinessRuleViolationError(
        'Delay timings are invalid. Max delay must be greater than initial delay.',
        {
          initialDelayMs: this.initialDelayMs,
          maxDelayMs: this.maxDelayMs,
        },
      );
    }
  }

  public get minRequestIntervalMs(): number {
    return 60_000 / this.rpm;
  }
} 