/**
 * Status Management DTOs
 * Single Responsibility: Data contracts between application and presentation layers
 * Application Layer - Immutable data structures for layer boundaries
 */

/**
 * Generation Status DTO for presentation layer
 * Clean, presentation-friendly status data
 */
export interface GenerationStatusDto {
  readonly id: string;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  readonly progress?: number;
  readonly imageUrl?: string;
  readonly errorMessage?: string;
  readonly createdAt: string; // ISO string for serialization
  readonly updatedAt: string; // ISO string for serialization
  readonly externalProviderId?: string;
  readonly providerName?: string;
  readonly isPollingRequired: boolean;
  readonly pollingPriority: 'high' | 'medium' | 'low' | 'none';
  readonly nextPollTime?: string; // ISO string
}

/**
 * Status Check Request DTO
 * Standardized request format for status checking operations
 */
export interface StatusCheckRequestDto {
  readonly generationIds: string[];
  readonly userId: string;
  readonly organizationId: string;
  readonly requestId: string; // For deduplication
  readonly timestamp: string; // ISO string
  readonly priority: 'high' | 'medium' | 'low';
  readonly batchSize?: number;
}

/**
 * Batch Status Response DTO
 * Efficient response format for batch operations
 */
export interface BatchStatusResponseDto {
  readonly success: boolean;
  readonly requestId: string;
  readonly timestamp: string; // ISO string
  readonly generations: GenerationStatusDto[];
  readonly errors?: Array<{
    readonly generationId: string;
    readonly error: string;
  }>;
  readonly metadata: {
    readonly totalRequested: number;
    readonly totalProcessed: number;
    readonly totalErrors: number;
    readonly processingTimeMs: number;
    readonly wasFromCache: boolean;
    readonly nextBatchTime?: string; // ISO string for next recommended poll
  };
}

/**
 * Status Check Configuration DTO
 * Configuration for polling behavior
 */
export interface StatusCheckConfigDto {
  readonly pollingInterval: number; // milliseconds
  readonly batchSize: number;
  readonly priority: 'high' | 'medium' | 'low';
  readonly enableCaching: boolean;
  readonly cacheTimeoutMs: number;
  readonly maxRetries: number;
  readonly timeoutMs: number;
}

/**
 * Polling Strategy DTO
 * Represents optimal polling strategy for a group of generations
 */
export interface PollingStrategyDto {
  readonly strategyId: string;
  readonly generationIds: string[];
  readonly priority: 'high' | 'medium' | 'low';
  readonly pollingInterval: number;
  readonly batchSize: number;
  readonly nextPollTime: string; // ISO string
  readonly estimatedCompletionTime?: string; // ISO string
  readonly canBeBatched: boolean;
}

/**
 * Status Update Event DTO
 * Event data for status change notifications
 */
export interface StatusUpdateEventDto {
  readonly eventId: string;
  readonly generationId: string;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly timestamp: string; // ISO string
  readonly userId: string;
  readonly organizationId: string;
  readonly metadata?: {
    readonly imageUrl?: string;
    readonly errorMessage?: string;
    readonly processingTime?: number;
    readonly providerResponse?: Record<string, unknown>;
  };
}

/**
 * Deduplication Key DTO
 * Key structure for request deduplication
 */
export interface DeduplicationKeyDto {
  readonly keyType: 'single' | 'batch' | 'user-all';
  readonly generationIds: string[];
  readonly userId: string;
  readonly organizationId: string;
  readonly hash: string; // Generated hash for efficient comparison
} 