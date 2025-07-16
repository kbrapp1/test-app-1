/**
 * Core Feature Flag Service
 * 
 * Shared utility for checking organization feature flags.
 * Used by feature-specific services to maintain DDD boundaries while avoiding duplication.
 */

import { createClient as createSupabaseServerClient } from '../../../supabase/server';
import { getActiveOrganizationWithFlags } from './getActiveOrganizationWithFlags';

/**
 * Core feature flag checking logic
 * @param flagName - Name of the feature flag to check
 * @param featureName - Human-readable feature name for error messages
 * @throws {Error} If feature flag is not enabled
 */
export async function checkFeatureFlag(flagName: string, featureName: string): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    const organization = await getActiveOrganizationWithFlags(supabase);
    const flags = organization?.featureFlags as Record<string, boolean> | undefined;

    // Default to true if flag is missing, but respect explicit false values
    const isEnabled = flags ? (flags.hasOwnProperty(flagName) ? flags[flagName] : true) : true;

    if (!isEnabled) {
      throw new Error(`${featureName} feature is not enabled for this organization.`);
    }
  } catch (error) {
    // If we can't check the flag (e.g., cookies not available), default to enabled
    // This ensures features work by default when flag checking fails
    if (error instanceof Error && error.message.includes('not enabled')) {
      throw error; // Re-throw feature disabled errors
    }
    console.warn(`Cannot check feature flag '${flagName}' (likely cookies not available), defaulting to enabled:`, error);
    // Don't throw - allow access when flag checking fails
  }
}

/**
 * Core feature flag checking logic (non-throwing version)
 * @param flagName - Name of the feature flag to check
 * @returns {Promise<boolean>} True if feature is enabled, false otherwise
 */
export async function isFeatureEnabled(flagName: string): Promise<boolean> {
  try {
    const supabase = createSupabaseServerClient();
    const organization = await getActiveOrganizationWithFlags(supabase);
    const flags = organization?.featureFlags as Record<string, boolean> | undefined;
    
    // Default to true if flag is missing, but respect explicit false values
    return flags ? (flags.hasOwnProperty(flagName) ? flags[flagName] : true) : true;
  } catch (error) {
    // If we can't check the flag (e.g., cookies not available), default to true
    // This ensures features work by default when flag checking fails
    console.warn(`Cannot check feature flag '${flagName}' (likely cookies not available), defaulting to enabled:`, error);
    return true;
  }
}

/**
 * Get all enabled features for the current organization
 * @returns {Promise<string[]>} Array of enabled feature names
 */
export async function getEnabledFeatures(): Promise<string[]> {
  try {
    const supabase = createSupabaseServerClient();
    const organization = await getActiveOrganizationWithFlags(supabase);
    const flags = organization?.featureFlags as Record<string, boolean> | undefined;
    
    if (!flags) return [];
    
    return Object.entries(flags)
      .filter(([, enabled]) => enabled === true)
      .map(([flagName]) => flagName);
  } catch (error) {
    console.error('Error getting enabled features:', error);
    return [];
  }
} 