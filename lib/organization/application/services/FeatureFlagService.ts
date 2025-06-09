/**
 * Core Feature Flag Service
 * 
 * Shared utility for checking organization feature flags.
 * Used by feature-specific services to maintain DDD boundaries while avoiding duplication.
 */

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveOrganizationWithFlags } from './getActiveOrganizationWithFlags';

/**
 * Core feature flag checking logic
 * @param flagName - Name of the feature flag to check
 * @param featureName - Human-readable feature name for error messages
 * @throws {Error} If feature flag is not enabled
 */
export async function checkFeatureFlag(flagName: string, featureName: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const organization = await getActiveOrganizationWithFlags(supabase);
  const flags = organization?.feature_flags as Record<string, boolean> | undefined;

  if (!flags?.[flagName]) {
    throw new Error(`${featureName} feature is not enabled for this organization.`);
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
    const flags = organization?.feature_flags as Record<string, boolean> | undefined;
    
    return flags?.[flagName] ?? false;
  } catch (error) {
    console.error(`Error checking feature flag '${flagName}':`, error);
    return false;
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
    const flags = organization?.feature_flags as Record<string, boolean> | undefined;
    
    if (!flags) return [];
    
    return Object.entries(flags)
      .filter(([, enabled]) => enabled === true)
      .map(([flagName]) => flagName);
  } catch (error) {
    console.error('Error getting enabled features:', error);
    return [];
  }
} 