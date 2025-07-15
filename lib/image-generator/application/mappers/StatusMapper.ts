import { Generation } from '../../domain/entities/Generation';
import { GenerationStatusDomainService } from '../../domain/services/GenerationStatusDomainService';
import { GenerationPollingSpecification } from '../../domain/specifications/GenerationPollingSpecification';
import {
  GenerationStatusDto,
  StatusCheckRequestDto,
  BatchStatusResponseDto,
  PollingStrategyDto,
  StatusUpdateEventDto,
  DeduplicationKeyDto
} from '../dto/StatusDto';

/**
 * Status Mapper
 * Single Responsibility: Transform between DTOs and domain entities
 * Application Layer - Handle data transformation between layers
 */
export class StatusMapper {

  /**
   * Transform domain Generation entity to presentation-friendly DTO
   * Includes computed fields for polling behavior
   */
  static toStatusDto(generation: Generation): GenerationStatusDto {
    const isPollingRequired = GenerationPollingSpecification.isSatisfiedBy(generation);
    const pollingPriority = GenerationStatusDomainService.getPollingPriority(generation);
    const pollingInterval = GenerationStatusDomainService.calculatePollingInterval(generation);
    
    // Calculate next poll time if polling is required
    const nextPollTime = isPollingRequired && pollingInterval > 0 
      ? new Date(Date.now() + pollingInterval).toISOString()
      : undefined;

         return {
       id: generation.getId(),
       status: generation.getStatus().value,
       progress: undefined, // Progress not tracked in current entity
       imageUrl: generation.resultImageUrl || undefined,
       errorMessage: generation.errorMessage || undefined,
       createdAt: generation.createdAt.toISOString(),
       updatedAt: generation.updatedAt.toISOString(),
       externalProviderId: generation.externalProviderId || undefined,
       providerName: generation.providerName || undefined,
       isPollingRequired,
       pollingPriority,
       nextPollTime
     };
  }

  /**
   * Transform multiple domain entities to DTOs efficiently
   */
  static toStatusDtoList(generations: Generation[]): GenerationStatusDto[] {
    return generations.map(generation => this.toStatusDto(generation));
  }

  /**
   * Create batch response DTO with metadata for performance tracking
   */
  static toBatchResponseDto(
    generations: Generation[],
    requestId: string,
    processingStartTime: number,
    errors: Array<{ generationId: string; error: string }> = [],
    wasFromCache: boolean = false
  ): BatchStatusResponseDto {
    const processingTimeMs = Date.now() - processingStartTime;
    const statusDtos = this.toStatusDtoList(generations);
    
    // Calculate next batch time based on the shortest polling interval needed
    const nextBatchTime = this.calculateNextBatchTime(generations);

    return {
      success: errors.length === 0,
      requestId,
      timestamp: new Date().toISOString(),
      generations: statusDtos,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        totalRequested: generations.length + errors.length,
        totalProcessed: generations.length,
        totalErrors: errors.length,
        processingTimeMs,
        wasFromCache,
        nextBatchTime
      }
    };
  }

  /**
   * Create polling strategy DTO from generation group
   */
  static toPollingStrategyDto(
    generations: Generation[],
    strategyId: string = crypto.randomUUID()
  ): PollingStrategyDto | null {
    if (generations.length === 0) {
      return null;
    }

    // Use specification to determine if this group can be batched
    const canBeBatched = GenerationPollingSpecification.canBeBatched(generations);
    const pollingInterval = GenerationPollingSpecification.calculateGroupPollingInterval(generations);
    
    if (pollingInterval === 0) {
      return null; // No polling needed
    }

    // Determine priority based on the highest priority generation in the group
    const priorities = generations.map(g => GenerationStatusDomainService.getPollingPriority(g));
    const highestPriority = this.getHighestPriority(priorities);
    
    if (highestPriority === 'none') {
      return null;
    }

    const batchSize = GenerationStatusDomainService.getOptimalBatchSize(generations.length);
    const nextPollTime = new Date(Date.now() + pollingInterval).toISOString();

    return {
      strategyId,
      generationIds: generations.map(g => g.getId()),
      priority: highestPriority,
      pollingInterval,
      batchSize,
      nextPollTime,
      canBeBatched
    };
  }

  /**
   * Create status update event DTO from generation state change
   */
  static toStatusUpdateEventDto(
    generation: Generation,
    previousStatus: string,
    userId: string,
    organizationId: string,
    eventId: string = crypto.randomUUID()
  ): StatusUpdateEventDto {
    const currentStatus = generation.getStatus().value;
    
    return {
      eventId,
      generationId: generation.getId(),
      previousStatus,
      newStatus: currentStatus,
      timestamp: new Date().toISOString(),
      userId,
      organizationId,
             metadata: {
         imageUrl: generation.resultImageUrl || undefined,
         errorMessage: generation.errorMessage || undefined,
         processingTime: generation.updatedAt 
           ? generation.updatedAt.getTime() - generation.createdAt.getTime()
           : undefined
       }
    };
  }

  /**
   * Create deduplication key for request caching
   */
  static toDeduplicationKeyDto(
    generationIds: string[],
    userId: string,
    organizationId: string
  ): DeduplicationKeyDto {
    // Sort IDs for consistent hashing
    const sortedIds = [...generationIds].sort();
    
    // Determine key type based on request pattern
    const keyType = generationIds.length === 1 
      ? 'single' 
      : generationIds.length > 10 
        ? 'user-all' 
        : 'batch';

    // Create hash for efficient comparison
    const hashInput = `${keyType}:${userId}:${organizationId}:${sortedIds.join(',')}`;
    const hash = this.simpleHash(hashInput);

    return {
      keyType,
      generationIds: sortedIds,
      userId,
      organizationId,
      hash
    };
  }

  /**
   * Extract request information for status checking
   */
  static fromStatusCheckRequestDto(
    request: StatusCheckRequestDto
  ): {
    generationIds: string[];
    userId: string;
    organizationId: string;
    priority: 'high' | 'medium' | 'low';
    batchSize: number;
  } {
    return {
      generationIds: request.generationIds,
      userId: request.userId,
      organizationId: request.organizationId,
      priority: request.priority,
      batchSize: request.batchSize || GenerationStatusDomainService.getOptimalBatchSize(request.generationIds.length)
    };
  }

  /**
   * Private helper: Calculate optimal next batch time
   */
  private static calculateNextBatchTime(generations: Generation[]): string | undefined {
    const pollingInterval = GenerationPollingSpecification.calculateGroupPollingInterval(generations);
    
    if (pollingInterval === 0) {
      return undefined;
    }

    return new Date(Date.now() + pollingInterval).toISOString();
  }

  /**
   * Private helper: Determine highest priority from a list
   */
  private static getHighestPriority(
    priorities: Array<'high' | 'medium' | 'low' | 'none'>
  ): 'high' | 'medium' | 'low' | 'none' {
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    if (priorities.includes('low')) return 'low';
    return 'none';
  }

  /**
   * Private helper: Simple hash function for deduplication keys
   */
  private static simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
} 