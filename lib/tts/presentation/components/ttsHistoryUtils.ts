import { TtsHistoryItem } from '../types/TtsPresentation';

/**
 * Determines if a prediction link is likely expired based on provider configuration and creation date.
 */
export const isPredictionLinkLikelyExpired = (item: TtsHistoryItem): boolean => {
  // Use the DTO's computed property for URL expiration detection
  return item.isOutputUrlLikelyExpired;
}; 