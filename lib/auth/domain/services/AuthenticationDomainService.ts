/**
 * Authentication Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle
 * - Never exceed 250 lines - refactor into smaller services
 * - Follow @golden-rule patterns exactly
 * - Check for existing similar logic before creating new
 * - Always validate inputs using value objects
 * - Delegate complex calculations to separate methods
 * - Handle domain errors with specific error types
 */

import { UserAggregate, UserStatus } from '../aggregates/UserAggregate';
import { OrganizationAggregate, OrganizationStatus } from '../aggregates/OrganizationAggregate';
import { UserId } from '../value-objects/UserId';
import { OrganizationId } from '../value-objects/OrganizationId';
import { Email } from '../value-objects/Email';
import {
  InvalidCredentialsError,
  InsufficientPermissionsError,
  BusinessRuleViolationError,
  SessionExpiredError,
  OrganizationMembershipError
} from '../errors/AuthDomainError';

export interface AuthenticationContext {
  userId: UserId;
  organizationId: OrganizationId;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
  permissions: string[];
}

export interface LoginAttempt {
  email: Email;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthenticationDomainService {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 15;
  private static readonly SESSION_DURATION_HOURS = 24;

  /**
   * Validates user credentials and organizational context
   * Super admins can bypass organization membership checks
   */
  static validateAuthentication(
    user: UserAggregate,
    organization: OrganizationAggregate,
    requestedOrganizationId: OrganizationId
  ): void {
    // Validate user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new InvalidCredentialsError({
        userId: user.getId().value,
        status: user.status,
        reason: 'User account is not active'
      });
    }

    // Validate email verification
    if (!user.emailVerified) {
      throw new InvalidCredentialsError({
        userId: user.getId().value,
        emailVerified: false,
        reason: 'Email address not verified'
      });
    }

    // Validate organization status
    if (organization.status !== OrganizationStatus.ACTIVE) {
      throw new OrganizationMembershipError(
        'Organization is not active',
        {
          organizationId: organization.getId().value,
          status: organization.status
        }
      );
    }

    // Super admin bypass - can access any organization
    if (user.hasSuperAdminRole()) {
      return; // Skip membership and active organization checks
    }

    // Validate user is member of requested organization
    if (!organization.isMember(user.getId())) {
      throw new OrganizationMembershipError(
        'User is not a member of the requested organization',
        {
          userId: user.getId().value,
          organizationId: requestedOrganizationId.value
        }
      );
    }

    // Validate user's active organization matches request
    if (!user.activeOrganizationId.equals(requestedOrganizationId)) {
      throw new BusinessRuleViolationError(
        'User\'s active organization does not match request',
        {
          userId: user.getId().value,
          activeOrganizationId: user.activeOrganizationId.value,
          requestedOrganizationId: requestedOrganizationId.value
        }
      );
    }
  }

  /**
   * Creates authentication context for valid login
   * Super admins get enhanced permissions
   */
  static createAuthenticationContext(
    user: UserAggregate,
    organization: OrganizationAggregate,
    sessionId: string
  ): AuthenticationContext {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.SESSION_DURATION_HOURS * 60 * 60 * 1000));
    
    // Super admin gets all permissions
    if (user.hasSuperAdminRole()) {
      const permissions = this.getSuperAdminPermissions();
      return {
        userId: user.getId(),
        organizationId: organization.getId(),
        sessionId,
        issuedAt: now,
        expiresAt,
        permissions
      };
    }

    // Get user permissions from organization membership
    const member = organization.getMember(user.getId());
    const permissions = this.getPermissionsForRole(member?.role || 'member');

    return {
      userId: user.getId(),
      organizationId: organization.getId(),
      sessionId,
      issuedAt: now,
      expiresAt,
      permissions
    };
  }

  /**
   * Validates session and returns authentication context
   */
  static validateSession(
    context: AuthenticationContext,
    currentTime: Date = new Date()
  ): void {
    if (currentTime > context.expiresAt) {
      throw new SessionExpiredError({
        sessionId: context.sessionId,
        userId: context.userId.value,
        expiredAt: context.expiresAt,
        currentTime
      });
    }

    // Additional session validation can be added here
    // e.g., IP address validation, user agent validation, etc.
  }

  /**
   * Determines if user can switch to target organization
   * Super admins can switch to any organization
   */
  static canSwitchOrganization(
    user: UserAggregate,
    targetOrganization: OrganizationAggregate
  ): boolean {
    // User must be active
    if (user.status !== UserStatus.ACTIVE) {
      return false;
    }

    // Target organization must be active
    if (targetOrganization.status !== OrganizationStatus.ACTIVE) {
      return false;
    }

    // Super admin bypass - can switch to any organization
    if (user.hasSuperAdminRole()) {
      return true;
    }

    // User must be a member of target organization
    if (!targetOrganization.isMember(user.getId())) {
      return false;
    }

    // User must have organization membership
    if (!user.organizationMemberships.includes(targetOrganization.getId().value)) {
      return false;
    }

    return true;
  }

  /**
   * Validates organization switching request
   */
  static validateOrganizationSwitch(
    user: UserAggregate,
    targetOrganization: OrganizationAggregate
  ): void {
    if (!this.canSwitchOrganization(user, targetOrganization)) {
      throw new OrganizationMembershipError(
        'Cannot switch to target organization',
        {
          userId: user.getId().value,
          targetOrganizationId: targetOrganization.getId().value,
          userStatus: user.status,
          organizationStatus: targetOrganization.status,
          isMember: targetOrganization.isMember(user.getId())
        }
      );
    }
  }

  /**
   * Analyzes login attempts for security patterns
   */
  static analyzeLoginAttempts(
    attempts: LoginAttempt[],
    timeWindow: number = 60 // minutes
  ): {
    isLocked: boolean;
    remainingAttempts: number;
    lockoutExpiresAt?: Date;
    suspiciousActivity: boolean;
  } {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (timeWindow * 60 * 1000));
    
    // Filter attempts within time window
    const recentAttempts = attempts.filter(attempt => 
      attempt.timestamp >= windowStart
    );

    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    const successfulAttempts = recentAttempts.filter(attempt => attempt.success);

    // Check for account lockout
    const isLocked = failedAttempts.length >= this.MAX_LOGIN_ATTEMPTS;
    const remainingAttempts = Math.max(0, this.MAX_LOGIN_ATTEMPTS - failedAttempts.length);
    
    let lockoutExpiresAt: Date | undefined;
    if (isLocked && failedAttempts.length > 0) {
      const lastFailedAttempt = failedAttempts[failedAttempts.length - 1];
      lockoutExpiresAt = new Date(
        lastFailedAttempt.timestamp.getTime() + (this.LOCKOUT_DURATION_MINUTES * 60 * 1000)
      );
    }

    // Detect suspicious activity patterns
    const suspiciousActivity = this.detectSuspiciousActivity(recentAttempts);

    return {
      isLocked,
      remainingAttempts,
      lockoutExpiresAt,
      suspiciousActivity
    };
  }

  /**
   * Gets permissions for a given role
   */
  private static getPermissionsForRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'owner': [
        'organization:read',
        'organization:write',
        'organization:delete',
        'members:read',
        'members:write',
        'members:delete',
        'settings:read',
        'settings:write',
        'billing:read',
        'billing:write'
      ],
      'admin': [
        'organization:read',
        'organization:write',
        'members:read',
        'members:write',
        'members:delete',
        'settings:read',
        'settings:write'
      ],
      'member': [
        'organization:read',
        'members:read',
        'settings:read'
      ],
      'viewer': [
        'organization:read',
        'members:read'
      ]
    };

    return rolePermissions[role] || rolePermissions['viewer'];
  }

  /**
   * Gets all permissions for super admin
   */
  private static getSuperAdminPermissions(): string[] {
    return [
      // All organization permissions
      'organization:read',
      'organization:write',
      'organization:delete',
      'organization:switch',
      'organization:create',
      
      // All member permissions
      'members:read',
      'members:write',
      'members:delete',
      'members:invite',
      'members:manage',
      
      // All settings permissions
      'settings:read',
      'settings:write',
      'settings:delete',
      
      // All billing permissions
      'billing:read',
      'billing:write',
      'billing:manage',
      
      // Super admin specific permissions
      'super_admin:grant',
      'super_admin:revoke',
      'super_admin:access_all_orgs',
      'super_admin:bypass_rls',
      'super_admin:transfer_entities',
      'super_admin:invalidate_cache',
      'super_admin:manage_system'
    ];
  }

  /**
   * Detects suspicious login activity patterns
   */
  private static detectSuspiciousActivity(attempts: LoginAttempt[]): boolean {
    if (attempts.length < 3) {
      return false;
    }

    // Check for rapid-fire attempts (more than 10 attempts in 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - (5 * 60 * 1000));
    const rapidAttempts = attempts.filter(attempt => 
      attempt.timestamp >= fiveMinutesAgo
    );

    if (rapidAttempts.length > 10) {
      return true;
    }

    // Check for attempts from multiple IP addresses
    const uniqueIPs = new Set(
      attempts
        .filter(attempt => attempt.ipAddress)
        .map(attempt => attempt.ipAddress)
    );

    if (uniqueIPs.size > 5) {
      return true;
    }

    // Check for mixed success/failure patterns that might indicate credential stuffing
    const failureRate = attempts.filter(a => !a.success).length / attempts.length;
    if (failureRate > 0.8 && attempts.length > 20) {
      return true;
    }

    return false;
  }
} 