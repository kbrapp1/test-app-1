/**
 * Profile Repository - Infrastructure Layer
 * 
 * AI INSTRUCTIONS:
 * - Handle profile persistence operations
 * - Keep focused on profile data operations
 * - Maintain existing functionality exactly
 * - Follow @golden-rule patterns
 */

import { SupabaseClient, User } from '@supabase/supabase-js';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { UserId } from '../../../domain/value-objects/UserId';
import { Email } from '../../../domain/value-objects/Email';
import { UserProfile } from '../../../domain/aggregates/UserAggregate';
import { BusinessRuleViolationError } from '../../../domain/errors/AuthDomainError';

export class ProfileRepository implements IProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Find profile by user ID
   */
  async findById(userId: UserId): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BusinessRuleViolationError(
        'Failed to find profile by ID',
        { userId: userId.value, error: error.message }
      );
    }

    if (!data) return null;

    return {
      firstName: data.full_name?.split(' ')[0] || undefined,
      lastName: data.full_name?.split(' ').slice(1).join(' ') || undefined,
      avatarUrl: data.avatar_url || undefined,
      timezone: data.timezone || undefined,
      language: data.language || undefined
    };
  }

  /**
   * Find profile by email address
   */
  async findByEmail(email: Email): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BusinessRuleViolationError(
        'Failed to find profile by email',
        { email: email.value, error: error.message }
      );
    }

    if (!data) return null;

    return {
      firstName: data.full_name?.split(' ')[0] || undefined,
      lastName: data.full_name?.split(' ').slice(1).join(' ') || undefined,
      avatarUrl: data.avatar_url || undefined,
      timezone: data.timezone || undefined,
      language: data.language || undefined
    };
  }

  /**
   * Save profile changes
   */
  async save(profile: UserProfile): Promise<void> {
    throw new BusinessRuleViolationError(
      'ProfileRepository.save() not implemented - use updateProfile() instead',
      { method: 'save' }
    );
  }

  /**
   * Update profile information
   */
  async updateProfile(userId: UserId, updates: Partial<UserProfile>): Promise<void> {
    const profileData: any = {};

    if (updates.firstName || updates.lastName) {
      const firstName = updates.firstName || '';
      const lastName = updates.lastName || '';
      profileData.full_name = `${firstName} ${lastName}`.trim() || null;
    }

    if (updates.avatarUrl !== undefined) {
      profileData.avatar_url = updates.avatarUrl;
    }

    if (updates.timezone !== undefined) {
      profileData.timezone = updates.timezone;
    }

    if (updates.language !== undefined) {
      profileData.language = updates.language;
    }

    const { error } = await this.supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId.value);

    if (error) {
      throw new BusinessRuleViolationError(
        `Profile update failed: ${error.message || 'Unknown error'}`,
        { userId: userId.value, error: error.message }
      );
    }
  }

  /**
   * Check if profile exists
   */
  async exists(userId: UserId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('id', userId.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BusinessRuleViolationError(
        'Failed to check profile existence',
        { userId: userId.value, error: error.message }
      );
    }

    return !!data;
  }

  /**
   * Update user profile in database
   * Maintains exact same functionality as original service
   */
  async updateUserProfile(user: User): Promise<void> {
    if (!user?.id || !user?.email) {
      console.warn('Cannot update profile: User object is incomplete. Skipping profile upsert.', { userId: user?.id, userEmail: user?.email });
      return;
    }

    const profileData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    };

    const { error: profileError } = await this.supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (profileError) {
      console.error('Error upserting profile:', profileError);
      throw new BusinessRuleViolationError(
        `Profile update failed: ${profileError.message || 'Unknown error'}`,
        { userId: user.id, error: profileError.message }
      );
    }
  }
}

// Export function for backward compatibility
export async function updateUserProfile(supabase: SupabaseClient, user: User): Promise<void> {
  const repository = new ProfileRepository(supabase);
  return repository.updateUserProfile(user);
} 