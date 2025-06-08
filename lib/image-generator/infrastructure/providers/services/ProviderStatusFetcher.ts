import { ProviderConfig } from './ProviderConfigManager';
import { ProviderStatusResponse } from './ProviderStatusCache';
import { ReplicateProviderClient } from './ReplicateProviderClient';
import { success, error, Result } from '../../common/Result';

/**
 * Infrastructure Layer - ProviderStatusFetcher encapsulates retry and API call logic
 * Single Responsibility: Perform resilient provider status fetches with retry/backoff
 * Golden Rule DDD: Separate retry and API delegation from orchestrator
 */
export class ProviderStatusFetcher {
  private readonly replicateClient = new ReplicateProviderClient();

  async fetchWithRetry(
    config: ProviderConfig,
    externalId: string
  ): Promise<Result<ProviderStatusResponse, string>> {
    let lastError = '';

    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        const result = await this.fetchStatus(config, externalId);
        if (result.isSuccess()) {
          return result;
        }
        lastError = result.getError();
        // Stop retry on client errors
        if (lastError.includes('404') || lastError.includes('400')) {
          break;
        }
        if (attempt < config.retryAttempts) {
          await this.delay(config.retryDelay * attempt);
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    return error(`Provider check failed after ${config.retryAttempts} attempts: ${lastError}`);
  }

  private async fetchStatus(
    config: ProviderConfig,
    externalId: string
  ): Promise<Result<ProviderStatusResponse, string>> {
    try {
      switch (config.name) {
        case 'replicate':
          return this.replicateClient.fetchStatus(config, externalId);
        default:
          return error(`Provider ${config.name} not implemented`);
      }
    } catch (err) {
      return error(`Provider API error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 