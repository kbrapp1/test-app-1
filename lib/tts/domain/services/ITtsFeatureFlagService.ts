/**
 * TTS Feature Flag Service Interface
 * 
 * Defines the contract for checking TTS feature availability
 * within the TTS bounded context
 */
export interface ITtsFeatureFlagService {
  /**
   * Check if TTS features are enabled for the current user/organization
   * @throws Error if feature is disabled or user lacks access
   */
  checkTtsFeatureFlag(): Promise<void>;
} 