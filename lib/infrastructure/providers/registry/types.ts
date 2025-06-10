// Base provider configuration interface
export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Provider types enum
export enum ProviderType {
  REPLICATE = 'replicate',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  ELEVENLABS = 'elevenlabs',
  AWS = 'aws',
  AZURE = 'azure',
  GOOGLE = 'google',
  HUGGINGFACE = 'huggingface',
  STABILITY = 'stability',
  RUNPOD = 'runpod',
  TOGETHER = 'together',
  PERPLEXITY = 'perplexity'
}

// Base provider interface that all providers must implement
export interface BaseProvider {
  readonly type: ProviderType;
  readonly isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

// Provider capabilities
export interface ProviderCapabilities {
  textGeneration?: boolean;
  imageGeneration?: boolean;
  audioGeneration?: boolean;
  videoGeneration?: boolean;
  embedding?: boolean;
  transcription?: boolean;
  translation?: boolean;
}

// Provider metadata
export interface ProviderMetadata {
  name: string;
  version: string;
  capabilities: ProviderCapabilities;
  supportedModels?: string[];
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    tokensPerMinute?: number;
  };
}

// Provider registry entry
export interface ProviderRegistryEntry {
  type: ProviderType;
  config: ProviderConfig;
  metadata: ProviderMetadata;
  provider: BaseProvider;
  isEnabled: boolean;
  priority: number; // For provider selection algorithms
}

// Provider selection criteria
export interface ProviderSelectionCriteria {
  capability: keyof ProviderCapabilities;
  model?: string;
  priority?: 'cost' | 'speed' | 'quality' | 'reliability';
  fallbackEnabled?: boolean;
} 