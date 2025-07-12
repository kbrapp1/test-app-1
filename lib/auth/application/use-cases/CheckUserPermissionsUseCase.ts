/**
 * Check User Permissions Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate permission checking workflow
 * - Use domain services for business logic
 * - Match current permission patterns
 * - Return detailed permission information
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { PermissionService } from '../../domain/services/PermissionService';
import { 
  UserNotFoundError,
  OrganizationNotFoundError,
  BusinessRuleViolationError
} from '../../domain/errors/AuthDomainError';
import { UserRole } from '../../domain/value-objects/UserRole';
import { Permission } from '../../domain/value-objects/Permission';

export interface CheckPermissionsDTO {
  userId: string;
  organizationId: string;
  requiredPermissions: Permission[];
}

export interface UserPermissionsResult {
  success: boolean;
  permissions?: {
    userId: string;
    organizationId: string;
    userRole: UserRole;
    granted: boolean;
    userPermissions: Permission[];
    requiredPermissions: Permission[];
    missingPermissions: Permission[];
    reason: string;
  };
  error?: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
}

export class CheckUserPermissionsUseCase {
  constructor(
    private userRepository: IUserRepository,
    private organizationRepository: IOrganizationRepository
  ) {}

  async execute(dto: CheckPermissionsDTO): Promise<UserPermissionsResult> {
    try {
      // Convert DTO to domain value objects
      const userId = UserId.create(dto.userId);
      const organizationId = OrganizationId.create(dto.organizationId);

      // Find user and organization
      const [user, organization] = await Promise.all([
        this.userRepository.findById(userId),
        this.organizationRepository.findById(organizationId)
      ]);

      if (!user) {
        throw new UserNotFoundError(dto.userId, { userId: dto.userId });
      }

      if (!organization) {
        throw new OrganizationNotFoundError(dto.organizationId, { organizationId: dto.organizationId });
      }

      // Get user's role in the organization
      const member = organization.getMember(userId);
      if (!member) {
        throw new BusinessRuleViolationError(
          'User is not a member of this organization',
          { userId: dto.userId, organizationId: dto.organizationId }
        );
      }

      // Check permissions using domain service
      const userRole = member.role as UserRole;
      const permissionResult = PermissionService.checkPermissions({
        userId,
        userRole,
        organizationId,
        requiredPermissions: dto.requiredPermissions
      });

      // Get all permissions for the user's role
      const userPermissions = PermissionService.getAllPermissionsForRole(userRole);

      return {
        success: true,
        permissions: {
          userId: dto.userId,
          organizationId: dto.organizationId,
          userRole,
          granted: permissionResult.granted,
          userPermissions,
          requiredPermissions: dto.requiredPermissions,
          missingPermissions: permissionResult.missingPermissions,
          reason: permissionResult.reason
        }
      };

    } catch (error) {
      if (error instanceof UserNotFoundError || 
          error instanceof OrganizationNotFoundError ||
          error instanceof BusinessRuleViolationError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            context: error.context
          }
        };
      }

      // Re-throw unexpected errors
      throw error;
    }
  }
} 