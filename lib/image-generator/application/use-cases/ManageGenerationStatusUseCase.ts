import { StatusManagementService } from '../services/StatusManagementService';
import { StatusMapper } from '../mappers/StatusMapper';
import {
  StatusCheckRequestDto,
  BatchStatusResponseDto,
  PollingStrategyDto,
  GenerationStatusDto
} from '../dto/StatusDto';

/**
 * Manage Generation Status Use Case
 * Single Responsibility: Single coordination point for ALL status checking needs
 * Application Layer - Orchestrates domain objects for status management scenarios
 */
export class ManageGenerationStatusUseCase {
  
  constructor(
    private readonly statusManagementService: StatusManagementService
  ) {}

  /**
   * Check status for specific generations
   * Primary entry point for individual and batch status checks
   */
  async checkGenerationStatus(
    generationIds: string[],
    userId: string,
    organizationId: string,
    options: {
      priority?: 'high' | 'medium' | 'low';
      batchSize?: number;
      requestId?: string;
    } = {}
  ): Promise<BatchStatusResponseDto> {
    const request: StatusCheckRequestDto = {
      generationIds,
      userId,
      organizationId,
      requestId: options.requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      priority: options.priority || 'medium',
      batchSize: options.batchSize
    };

    return this.statusManagementService.checkStatusWithDeduplication(request);
  }

  /**
   * Check status for a single generation
   * Convenience method for single generation status checks
   */
  async checkSingleGenerationStatus(
    generationId: string,
    userId: string,
    organizationId: string,
    priority: 'high' | 'medium' | 'low' = 'high'
  ): Promise<GenerationStatusDto | null> {
    const response = await this.checkGenerationStatus(
      [generationId],
      userId,
      organizationId,
      { priority }
    );

    if (!response.success || response.generations.length === 0) {
      return null;
    }

    return response.generations[0];
  }

  /**
   * Get optimal polling strategies for user's active generations
   * Business logic coordination for efficient polling configuration
   */
  async getPollingStrategies(
    userId: string,
    organizationId: string
  ): Promise<PollingStrategyDto[]> {
    return this.statusManagementService.getOptimalPollingStrategy(userId, organizationId);
  }

  /**
   * Process timeout handling for stuck generations
   * Lifecycle management for generation timeout business rules
   */
  async handleTimeouts(
    userId: string,
    organizationId: string
  ): Promise<{ timeoutCount: number; errors: string[] }> {
    return this.statusManagementService.processTimeouts(userId, organizationId);
  }

  /**
   * Get all active generations requiring polling
   * Discovery method for presentations layer to understand polling needs
   */
  async getActiveGenerationsRequiringPolling(
    userId: string,
    organizationId: string
  ): Promise<GenerationStatusDto[]> {
    const strategies = await this.getPollingStrategies(userId, organizationId);
    
    // Extract all generation IDs from strategies
    const allGenerationIds = strategies.flatMap(strategy => strategy.generationIds);
    
    if (allGenerationIds.length === 0) {
      return [];
    }

    // Get current status for all active generations
    const response = await this.checkGenerationStatus(
      allGenerationIds,
      userId,
      organizationId,
      { priority: 'low' } // Low priority for discovery
    );

    return response.success ? response.generations : [];
  }

  /**
   * Unified status check for React Query integration
   * Optimized method for frontend data fetching with proper caching
   */
  async unifiedStatusCheck(
    userId: string,
    organizationId: string,
    options: {
      specificGenerationIds?: string[];
      includeAllActive?: boolean;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): Promise<{
    generations: GenerationStatusDto[];
    pollingStrategies: PollingStrategyDto[];
    metadata: {
      totalGenerations: number;
      activeCount: number;
      nextPollTime?: string;
      wasFromCache: boolean;
      processingTimeMs: number;
    };
  }> {
    const startTime = Date.now();
    const priority = options.priority || 'medium';

    // Determine which generations to check
    let generationIds: string[] = [];
    
    if (options.specificGenerationIds) {
      generationIds = options.specificGenerationIds;
    }
    
    if (options.includeAllActive) {
      const strategies = await this.getPollingStrategies(userId, organizationId);
      const activeIds = strategies.flatMap(s => s.generationIds);
      generationIds = [...new Set([...generationIds, ...activeIds])];
    }

    // Default to checking all active if no specific IDs provided
    if (generationIds.length === 0) {
      const strategies = await this.getPollingStrategies(userId, organizationId);
      generationIds = strategies.flatMap(s => s.generationIds);
    }

    // Get current status
    const statusResponse = generationIds.length > 0
      ? await this.checkGenerationStatus(generationIds, userId, organizationId, { priority })
      : { 
          success: true, 
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          generations: [], 
          metadata: { 
            wasFromCache: false, 
            processingTimeMs: 0,
            totalRequested: 0,
            totalProcessed: 0,
            totalErrors: 0
          } 
        } as BatchStatusResponseDto;

    // Get polling strategies
    const pollingStrategies = await this.getPollingStrategies(userId, organizationId);

    // Calculate next poll time from strategies
    const nextPollTimes = pollingStrategies
      .map(s => new Date(s.nextPollTime).getTime())
      .filter(time => !isNaN(time));
    
    const nextPollTime = nextPollTimes.length > 0 
      ? new Date(Math.min(...nextPollTimes)).toISOString()
      : undefined;

    // Count active generations
    const activeCount = statusResponse.generations.filter(g => 
      g.isPollingRequired
    ).length;

    return {
      generations: statusResponse.generations,
      pollingStrategies,
      metadata: {
        totalGenerations: statusResponse.generations.length,
        activeCount,
        nextPollTime,
        wasFromCache: statusResponse.metadata?.wasFromCache || false,
        processingTimeMs: Date.now() - startTime
      }
    };
  }

  /**
   * Emergency cleanup for stuck or orphaned generations
   * Administrative function for system health maintenance
   */
  async emergencyCleanup(
    userId: string,
    organizationId: string,
    options: {
      forceTimeoutAfterMs?: number;
      maxGenerationsToProcess?: number;
    } = {}
  ): Promise<{
    timeoutCount: number;
    cleanupCount: number;
    errors: string[];
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Process normal timeouts first
      const timeoutResult = await this.handleTimeouts(userId, organizationId);
      errors.push(...timeoutResult.errors);

      // TODO: Add additional cleanup logic for orphaned generations
      // This could include checking for generations that have been stuck
      // for unusually long periods or have inconsistent state

      return {
        timeoutCount: timeoutResult.timeoutCount,
        cleanupCount: 0, // Placeholder for additional cleanup
        errors,
        processingTimeMs: Date.now() - startTime
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Emergency cleanup failed');
      
      return {
        timeoutCount: 0,
        cleanupCount: 0,
        errors,
        processingTimeMs: Date.now() - startTime
      };
    }
  }
} 