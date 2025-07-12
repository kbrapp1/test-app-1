/**
 * Onboarding Service - Infrastructure Layer
 * 
 * AI INSTRUCTIONS:
 * - Handle onboarding infrastructure operations
 * - Keep focused on Supabase edge function integration
 * - Maintain existing functionality exactly
 * - Follow @golden-rule patterns
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessRuleViolationError } from '../../domain/errors/AuthDomainError';

export class OnboardingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Complete onboarding membership via Supabase edge function
   * Maintains exact same functionality as original service
   */
  async completeOnboardingMembership(): Promise<void> {
    const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
    if (sessionError || !session) {
      throw new BusinessRuleViolationError(
        'Session expired or not found when trying to complete onboarding',
        { sessionError: sessionError?.message }
      );
    }

    const { data, error: funcError } = await this.supabase.functions.invoke(
      'complete-onboarding-membership',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      }
    );

    if (funcError || data?.error) {
      const errorDetail = funcError || data?.error;
      const errorMessage = errorDetail?.message || errorDetail?.details || errorDetail?.error || 'Failed to complete onboarding process via edge function.';
      console.error('Error invoking complete-onboarding-membership:', errorMessage, { funcError, data });
      throw new BusinessRuleViolationError(
        errorMessage,
        { funcError, data }
      );
    }
  }
}

// Export function for backward compatibility
export async function completeOnboardingMembership(supabase: SupabaseClient): Promise<void> {
  const service = new OnboardingService(supabase);
  return service.completeOnboardingMembership();
} 