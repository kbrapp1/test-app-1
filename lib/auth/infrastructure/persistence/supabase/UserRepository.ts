/**
 * Minimal Supabase User Repository Implementation
 * 
 * AI INSTRUCTIONS:
 * - Only implement methods actually used in the codebase
 * - Keep under 150 lines following @golden-rule
 * - Focus on save, findById, findByEmail, and exists operations
 * - Maintain feature parity with current profileService functionality
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserAggregate, UserStatus } from '../../../domain/aggregates/UserAggregate';
import { UserId } from '../../../domain/value-objects/UserId';
import { OrganizationId } from '../../../domain/value-objects/OrganizationId';
import { Email } from '../../../domain/value-objects/Email';
import { 
  BusinessRuleViolationError 
} from '../../../domain/errors/AuthDomainError';

interface ProfileRecord {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export class UserRepository implements IUserRepository {
  constructor(private supabase: SupabaseClient) {}

  async save(user: UserAggregate): Promise<void> {
    const profileData = {
      id: user.getId().value,
      email: user.email.value,
      full_name: user.profile.firstName && user.profile.lastName 
        ? `${user.profile.firstName} ${user.profile.lastName}` 
        : user.profile.firstName || user.profile.lastName || null,
      avatar_url: user.profile.avatarUrl || null,
      is_super_admin: false, // Super admin flag managed separately
      status: user.status,
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to save user profile',
        { userId: user.getId().value, error: error.message }
      );
    }
  }

  async findById(id: UserId): Promise<UserAggregate | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id.value)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new BusinessRuleViolationError(
        'Failed to find user by ID',
        { userId: id.value, error: error.message }
      );
    }

    return this.mapToAggregate(data);
  }

  async findByEmail(email: Email): Promise<UserAggregate | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email.value)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new BusinessRuleViolationError(
        'Failed to find user by email',
        { email: email.value, error: error.message }
      );
    }

    return this.mapToAggregate(data);
  }

  async exists(id: UserId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('id', id.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BusinessRuleViolationError(
        'Failed to check user existence',
        { userId: id.value, error: error.message }
      );
    }

    return data !== null;
  }

  async emailExists(email: Email): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('email', email.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BusinessRuleViolationError(
        'Failed to check email existence',
        { email: email.value, error: error.message }
      );
    }

    return data !== null;
  }

  // Minimal implementations for interface compliance - not used in current codebase
  async delete(_id: UserId): Promise<void> {
    throw new Error('Delete operation not implemented - not used in current codebase');
  }

  async findByOrganization(_organizationId: OrganizationId): Promise<UserAggregate[]> {
    throw new Error('FindByOrganization not implemented - not used in current codebase');
  }

  async findActiveUsers(): Promise<UserAggregate[]> {
    throw new Error('FindActiveUsers not implemented - not used in current codebase');
  }

  async findPendingVerification(): Promise<UserAggregate[]> {
    throw new Error('FindPendingVerification not implemented - not used in current codebase');
  }

  async saveMany(_users: UserAggregate[]): Promise<void> {
    throw new Error('SaveMany not implemented - not used in current codebase');
  }

  async findManyById(_ids: UserId[]): Promise<UserAggregate[]> {
    throw new Error('FindManyById not implemented - not used in current codebase');
  }

  async findByOrganizationMembership(_organizationId: OrganizationId): Promise<UserAggregate[]> {
    throw new Error('FindByOrganizationMembership not implemented - not used in current codebase');
  }

  async countByOrganization(_organizationId: OrganizationId): Promise<number> {
    throw new Error('CountByOrganization not implemented - not used in current codebase');
  }

  private mapToAggregate(record: ProfileRecord): UserAggregate {
    const userId = new UserId(record.id);
    const email = new Email(record.email);
    
    // Parse full name into first and last name
    const nameParts = record.full_name?.split(' ') || [];
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.slice(1).join(' ') || undefined;
    
    // Create a dummy organization ID - this will be set properly when loading organization context
    const dummyOrgId = new OrganizationId('00000000-0000-0000-0000-000000000000');
    
    return new UserAggregate(
      userId,
      email,
      dummyOrgId, // This will be set properly when loading organization context
      {
        firstName,
        lastName,
        avatarUrl: record.avatar_url || undefined
      },
      record.status as UserStatus,
      false, // email verification status
      [], // organizations will be loaded separately
      new Date(record.created_at),
      new Date(record.updated_at)
    );
  }
} 