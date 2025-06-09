/**
 * DAM Feature Flag Service
 * 
 * Feature-specific service for checking DAM feature flag.
 * Maintains DDD bounded context separation while using shared core logic.
 */

import { checkFeatureFlag, isFeatureEnabled } from '@/lib/organization/application/services/FeatureFlagService';

/**
 * Checks if DAM feature is enabled for the current organization
 * @throws {Error} If DAM feature is not enabled
 */
export async function checkDamFeatureFlag(): Promise<void> {
  await checkFeatureFlag('dam', 'DAM');
}

/**
 * Checks if DAM feature is enabled for the current organization (non-throwing version)
 * @returns {Promise<boolean>} True if DAM is enabled, false otherwise
 */
export async function isDamFeatureEnabled(): Promise<boolean> {
  return await isFeatureEnabled('dam');
} 