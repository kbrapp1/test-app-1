import { checkTtsFeatureFlag } from '@/lib/actions/services/TtsFeatureFlagService';
import { ITtsFeatureFlagService } from '../../domain/services/ITtsFeatureFlagService';

/**
 * TTS Feature Flag Adapter
 * 
 * Adapts the global feature flag service to the TTS domain interface
 * This maintains bounded context isolation while reusing existing functionality
 */
export class TtsFeatureFlagAdapter implements ITtsFeatureFlagService {
  async checkTtsFeatureFlag(): Promise<void> {
    return checkTtsFeatureFlag();
  }
} 