// import { Generation } from '../../domain/entities/Generation';
// import { GenerationStatusDomainService } from '../../domain/services/GenerationStatusDomainService';
// import { GenerationPollingSpecification } from '../../domain/specifications/GenerationPollingSpecification';
import { StatusCheckingRepository } from '../../domain/repositories/StatusCheckingRepository';
import { ExternalProviderStatusService } from '../../infrastructure/providers/ExternalProviderStatusService';
// import { StatusMapper } from '../mappers/StatusMapper';
import {
  StatusCheckRequestDto,
  BatchStatusResponseDto,
  // DeduplicationKeyDto,
  PollingStrategyDto
} from '../dto/StatusDto';
// import { Result } from '../../domain/value-objects';
import { CheckStatusWithDeduplicationUseCase } from '../use-cases/CheckStatusWithDeduplicationUseCase';
import { GetOptimalPollingStrategyUseCase } from '../use-cases/GetOptimalPollingStrategyUseCase';
import { ProcessTimeoutsUseCase } from '../use-cases/ProcessTimeoutsUseCase';

/**
 * Application Layer - Use Case Orchestrator following Golden Rule DDD Guidelines
 * Core Principles: Single Responsibility, clear separation of status checking, polling strategy, and timeout processing
 */
export class StatusManagementService {
  private readonly checkStatusUseCase: CheckStatusWithDeduplicationUseCase;
  private readonly pollingStrategyUseCase: GetOptimalPollingStrategyUseCase;
  private readonly timeoutsUseCase: ProcessTimeoutsUseCase;

  constructor(
    statusRepository: StatusCheckingRepository,
    providerStatusService: ExternalProviderStatusService
  ) {
    this.checkStatusUseCase = new CheckStatusWithDeduplicationUseCase(statusRepository, providerStatusService);
    this.pollingStrategyUseCase = new GetOptimalPollingStrategyUseCase(statusRepository);
    this.timeoutsUseCase = new ProcessTimeoutsUseCase(statusRepository);
  }

  /**
   * Use Case: Check Status with Deduplication and Caching
   * Responsibility: Coordinate domain services, apply caching and deduplication rules
   */
  async checkStatusWithDeduplication(request: StatusCheckRequestDto): Promise<BatchStatusResponseDto> {
    return this.checkStatusUseCase.execute(request);
  }

  /**
   * Use Case: Get Optimal Polling Strategy
   * Responsibility: Evaluate active generations against domain specifications to derive polling priorities
   */
  async getOptimalPollingStrategy(userId: string, organizationId: string): Promise<PollingStrategyDto[]> {
    return this.pollingStrategyUseCase.execute(userId, organizationId);
  }

  /**
   * Use Case: Process Generation Timeouts
   * Responsibility: Apply domain timeout rules and persist status updates
   */
  async processTimeouts(userId: string, organizationId: string): Promise<{ timeoutCount: number; errors: string[] }> {
    return this.timeoutsUseCase.execute(userId, organizationId);
  }
} 