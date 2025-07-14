/**
 * Onboarding Adapter - Anti-Corruption Layer
 * 
 * AI INSTRUCTIONS:
 * - Isolate domain from onboarding service implementation details
 * - Handle onboarding workflow transformations
 * - Protect domain from external onboarding changes
 * - Keep under 150 lines following @golden-rule
 */

import { SupabaseClient, User } from '@supabase/supabase-js';
// UserAggregate available for future use
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { UserId } from '../../domain/value-objects/UserId';
import { BusinessRuleViolationError } from '../../domain/errors/AuthDomainError';

export interface OnboardingContext {
  userId: UserId;
  organizationId: OrganizationId;
  invitedByUserId?: UserId;
  invitationToken?: string;
  completedSteps: string[];
  metadata: Record<string, unknown>;
}

export interface OnboardingResult {
  success: boolean;
  context?: OnboardingContext;
  error?: string;
}

export class OnboardingAdapter {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Complete user onboarding membership
   */
  async completeOnboardingMembership(userId: UserId): Promise<OnboardingResult> {
    try {
      // Get current user to check onboarding status
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      if (user.id !== userId.value) {
        return {
          success: false,
          error: 'User ID mismatch'
        };
      }

      // Check if user needs onboarding completion
      const needsCompletion = this.checkOnboardingRequirements(user);
      
      if (!needsCompletion.required) {
        return {
          success: true,
          context: this.extractOnboardingContext(user)
        };
      }

      // Complete the onboarding process
      const organizationId = user.user_metadata?.invited_to_org_id;
      if (!organizationId) {
        return {
          success: false,
          error: 'No organization invitation found'
        };
      }

      // Update user app metadata with active organization
      const { error: updateError } = await this.supabase.auth.admin.updateUserById(
        userId.value,
        {
          app_metadata: {
            active_organization_id: organizationId
          }
        }
      );

      if (updateError) {
        return {
          success: false,
          error: `Failed to complete onboarding: ${updateError.message}`
        };
      }

      return {
        success: true,
        context: {
          userId,
          organizationId: OrganizationId.create(organizationId),
          completedSteps: ['organization_setup'],
          metadata: { completedAt: new Date().toISOString() }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Onboarding completion failed'
      };
    }
  }

  /**
   * Check if user requires onboarding completion
   */
  private checkOnboardingRequirements(user: User): { required: boolean; reason?: string } {
    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      return { required: false, reason: 'Email not confirmed' };
    }

    // Check if user was invited to an organization
    if (!user.user_metadata?.invited_to_org_id) {
      return { required: false, reason: 'Not invited to organization' };
    }

    // Check if active organization is already set
    if (user.app_metadata?.active_organization_id) {
      return { required: false, reason: 'Already has active organization' };
    }

    return { required: true };
  }

  /**
   * Extract onboarding context from user
   */
  private extractOnboardingContext(user: User): OnboardingContext {
    const userId = UserId.create(user.id);
    const organizationId = OrganizationId.create(
      user.app_metadata?.active_organization_id || user.user_metadata?.invited_to_org_id
    );

    return {
      userId,
      organizationId,
      completedSteps: user.app_metadata?.onboarding_steps || [],
      metadata: user.user_metadata || {}
    };
  }

  /**
   * Update onboarding progress
   */
  async updateOnboardingProgress(
    userId: UserId,
    step: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError || !user || user.id !== userId.value) {
        throw new BusinessRuleViolationError(
          'Cannot update onboarding progress - user not found',
          { userId: userId.value }
        );
      }

      const currentSteps = user.app_metadata?.onboarding_steps || [];
      const updatedSteps = [...new Set([...currentSteps, step])];

      const { error } = await this.supabase.auth.admin.updateUserById(
        userId.value,
        {
          app_metadata: {
            ...user.app_metadata,
            onboarding_steps: updatedSteps,
            onboarding_metadata: {
              ...user.app_metadata?.onboarding_metadata,
              ...metadata,
              lastUpdated: new Date().toISOString()
            }
          }
        }
      );

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to update onboarding progress',
          { userId: userId.value, step, error: error.message }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to update onboarding progress',
        { userId: userId.value, step, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Check if onboarding is complete
   */
  async isOnboardingComplete(userId: UserId): Promise<boolean> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user || user.id !== userId.value) {
        return false;
      }

      const requirements = this.checkOnboardingRequirements(user);
      return !requirements.required;
    } catch {
      return false;
    }
  }
} 