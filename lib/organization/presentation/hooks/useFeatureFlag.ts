import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

/**
 * Checks if a specific feature is enabled for the current active organization.
 * @param featureName The name of the feature flag (e.g., 'dam', 'tts').
 * @returns `true` if the feature is enabled, `false` otherwise.
 */
export const useFeatureFlag = (featureName: string): boolean => {
  const { currentContext } = useOrganization();
  const flags = currentContext?.feature_flags as Record<string, boolean> | undefined;

  // Default to false if flags are not present or the specific flag is not set.
  return flags?.[featureName] ?? false;
}; 