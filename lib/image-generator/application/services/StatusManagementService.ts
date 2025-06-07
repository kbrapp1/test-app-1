import { Generation } from '../../domain/entities/Generation';
import { GenerationStatusDomainService } from '../../domain/services/GenerationStatusDomainService';
import { GenerationPollingSpecification } from '../../domain/specifications/GenerationPollingSpecification';
import { StatusCheckingRepository } from '../../domain/repositories/StatusCheckingRepository';
import { ExternalProviderStatusService } from '../../infrastructure/providers/ExternalProviderStatusService';
import { StatusMapper } from '../mappers/StatusMapper';
import {
  StatusCheckRequestDto,
  BatchStatusResponseDto,
  DeduplicationKeyDto,
  PollingStrategyDto
} from '../dto/StatusDto';
import { Result } from '../../infrastructure/common/Result';

/**
 * Status Management Service
 * Single Responsibility: Coordinate status checking with request deduplication and caching
 * Application Layer - Orchestrates domain objects for status management use cases
 */
export class StatusManagementService {
  private readonly requestCache = new Map<string, {
    response: BatchStatusResponseDto;
    timestamp: number;
    ttl: number;
  }>();

  private readonly pendingRequests = new Map<string, Promise<BatchStatusResponseDto>>();
  
  private readonly CACHE_TTL_MS = 2000; // 2 seconds cache for rapid requests
  private readonly DEDUPLICATION_WINDOW_MS = 500; // 500ms deduplication window

  constructor(
    private readonly statusRepository: StatusCheckingRepository,
    private readonly providerStatusService: ExternalProviderStatusService
  ) {}

  /**
   * Check status with intelligent deduplication and caching
   * Main entry point for all status checking operations
   */
  async checkStatusWithDeduplication(
    request: StatusCheckRequestDto
  ): Promise<BatchStatusResponseDto> {
    const processingStartTime = Date.now();

    // Create deduplication key for this request
    const dedupKey = StatusMapper.toDeduplicationKeyDto(
      request.generationIds,
      request.userId,
      request.organizationId
    );

    // Check if we have a cached response
    const cachedResponse = this.getCachedResponse(dedupKey.hash);
    if (cachedResponse) {
      return this.updateCacheMetadata(cachedResponse, request.requestId, processingStartTime, true);
    }

    // Check if there's already a pending request for the same data
    const pendingRequest = this.pendingRequests.get(dedupKey.hash);
    if (pendingRequest) {
      const response = await pendingRequest;
      return this.updateCacheMetadata(response, request.requestId, processingStartTime, true);
    }

    // Create new request and add to pending
    const requestPromise = this.executeStatusCheck(request, processingStartTime);
    this.pendingRequests.set(dedupKey.hash, requestPromise);

    try {
      const response = await requestPromise;
      
      // Cache the response if successful
      if (response.success) {
        this.cacheResponse(dedupKey.hash, response);
      }
      
      return response;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(dedupKey.hash);
    }
  }

  /**
   * Get optimal polling strategy for a group of generations
   * Business rule coordination for efficient polling
   */
  async getOptimalPollingStrategy(
    userId: string,
    organizationId: string
  ): Promise<PollingStrategyDto[]> {
    // Find active generations that need polling
    const generationsResult = await this.statusRepository.findActiveGenerationsForPolling(
      userId,
      organizationId
    );

    if (!generationsResult.isSuccess()) {
      return [];
    }

    const generations = generationsResult.getValue();
    
    // Group generations by polling strategy using domain specification
    const groupedGenerations = GenerationPollingSpecification.groupByPollingStrategy(generations);
    
    const strategies: PollingStrategyDto[] = [];

    // Create strategies for each priority group
    if (groupedGenerations.highPriority.length > 0) {
      const strategy = StatusMapper.toPollingStrategyDto(groupedGenerations.highPriority);
      if (strategy) strategies.push(strategy);
    }

    if (groupedGenerations.mediumPriority.length > 0) {
      const strategy = StatusMapper.toPollingStrategyDto(groupedGenerations.mediumPriority);
      if (strategy) strategies.push(strategy);
    }

    if (groupedGenerations.lowPriority.length > 0) {
      const strategy = StatusMapper.toPollingStrategyDto(groupedGenerations.lowPriority);
      if (strategy) strategies.push(strategy);
    }

    return strategies;
  }

  /**
   * Handle timeout processing for stuck generations
   * Business rule application for generation lifecycle management
   */
  async processTimeouts(
    userId: string,
    organizationId: string
  ): Promise<{ timeoutCount: number; errors: string[] }> {
    // Find generations that should be timed out
    const timeoutCandidatesResult = await this.statusRepository.findGenerationsForTimeout(
      userId,
      organizationId
    );

    if (!timeoutCandidatesResult.isSuccess()) {
      return {
        timeoutCount: 0,
        errors: [timeoutCandidatesResult.getError()]
      };
    }

    const candidates = timeoutCandidatesResult.getValue();
    const errors: string[] = [];
    
    // Filter candidates using domain business rules
    const generationsToTimeout = candidates.filter(generation => 
      GenerationStatusDomainService.shouldTimeout(generation)
    );

    if (generationsToTimeout.length === 0) {
      return { timeoutCount: 0, errors: [] };
    }

    // Apply timeout business logic through domain entities
    generationsToTimeout.forEach(generation => {
      generation.markAsFailed('Generation timed out');
    });

    // Persist timeout changes
    const updateResult = await this.statusRepository.markGenerationsAsTimedOut(generationsToTimeout);
    
    if (!updateResult.isSuccess()) {
      errors.push(updateResult.getError());
    }

    // Invalidate cache for timed-out generations
    this.invalidateCacheForGenerations(generationsToTimeout);

    return {
      timeoutCount: generationsToTimeout.length,
      errors
    };
  }

