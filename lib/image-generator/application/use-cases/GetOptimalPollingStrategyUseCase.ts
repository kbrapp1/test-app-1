import { StatusCheckingRepository } from '../../domain/repositories/StatusCheckingRepository';
import { GenerationPollingSpecification } from '../../domain/specifications/GenerationPollingSpecification';
import { StatusMapper } from '../mappers/StatusMapper';
import { PollingStrategyDto } from '../dto/StatusDto';

/**
 * Use Case: Get Optimal Polling Strategy
 * Application Layer - Single Responsibility for polling strategy derivation
 */
export class GetOptimalPollingStrategyUseCase {
  constructor(private readonly statusRepository: StatusCheckingRepository) {}

  async execute(userId: string, organizationId: string): Promise<PollingStrategyDto[]> {
    // Retrieve active generations for polling
    const generationsResult = await this.statusRepository.findActiveGenerationsForPolling(
      userId,
      organizationId
    );

    if (!generationsResult.isSuccess()) {
      return [];
    }

    const generations = generationsResult.getValue();
    // Group by polling strategy
    const grouped = GenerationPollingSpecification.groupByPollingStrategy(generations);
    const strategies: PollingStrategyDto[] = [];

    if (grouped.highPriority.length > 0) {
      const strategy = StatusMapper.toPollingStrategyDto(grouped.highPriority);
      if (strategy) strategies.push(strategy);
    }
    if (grouped.mediumPriority.length > 0) {
      const strategy = StatusMapper.toPollingStrategyDto(grouped.mediumPriority);
      if (strategy) strategies.push(strategy);
    }
    if (grouped.lowPriority.length > 0) {
      const strategy = StatusMapper.toPollingStrategyDto(grouped.lowPriority);
      if (strategy) strategies.push(strategy);
    }

    return strategies;
  }
} 