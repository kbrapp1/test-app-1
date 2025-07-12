/**
 * User Data Transfer Object
 * 
 * AI INSTRUCTIONS:
 * - Define clean data contracts for layer boundaries
 * - Include only data actually used in current app
 * - Keep simple - match current usage patterns
 * - Include role information for authorization
 */

import { UserRole } from '../../domain/value-objects/UserRole';

export interface UserDTO {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  emailVerified: boolean;
  activeOrganizationId: string;
  role: UserRole; // User's role in the active organization
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CreateUserDTO {
  email: string;
  organizationId: string;
  role?: UserRole; // Optional role assignment (defaults to member)
  firstName?: string;
  lastName?: string;
  timezone?: string;
  language?: string;
}

export interface UpdateUserProfileDTO {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
}

export interface UserRoleDTO {
  userId: string;
  organizationId: string;
  role: UserRole;
  assignedBy: string;
  assignedAt: string; // ISO string
}

export interface ChangeUserRoleDTO {
  userId: string;
  organizationId: string;
  newRole: UserRole;
  changedBy: string;
} 