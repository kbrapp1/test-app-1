import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

/**
 * Checks if a specific feature is enabled for the current active organization.
 * @param featureName The name of the feature flag (e.g., 'dam', 'tts').
 * @returns `true` if the feature is enabled, `false` otherwise.
 */
export const useFeatureFlag = (featureName: string): boolean => {
  const { currentContext } = useOrganization();
  const flags = currentContext?.feature_flags as Record<string, boolean> | undefined;

  // Default to true if flag is missing, but respect explicit false values
  return flags ? (flags.hasOwnProperty(featureName) ? flags[featureName] : true) : true;
}; 