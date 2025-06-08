import { StatusCheckingRepository } from '../../domain/repositories/StatusCheckingRepository';
import { GenerationStatusDomainService } from '../../domain/services/GenerationStatusDomainService';

/**
 * Use Case: Process Generation Timeouts
 * Application Layer - Single Responsibility for timing out stuck generations
 */
export class ProcessTimeoutsUseCase {
  constructor(private readonly statusRepository: StatusCheckingRepository) {}

  async execute(
    userId: string,
    organizationId: string
  ): Promise<{ timeoutCount: number; errors: string[] }> {
    // Find generations that should be timed out
    const timeoutResult = await this.statusRepository.findGenerationsForTimeout(
      userId,
      organizationId
    );

    if (!timeoutResult.isSuccess()) {
      return { timeoutCount: 0, errors: [timeoutResult.getError()] };
    }

    const candidates = timeoutResult.getValue();
    // Select stuck generations
    const generationsToTimeout = candidates.filter(gen =>
      GenerationStatusDomainService.shouldTimeout(gen)
    );

    if (generationsToTimeout.length === 0) {
      return { timeoutCount: 0, errors: [] };
    }

    // Apply timeout business logic
    generationsToTimeout.forEach(gen => gen.markAsFailed('Generation timed out'));

    // Persist changes
    const updateResult = await this.statusRepository.markGenerationsAsTimedOut(
      generationsToTimeout
    );

    const errors: string[] = [];
    if (!updateResult.isSuccess()) {
      errors.push(updateResult.getError());
    }

    return { timeoutCount: generationsToTimeout.length, errors };
  }
} 