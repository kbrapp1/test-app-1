/**
 * Organization Data Transfer Object
 * 
 * AI INSTRUCTIONS:
 * - Define clean data contracts for layer boundaries
 * - Include role information for member management
 * - Keep simple - match current usage patterns
 * - Support role-based authorization
 */

import { UserRole } from '../../domain/value-objects/UserRole';

export interface OrganizationDTO {
  id: string;
  name: string;
  ownerId: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  settings: {
    allowSelfRegistration?: boolean;
    requireEmailVerification?: boolean;
    maxMembers?: number;
    defaultRole?: UserRole;
  };
  memberCount: number;
  activeMemberCount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface OrganizationMemberDTO {
  userId: string;
  role: UserRole;
  joinedAt: string; // ISO string
  addedBy: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface CreateOrganizationDTO {
  name: string;
  ownerId: string;
  settings?: {
    allowSelfRegistration?: boolean;
    requireEmailVerification?: boolean;
    maxMembers?: number;
    defaultRole?: UserRole;
  };
}

export interface UpdateOrganizationSettingsDTO {
  allowSelfRegistration?: boolean;
  requireEmailVerification?: boolean;
  maxMembers?: number;
  defaultRole?: UserRole;
}

export interface AddOrganizationMemberDTO {
  organizationId: string;
  userId: string;
  role: UserRole;
  addedBy: string;
}

export interface RemoveOrganizationMemberDTO {
  organizationId: string;
  userId: string;
  removedBy: string;
}

export interface ChangeOrganizationMemberRoleDTO {
  organizationId: string;
  userId: string;
  newRole: UserRole;
  changedBy: string;
}

export interface OrganizationWithMembersDTO extends OrganizationDTO {
  members: OrganizationMemberDTO[];
} 