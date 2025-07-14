/**
 * User Mapper
 * 
 * AI INSTRUCTIONS:
 * - Handle essential transformations only
 * - Map between domain entities and DTOs
 * - Include role information for authorization
 * - Keep simple - match current app usage
 */

import { UserAggregate } from '../../domain/aggregates/UserAggregate';
import { OrganizationAggregate } from '../../domain/aggregates/OrganizationAggregate';
import { UserId } from '../../domain/value-objects/UserId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { Email } from '../../domain/value-objects/Email';
import { UserDTO } from '../dto/UserDTO';
import { UserRole } from '../../domain/value-objects/UserRole';

export class UserMapper {
  /**
   * Maps UserAggregate to UserDTO with role information
   * Requires organization context to determine user's role
   */
  static toDTO(user: UserAggregate, organization: OrganizationAggregate): UserDTO {
    // Get user's role in the organization
    const member = organization.getMember(user.getId());
    const userRole = member?.role as UserRole || UserRole.VIEWER;

    return {
      id: user.getId().value,
      email: user.email.value,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatarUrl: user.profile.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      activeOrganizationId: user.activeOrganizationId.value,
      role: userRole,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  /**
   * Maps UserAggregate to UserDTO without organization context
   * Uses default role when organization context is not available
   */
  static toDTOWithoutOrg(user: UserAggregate, defaultRole: UserRole = UserRole.MEMBER): UserDTO {
    return {
      id: user.getId().value,
      email: user.email.value,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatarUrl: user.profile.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      activeOrganizationId: user.activeOrganizationId.value,
      role: defaultRole,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  /**
   * Maps array of UserAggregates to array of UserDTOs
   * Requires organization context for role information
   */
  static toDTOArray(users: UserAggregate[], organization: OrganizationAggregate): UserDTO[] {
    return users.map(user => this.toDTO(user, organization));
  }

  /**
   * Creates domain value objects from strings
   */
  static createUserId(id: string): UserId {
    return UserId.create(id);
  }

  static createEmail(email: string): Email {
    return Email.create(email);
  }

  static createOrganizationId(id: string): OrganizationId {
    return OrganizationId.create(id);
  }
} 