  /**
   * Execute the actual status checking logic
   * Private method that handles the core status checking workflow
   */
  private async executeStatusCheck(
    request: StatusCheckRequestDto,
    processingStartTime: number
  ): Promise<BatchStatusResponseDto> {
    const { generationIds, userId, organizationId } = StatusMapper.fromStatusCheckRequestDto(request);
    const errors: Array<{ generationId: string; error: string }> = [];

    try {
      // Fetch generations from repository
      const generationsResult = await this.statusRepository.findGenerationsForBatchStatusCheck(
        generationIds,
        userId,
        organizationId
      );

      if (!generationsResult.isSuccess()) {
        // All generations failed
        generationIds.forEach(id => {
          errors.push({ generationId: id, error: generationsResult.getError() });
        });
        
        return StatusMapper.toBatchResponseDto([], request.requestId, processingStartTime, errors);
      }

      const generations = generationsResult.getValue();
      
      // Group generations by whether they need external provider checks
      const { needsProviderCheck, fromDatabase } = this.groupGenerationsByCheckType(generations);
      
      // Check with external providers if needed
      if (needsProviderCheck.length > 0) {
        await this.checkWithExternalProviders(needsProviderCheck, userId, organizationId, errors);
      }

      // Combine all successfully processed generations
      const allGenerations = [...fromDatabase, ...needsProviderCheck];

      return StatusMapper.toBatchResponseDto(
        allGenerations,
        request.requestId,
        processingStartTime,
        errors
      );

    } catch (error) {
      // Catastrophic failure - mark all as errored
      generationIds.forEach(id => {
        errors.push({ 
          generationId: id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      });

      return StatusMapper.toBatchResponseDto([], request.requestId, processingStartTime, errors);
    }
  }

  /**
   * Group generations by whether they need external provider checks
   * Business rule application for efficient resource usage
   */
  private groupGenerationsByCheckType(generations: Generation[]): {
    needsProviderCheck: Generation[];
    fromDatabase: Generation[];
  } {
    const needsProviderCheck: Generation[] = [];
    const fromDatabase: Generation[] = [];

    for (const generation of generations) {
      if (GenerationStatusDomainService.requiresPolling(generation)) {
        needsProviderCheck.push(generation);
      } else {
        fromDatabase.push(generation);
      }
    }

    return { needsProviderCheck, fromDatabase };
  }

  /**
   * Check status with external providers for active generations
   * Infrastructure coordination for external API calls
   */
  private async checkWithExternalProviders(
    generations: Generation[],
    userId: string,
    organizationId: string,
    errors: Array<{ generationId: string; error: string }>
  ): Promise<void> {
    try {
      // Use the external provider service for actual status checking
      const providerResult = await this.providerStatusService.checkMultipleGenerationStatus(generations);
      
      if (providerResult.isSuccess()) {
        const updatedGenerations = providerResult.getValue();
        
        // Persist updates to database
        if (updatedGenerations.length > 0) {
          const updateResult = await this.statusRepository.updateGenerationStatusBatch(updatedGenerations);
          
          if (!updateResult.isSuccess()) {
            // If database update fails, add errors but don't fail the whole operation
            errors.push({
              generationId: 'batch',
              error: `Database update failed: ${updateResult.getError()}`
            });
          }
        }
      } else {
        // Provider service failed, but don't fail the whole operation
        errors.push({
          generationId: 'provider-batch',
          error: `Provider check failed: ${providerResult.getError()}`
        });
      }
      
    } catch (error) {
      // Unexpected error, add to errors
      errors.push({
        generationId: 'unexpected',
        error: error instanceof Error ? error.message : 'Unexpected provider error'
      });
    }
  }

  /**
   * Get cached response if available and not expired
   */
  private getCachedResponse(cacheKey: string): BatchStatusResponseDto | null {
    const cached = this.requestCache.get(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.requestCache.delete(cacheKey);
      return null;
    }

    return cached.response;
  }

  /**
   * Cache response for future deduplication
   */
  private cacheResponse(cacheKey: string, response: BatchStatusResponseDto): void {
    this.requestCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL_MS
    });

    // Clean up old cache entries periodically
    if (this.requestCache.size > 100) {
      this.cleanupExpiredCache();
    }
  }

  /**
   * Update response metadata for cache hits
   */
  private updateCacheMetadata(
    response: BatchStatusResponseDto,
    newRequestId: string,
    processingStartTime: number,
    wasFromCache: boolean
  ): BatchStatusResponseDto {
    return {
      ...response,
      requestId: newRequestId,
      timestamp: new Date().toISOString(),
      metadata: {
        ...response.metadata,
        processingTimeMs: Date.now() - processingStartTime,
        wasFromCache
      }
    };
  }

  /**
   * Invalidate cache entries for specific generations
   */
  private invalidateCacheForGenerations(generations: Generation[]): void {
    const generationIds = generations.map(g => g.getId());
    
    // Remove cache entries that include any of these generation IDs
    for (const [key, cached] of this.requestCache.entries()) {
      const hasOverlap = cached.response.generations.some(g => 
        generationIds.includes(g.id)
      );
      
      if (hasOverlap) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.requestCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.requestCache.delete(key);
      }
    }
  }
} 