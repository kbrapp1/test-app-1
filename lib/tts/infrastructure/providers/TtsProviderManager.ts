import { ReplicateProvider, ReplicateConfig } from '@/lib/infrastructure/providers/replicate/ReplicateProvider';
import { ElevenLabsProvider, ElevenLabsConfig } from '@/lib/infrastructure/providers/elevenlabs/ElevenLabsProvider';
import { TtsReplicateAdapter } from './replicate/TtsReplicateAdapter';
import { TtsElevenLabsAdapter } from './elevenlabs/TtsElevenLabsAdapter';

/**
 * TTS domain-specific provider manager
 * Handles lazy initialization and lifecycle of TTS providers
 * Follows DDD bounded context principles
 */
export class TtsProviderManager {
  private static replicateProvider: ReplicateProvider | null = null;
  private static replicateAdapter: TtsReplicateAdapter | null = null;
  private static elevenLabsProvider: ElevenLabsProvider | null = null;
  private static elevenLabsAdapter: TtsElevenLabsAdapter | null = null;

  /**
   * Get or initialize the Replicate provider for TTS domain
   */
  static async getReplicateProvider(): Promise<ReplicateProvider> {
    if (!this.replicateProvider) {
      const config: ReplicateConfig = {
        apiKey: process.env.REPLICATE_API_TOKEN || '',
        retryAttempts: 3,
        retryDelay: 1000,
      };

      if (!config.apiKey) {
        throw new Error('REPLICATE_API_TOKEN environment variable is required for TTS');
      }

      this.replicateProvider = new ReplicateProvider(config);
      await this.replicateProvider.connect();
      
      // Verify connection
      const isHealthy = await this.replicateProvider.healthCheck();
      if (!isHealthy) {
        console.warn('TTS: Replicate provider health check failed, but continuing...');
      }
    }

    return this.replicateProvider;
  }

  /**
   * Get or initialize the ElevenLabs provider for TTS domain
   */
  static async getElevenLabsProvider(): Promise<ElevenLabsProvider> {
    if (!this.elevenLabsProvider) {
      const config: ElevenLabsConfig = {
        apiKey: process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
        apiUrl: process.env.ELEVENLABS_API_URL || process.env.NEXT_PUBLIC_ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1',
        retryAttempts: 3,
        retryDelay: 1000,
      };

      if (!config.apiKey) {
        throw new Error('ELEVENLABS_API_KEY environment variable is required for TTS');
      }
      if (!config.apiUrl) {
        throw new Error('ELEVENLABS_API_URL environment variable is required for TTS');
      }

      this.elevenLabsProvider = new ElevenLabsProvider(config);
      await this.elevenLabsProvider.connect();
      
      // Verify connection
      const isHealthy = await this.elevenLabsProvider.healthCheck();
      if (!isHealthy) {
        console.warn('TTS: ElevenLabs provider health check failed, but continuing...');
      }
    }

    return this.elevenLabsProvider;
  }

  /**
   * Get or initialize the TTS-specific Replicate adapter
   */
  static async getReplicateAdapter(): Promise<TtsReplicateAdapter> {
    if (!this.replicateAdapter) {
      // Ensure provider is initialized first
      await this.getReplicateProvider();
      this.replicateAdapter = new TtsReplicateAdapter(this.replicateProvider!);
    }

    return this.replicateAdapter;
  }

  /**
   * Get or initialize the TTS-specific ElevenLabs adapter
   */
  static async getElevenLabsAdapter(): Promise<TtsElevenLabsAdapter> {
    if (!this.elevenLabsAdapter) {
      // Ensure provider is initialized first
      await this.getElevenLabsProvider();
      this.elevenLabsAdapter = new TtsElevenLabsAdapter(this.elevenLabsProvider!);
    }

    return this.elevenLabsAdapter;
  }

  /**
   * Health check for TTS providers
   */
  static async healthCheck(): Promise<{ replicate: boolean; elevenlabs: boolean }> {
    const results = { replicate: false, elevenlabs: false };

    try {
      if (this.replicateProvider) {
        results.replicate = await this.replicateProvider.healthCheck();
      } else {
        // Try to initialize and check
        const provider = await this.getReplicateProvider();
        results.replicate = await provider.healthCheck();
      }
    } catch (error) {
      console.error('TTS Replicate provider health check failed:', error);
    }

    try {
      if (this.elevenLabsProvider) {
        results.elevenlabs = await this.elevenLabsProvider.healthCheck();
      } else {
        // Try to initialize and check
        const provider = await this.getElevenLabsProvider();
        results.elevenlabs = await provider.healthCheck();
      }
    } catch (error) {
      console.error('TTS ElevenLabs provider health check failed:', error);
    }

    return results;
  }

  /**
   * Cleanup resources (useful for testing or shutdown)
   */
  static async cleanup(): Promise<void> {
    if (this.replicateProvider) {
      await this.replicateProvider.disconnect();
      this.replicateProvider = null;
    }
    if (this.elevenLabsProvider) {
      await this.elevenLabsProvider.disconnect();
      this.elevenLabsProvider = null;
    }
    this.replicateAdapter = null;
    this.elevenLabsAdapter = null;
  }

  /**
   * Reset providers (useful for testing with different configs)
   */
  static reset(): void {
    this.replicateProvider = null;
    this.replicateAdapter = null;
    this.elevenLabsProvider = null;
    this.elevenLabsAdapter = null;
  }
} 