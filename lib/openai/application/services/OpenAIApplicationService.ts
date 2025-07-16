/**
 * OpenAI Application Service
 *
 * AI INSTRUCTIONS:
 * - This is a stateful, singleton application service.
 * - It orchestrates all OpenAI API calls, managing rate limit state and retries.
 * - Use the OpenAIRateLimiterService for pure calculation logic.
 * - This service should be a singleton, managed by the CompositionRoot.
 * - Follow @golden-rule patterns exactly.
 */

import {
  OpenAIRateLimitConfig,
  OpenaiUsageTier,
} from '../../domain/value-objects/OpenAIRateLimitConfig';
import {
  OpenAIRateLimiterService,
  RateLimitState,
} from '../../domain/services/OpenAIRateLimiterService';
import { delay } from '@/lib/utils';
import { logger } from '@/lib/logging';

const SERVICE_NAME = 'OpenAIApplicationService';

// Define a type for OpenAI API functions this service can execute
export type OpenAIAPICall<T> = () => Promise<T>;

export class OpenAIApplicationService {
  private readonly config: OpenAIRateLimitConfig;
  private readonly limiterService: OpenAIRateLimiterService;
  private state: RateLimitState;
  private isProcessing = false;
  private requestQueue: {
    apiCall: OpenAIAPICall<unknown>;
    estimatedTokens: number;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    retries: number;
  }[] = [];

  constructor(usageTier: OpenaiUsageTier = 'tier1') {
    this.config = new OpenAIRateLimitConfig({ usageTier });
    this.limiterService = new OpenAIRateLimiterService(this.config);
    this.state = {
      requestsThisMinute: 0,
      tokensThisMinute: 0,
      requestsToday: 0,
      tokensToday: 0,
      minuteMarker: Date.now(),
      dayMarker: Date.now(),
    };
    logger.info({
      message: `OpenAIApplicationService initialized with ${usageTier} tier config.`,
      service: SERVICE_NAME,
    });
  }

  public async execute<T>(
    apiCall: OpenAIAPICall<T>,
    estimatedTokens: number,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        apiCall,
        estimatedTokens,
        resolve: resolve as any,
        reject,
        retries: 0,
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }
    this.isProcessing = true;

    const request = this.requestQueue.shift();
    if (!request) {
      this.isProcessing = false;
      return;
    }

    const { apiCall, estimatedTokens, resolve, reject, retries } = request;

    try {
      // Re-check capacity right before processing
      await this.waitForCapacity(estimatedTokens);

      // Execute and resolve
      const result = await apiCall();
      this.recordRequest(estimatedTokens);
      resolve(result);
    } catch (error: unknown) {
      const errorObj = error as { code?: string; status?: number; message?: string };
      if (
        (errorObj.code === 'rate_limit_exceeded' || errorObj.status === 429) &&
        retries < this.config.retryAttempts
      ) {
        const delayTime =
          this.config.initialDelayMs * Math.pow(2, retries) +
          Math.random() * 1000;
        const cappedDelay = Math.min(delayTime, this.config.maxDelayMs);

        logger.warn({
          message: `Rate limit error. Retrying attempt ${
            retries + 1
          } after ${cappedDelay}ms.`,
          service: SERVICE_NAME,
          errorMessage: errorObj.message,
        });

        // Re-queue the request for retry with increased retry count
        this.requestQueue.unshift({ ...request, retries: retries + 1 });
        await delay(cappedDelay); // Wait before the next queue processing attempt
      } else {
        const errorMessage =
          'OpenAI API call failed after max retries or with non-retriable error.';
        logger.error({
          message: errorMessage,
          service: SERVICE_NAME,
          errorMessage: errorObj.message,
          code: errorObj.code,
          status: errorObj.status,
        });
        reject(error);
      }
    } finally {
      this.isProcessing = false;
      // Immediately try to process the next item
      this.processQueue();
    }
  }

  private async waitForCapacity(estimatedTokens: number) {
    while (true) {
      const capacityCheck = this.limiterService.checkCapacity(
        this.state,
        estimatedTokens,
      );

      if (capacityCheck.hasCapacity) {
        // Ensure minimum interval between requests
        const timeSinceLastRequest = Date.now() - this.state.minuteMarker;
        const minInterval = this.config.minRequestIntervalMs;
        if (
          this.state.requestsThisMinute > 0 &&
          timeSinceLastRequest < minInterval
        ) {
          const timeToWait = minInterval - timeSinceLastRequest;
          if (timeToWait > 0) {
            await delay(timeToWait);
          }
        }
        break; // Exit loop, capacity is available
      } else {
        logger.warn({
          message: `Rate limit capacity exceeded (${capacityCheck.reason}). Waiting for ${capacityCheck.timeToWaitMs}ms.`,
          service: SERVICE_NAME,
          reason: capacityCheck.reason,
        });
        await delay(capacityCheck.timeToWaitMs);
        // After waiting, the loop will re-check the capacity
      }
    }
  }

  private recordRequest(tokensUsed: number) {
    this.state.requestsThisMinute++;
    this.state.tokensThisMinute += tokensUsed;
    this.state.requestsToday++;
    if (this.config.tokensPerDay) {
      this.state.tokensToday += tokensUsed;
    }
  }
} 