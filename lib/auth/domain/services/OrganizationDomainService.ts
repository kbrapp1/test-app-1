/**
 * Organization Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Single responsibility: organization access rules
 * - No database access - only business rules
 * - Match current getUserOrganizations logic exactly
 */

import { Organization } from '../value-objects/Organization';

export interface UserProfile {
  id: string;
  is_super_admin: boolean;
}

export class OrganizationDomainService {
  /**
   * Determine which organizations a user can access
   * Business Rule: Super admins get all organizations, regular users get their memberships
   */
  static determineUserOrganizations(
    profile: UserProfile,
    allOrganizations: Organization[],
    userMembershipOrganizations: Organization[]
  ): Organization[] {
    if (profile.is_super_admin) {
      return allOrganizations;
    }
    
    return userMembershipOrganizations;
  }

  /**
   * Validate if user can access specific organization
   * Business Rule: Super admins can access any org, regular users need membership
   */
  static canAccessOrganization(
    profile: UserProfile,
    organizationId: string,
    userMembershipOrganizationIds: string[]
  ): boolean {
    if (profile.is_super_admin) {
      return true;
    }
    
    return userMembershipOrganizationIds.includes(organizationId);
  }
} 