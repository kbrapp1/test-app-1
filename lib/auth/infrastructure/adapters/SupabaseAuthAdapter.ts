/**
 * Supabase Auth Adapter - Anti-Corruption Layer
 * 
 * AI INSTRUCTIONS:
 * - Isolate domain from Supabase auth implementation details
 * - Transform between Supabase types and domain types
 * - Handle all Supabase-specific authentication logic
 * - Protect domain from external API changes
 * - Keep under 250 lines following @golden-rule
 */

import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { UserAggregate, UserStatus, UserProfile } from '../../domain/aggregates/UserAggregate';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { BusinessRuleViolationError, InvalidCredentialsError } from '../../domain/errors/AuthDomainError';

export interface AuthenticationResult {
  success: boolean;
  user?: UserAggregate;
  session?: Session;
  error?: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: UserAggregate;
  error?: string;
}

export class SupabaseAuthAdapter {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(email: string, password: string): Promise<AuthenticationResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error.message)
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Authentication failed - no user or session returned'
        };
      }

      const userAggregate = await this.transformToUserAggregate(data.user);
      
      return {
        success: true,
        user: userAggregate,
        session: data.session
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Register new user with email and password
   */
  async registerUser(email: string, password: string, organizationId: string): Promise<RegistrationResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            invited_to_org_id: organizationId
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error.message)
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Registration failed - no user returned'
        };
      }

      const userAggregate = await this.transformToUserAggregate(data.user);
      
      return {
        success: true,
        user: userAggregate
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserAggregate | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return await this.transformToUserAggregate(user);
    } catch (error) {
      return null;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw new BusinessRuleViolationError(
        'Sign out failed',
        { error: error.message }
      );
    }
  }

  /**
   * Transform Supabase User to UserAggregate
   */
  private async transformToUserAggregate(supabaseUser: User): Promise<UserAggregate> {
    const userId = UserId.create(supabaseUser.id);
    const email = Email.create(supabaseUser.email || '');
    
    // Get organization ID from custom claims or metadata
    const activeOrgId = supabaseUser.app_metadata?.active_organization_id || 
                       supabaseUser.user_metadata?.invited_to_org_id;
    
    if (!activeOrgId) {
      throw new BusinessRuleViolationError(
        'User has no active organization',
        { userId: supabaseUser.id }
      );
    }

    const organizationId = OrganizationId.create(activeOrgId);

    // Transform user metadata to domain profile
    const profile: UserProfile = {
      firstName: supabaseUser.user_metadata?.first_name || 
                 supabaseUser.user_metadata?.full_name?.split(' ')[0],
      lastName: supabaseUser.user_metadata?.last_name || 
                supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' '),
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      timezone: supabaseUser.user_metadata?.timezone,
      language: supabaseUser.user_metadata?.language
    };

    // Transform user status
    const status = this.mapUserStatus(supabaseUser);
    
    // Get organization memberships from custom claims or metadata
    const memberships = supabaseUser.app_metadata?.organization_memberships || [activeOrgId];

    return new UserAggregate(
      userId,
      email,
      organizationId,
      profile,
      status,
      supabaseUser.email_confirmed_at !== null,
      memberships,
      new Date(supabaseUser.created_at),
      new Date(supabaseUser.updated_at || supabaseUser.created_at),
      supabaseUser.last_sign_in_at ? new Date(supabaseUser.last_sign_in_at) : undefined
    );
  }

  /**
   * Map Supabase user status to domain UserStatus
   */
  private mapUserStatus(supabaseUser: User): UserStatus {
    // Check if email is confirmed
    if (!supabaseUser.email_confirmed_at) {
      return UserStatus.PENDING_VERIFICATION;
    }

    // Check if user is suspended (using app_metadata for custom suspension logic)
    if (supabaseUser.app_metadata?.is_suspended) {
      return UserStatus.SUSPENDED;
    }

    // Default to active for confirmed users
    return UserStatus.ACTIVE;
  }

  /**
   * Map Supabase auth errors to domain-friendly messages
   */
  private mapAuthError(supabaseError: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please verify your email address before signing in',
      'User already registered': 'An account with this email already exists',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long',
      'Invalid email': 'Please enter a valid email address',
      'Signup not allowed for this instance': 'Registration is currently disabled',
      'Email rate limit exceeded': 'Too many email attempts. Please wait before trying again'
    };

    return errorMap[supabaseError] || supabaseError;
  }

  /**
   * Update user metadata in Supabase
   */
  async updateUserMetadata(userId: UserId, metadata: Record<string, any>): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(
      userId.value,
      { user_metadata: metadata }
    );

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to update user metadata',
        { userId: userId.value, error: error.message }
      );
    }
  }

  /**
   * Update user app metadata (requires admin privileges)
   */
  async updateUserAppMetadata(userId: UserId, metadata: Record<string, any>): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(
      userId.value,
      { app_metadata: metadata }
    );

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to update user app metadata',
        { userId: userId.value, error: error.message }
      );
    }
  }
} 