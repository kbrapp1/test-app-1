/**
 * Core Organization Repository Implementation
 * 
 * AI INSTRUCTIONS:
 * - Only implement essential methods used by use cases
 * - Keep under 200 lines following @golden-rule
 * - Focus on save, findById, and findByMember operations
 * - Delegate complex queries to separate services
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IOrganizationRepository } from '../../../domain/repositories/IOrganizationRepository';
import { OrganizationAggregate, OrganizationStatus, OrganizationSettings } from '../../../domain/aggregates/OrganizationAggregate';
import { OrganizationId } from '../../../domain/value-objects/OrganizationId';
import { UserId } from '../../../domain/value-objects/UserId';
import { 
  OrganizationNotFoundError,
  BusinessRuleViolationError 
} from '../../../domain/errors/AuthDomainError';
import { UserRole } from '../../../domain/value-objects/UserRole';

interface DatabaseOrganization {
  id: string;
  name: string;
  status: string;
  owner_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  organization_memberships?: Array<{
    user_id: string;
    role: string;
    status: string;
    added_by: string;
    joined_at: string;
  }>;
}

export class SupabaseOrganizationRepository implements IOrganizationRepository {
  constructor(private supabase: SupabaseClient) {}

  async save(organization: OrganizationAggregate): Promise<void> {
    const dbOrg = this.mapToDatabase(organization);
    
    const { error } = await this.supabase
      .from('organizations')
      .upsert(dbOrg, { onConflict: 'id' });

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to save organization',
        { organizationId: organization.getId().value, error: error.message }
      );
    }

    // Save organization members
    await this.saveMembers(organization);
  }

  async findById(id: OrganizationId): Promise<OrganizationAggregate | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select(`
        id, name, status, owner_id, settings, created_at, updated_at,
        organization_memberships (
          user_id, role, status, added_by, joined_at
        )
      `)
      .eq('id', id.value)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new BusinessRuleViolationError(
        'Failed to find organization',
        { organizationId: id.value, error: error.message }
      );
    }

    return this.mapToDomain(data);
  }

  async findByMember(userId: UserId): Promise<OrganizationAggregate[]> {
    const { data: memberships, error: membershipError } = await this.supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', userId.value);

    if (membershipError) {
      throw new BusinessRuleViolationError(
        'Failed to find user memberships',
        { userId: userId.value, error: membershipError.message }
      );
    }

    if (!memberships || memberships.length === 0) return [];

    const orgIds = memberships.map(m => m.organization_id);
    const { data: organizations, error: orgsError } = await this.supabase
      .from('organizations')
      .select(`
        id, name, status, owner_id, settings, created_at, updated_at,
        organization_memberships (
          user_id, role, status, added_by, joined_at
        )
      `)
      .in('id', orgIds)
      .order('name');

    if (orgsError) {
      throw new BusinessRuleViolationError(
        'Failed to find organizations by member',
        { userId: userId.value, error: orgsError.message }
      );
    }

    return organizations?.map(org => this.mapToDomain(org)) || [];
  }

  // Minimal implementations for interface compliance
  async delete(id: OrganizationId): Promise<void> {
    const { error } = await this.supabase
      .from('organizations')
      .delete()
      .eq('id', id.value);

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to delete organization',
        { organizationId: id.value, error: error.message }
      );
    }
  }

  async findByOwner(ownerId: UserId): Promise<OrganizationAggregate[]> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, status, owner_id, settings, created_at, updated_at')
      .eq('owner_id', ownerId.value)
      .order('name');

    if (error) {
      throw new BusinessRuleViolationError(
        'Failed to find organizations by owner',
        { ownerId: ownerId.value, error: error.message }
      );
    }

    return data?.map(org => this.mapToDomain(org)) || [];
  }

  async exists(id: OrganizationId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id')
      .eq('id', id.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BusinessRuleViolationError('Failed to check organization existence', { error: error.message });
    }
    return !!data;
  }

  // Delegate complex operations to separate services
  async findActiveOrganizations(): Promise<OrganizationAggregate[]> {
    throw new Error('Use OrganizationQueryService for complex queries');
  }

  async nameExists(name: string): Promise<boolean> {
    throw new Error('Use OrganizationQueryService for complex queries');
  }

  async saveMany(organizations: OrganizationAggregate[]): Promise<void> {
    for (const org of organizations) {
      await this.save(org);
    }
  }

  async findManyById(ids: OrganizationId[]): Promise<OrganizationAggregate[]> {
    const results: OrganizationAggregate[] = [];
    for (const id of ids) {
      const org = await this.findById(id);
      if (org) results.push(org);
    }
    return results;
  }

  async findByName(name: string): Promise<OrganizationAggregate | null> {
    throw new Error('Use OrganizationQueryService for complex queries');
  }

  async searchByName(namePattern: string): Promise<OrganizationAggregate[]> {
    throw new Error('Use OrganizationQueryService for complex queries');
  }

  async countMembers(organizationId: OrganizationId): Promise<number> {
    throw new Error('Use OrganizationMemberService for member operations');
  }

  async countActiveMembers(organizationId: OrganizationId): Promise<number> {
    throw new Error('Use OrganizationMemberService for member operations');
  }

  private async saveMembers(organization: OrganizationAggregate): Promise<void> {
    const members = organization.members.map(member => ({
      user_id: member.userId,
      organization_id: organization.getId().value,
      role: member.role,
      status: member.status,
      added_by: member.addedBy,
      joined_at: member.joinedAt.toISOString()
    }));

    if (members.length > 0) {
      const { error } = await this.supabase
        .from('organization_memberships')
        .upsert(members, { onConflict: 'user_id,organization_id' });

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to save organization members',
          { organizationId: organization.getId().value, error: error.message }
        );
      }
    }
  }

  private mapToDomain(data: DatabaseOrganization): OrganizationAggregate {
    const organizationId = OrganizationId.create(data.id);
    const ownerId = UserId.create(data.owner_id);
    
    const settings: OrganizationSettings = {
      allowSelfRegistration: data.settings?.allowSelfRegistration || false,
      requireEmailVerification: data.settings?.requireEmailVerification || true,
      maxMembers: data.settings?.maxMembers || 100,
      defaultRole: data.settings?.defaultRole || UserRole.MEMBER
    };

    const organization = new OrganizationAggregate(
      organizationId,
      data.name,
      ownerId,
      data.status as OrganizationStatus,
      settings,
      [], // members will be added separately
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    // Add members if they exist
    if (data.organization_memberships) {
      for (const membership of data.organization_memberships) {
        organization.addMember(
          UserId.create(membership.user_id),
          membership.role as UserRole,
          UserId.create(membership.added_by)
        );
      }
    }

    return organization;
  }

  private mapToDatabase(organization: OrganizationAggregate): Omit<DatabaseOrganization, 'organization_memberships'> {
    return {
      id: organization.getId().value,
      name: organization.name,
      status: organization.status,
      owner_id: organization.ownerId.value,
      settings: organization.settings,
      created_at: organization.createdAt.toISOString(),
      updated_at: organization.updatedAt.toISOString()
    };
  }
} 