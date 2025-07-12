/**
 * Super Admin Role Value Object - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Domain value object for super admin role
 * - Immutable and validates super admin status
 * - Integrates with main auth domain permission system
 * - Single responsibility: Super admin role validation
 */

import { BusinessRuleViolationError } from '../errors/AuthDomainError';

export class SuperAdminRole {
  private constructor(private readonly _isActive: boolean) {
    this.validateSuperAdminStatus();
  }

  public static create(isActive: boolean): SuperAdminRole {
    return new SuperAdminRole(isActive);
  }

  public static fromProfile(profile: any): SuperAdminRole {
    return new SuperAdminRole(profile?.is_super_admin === true);
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public canAccessAllOrganizations(): boolean {
    return this._isActive;
  }

  public canManageOrganization(organizationId: string): boolean {
    return this._isActive; // Super admin can manage any organization
  }

  public canBypassOrganizationRLS(): boolean {
    return this._isActive;
  }

  public canTransferBetweenOrganizations(): boolean {
    return this._isActive;
  }

  public canInvalidateGlobalCache(): boolean {
    return this._isActive;
  }

  public canViewAllOrganizationData(): boolean {
    return this._isActive;
  }

  public equals(other: SuperAdminRole): boolean {
    return this._isActive === other._isActive;
  }

  private validateSuperAdminStatus(): void {
    // Super admin status is either true or false - no validation needed
    // This method exists for consistency with other value objects
  }

  public toString(): string {
    return this._isActive ? 'SuperAdmin' : 'RegularUser';
  }

  public toJSON(): object {
    return {
      isActive: this._isActive,
      canAccessAllOrganizations: this.canAccessAllOrganizations(),
      canBypassOrganizationRLS: this.canBypassOrganizationRLS(),
    };
  }
} 