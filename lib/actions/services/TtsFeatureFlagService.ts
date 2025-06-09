/**
 * TTS Feature Flag Service
 * 
 * Feature-specific service for checking TTS feature flag.
 * Maintains DDD bounded context separation while using shared core logic.
 */

import { checkFeatureFlag, isFeatureEnabled } from '@/lib/organization/application/services/FeatureFlagService';

/**
 * Checks if TTS feature is enabled for the current organization
 * @throws {Error} If TTS feature is not enabled
 */
export async function checkTtsFeatureFlag(): Promise<void> {
  await checkFeatureFlag('tts', 'Text-to-Speech');
}

/**
 * Checks if TTS feature is enabled for the current organization (non-throwing version)
 * @returns {Promise<boolean>} True if TTS is enabled, false otherwise
 */
export async function isTtsFeatureEnabled(): Promise<boolean> {
  return await isFeatureEnabled('tts');
} 