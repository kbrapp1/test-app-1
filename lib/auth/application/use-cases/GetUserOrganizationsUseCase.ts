/**
 * Get User Organizations Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate domain service and repository
 * - No business logic - delegate to domain service
 * - Match current organization-service.ts functionality
 * - Keep simple and focused
 */

import { Organization } from '../../domain/value-objects/Organization';
import { OrganizationDomainService, UserProfile } from '../../domain/services/OrganizationDomainService';
import { OrganizationRepository } from '../../infrastructure/persistence/supabase/OrganizationRepository';

export class GetUserOrganizationsUseCase {
  constructor(
    private organizationRepository: OrganizationRepository
  ) {}

  async execute(profile: UserProfile): Promise<Organization[]> {
    if (profile.is_super_admin) {
      // Super admin gets all organizations
      const allOrganizations = await this.organizationRepository.getAllOrganizations();
      return OrganizationDomainService.determineUserOrganizations(
        profile,
        allOrganizations,
        [] // Not needed for super admin
      );
    } else {
      // Regular user gets their membership organizations
      const userMembershipOrganizations = await this.organizationRepository.getUserMembershipOrganizations(profile.id);
      return OrganizationDomainService.determineUserOrganizations(
        profile,
        [], // Not needed for regular user
        userMembershipOrganizations
      );
    }
  }
} 