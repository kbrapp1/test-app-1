import type { Database } from '@/types/supabase';
import { getTtsProviderConfig } from '@/lib/config/ttsProviderConfig';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

/**
 * Determines if a prediction link is likely expired based on provider configuration and creation date.
 */
export const isPredictionLinkLikelyExpired = (item: TtsPredictionRow): boolean => {
  if (!item.prediction_provider || !item.outputUrl || !item.createdAt) {
    return false;
  }

  const providerConfig = getTtsProviderConfig(item.prediction_provider);
  const linkExpiryMinutes = providerConfig?.linkExpiryMinutes;

  if (typeof linkExpiryMinutes !== 'number') {
    return false;
  }

  if (item.prediction_provider === 'replicate' && !item.outputUrl.includes('replicate.delivery')) {
    return false;
  }

  try {
    const creationDate = new Date(item.createdAt);
    const expiryThreshold = new Date(creationDate.getTime() + linkExpiryMinutes * 60 * 1000);
    return new Date() > expiryThreshold;
  } catch (e) {
    console.warn('Error parsing date for expiry check:', item.createdAt, e);
    return false;
  }
}; 