/**
 * Change User Role Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate role change workflow
 * - Include proper authorization checks
 * - Match current role management patterns
 * - Use domain services for business logic
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { PermissionService } from '../../domain/services/PermissionService';
import { 
  UserNotFoundError,
  OrganizationNotFoundError,
  BusinessRuleViolationError,
  InsufficientPermissionsError
} from '../../domain/errors/AuthDomainError';
import { ChangeUserRoleDTO, UserRoleDTO } from '../dto/UserDTO';
import { UserRole } from '../../domain/value-objects/UserRole';

export interface ChangeUserRoleResult {
  success: boolean;
  userRole?: UserRoleDTO;
  error?: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
}

export class ChangeUserRoleUseCase {
  constructor(
    private userRepository: IUserRepository,
    private organizationRepository: IOrganizationRepository
  ) {}

  async execute(dto: ChangeUserRoleDTO): Promise<ChangeUserRoleResult> {
    try {
      // Convert DTO to domain value objects
      const userId = UserId.create(dto.userId);
      const organizationId = OrganizationId.create(dto.organizationId);
      const changerId = UserId.create(dto.changedBy);

      // Find user and organization
      const [user, organization, changer] = await Promise.all([
        this.userRepository.findById(userId),
        this.organizationRepository.findById(organizationId),
        this.userRepository.findById(changerId)
      ]);

      if (!user) {
        throw new UserNotFoundError(dto.userId, { userId: dto.userId });
      }

      if (!organization) {
        throw new OrganizationNotFoundError(dto.organizationId, { organizationId: dto.organizationId });
      }

      if (!changer) {
        throw new UserNotFoundError(dto.changedBy, { userId: dto.changedBy });
      }

      // Get changer's role in the organization
      const changerMember = organization.getMember(changerId);
      if (!changerMember) {
        throw new InsufficientPermissionsError(
          'User is not a member of this organization',
          { userId: dto.changedBy, organizationId: dto.organizationId }
        );
      }

      // Check if changer can assign this role
      const canAssignRole = PermissionService.validateRoleAssignment(
        changerMember.role as UserRole,
        dto.newRole,
        organizationId
      );

      if (!canAssignRole) {
        throw new InsufficientPermissionsError(
          'Insufficient permissions to assign this role',
          { 
            changerRole: changerMember.role,
            targetRole: dto.newRole,
            organizationId: dto.organizationId
          }
        );
      }

      // Change member role in organization
      organization.changeMemberRole(userId, dto.newRole, changerId);

      // Save organization
      await this.organizationRepository.save(organization);

      // Return result
      return {
        success: true,
        userRole: {
          userId: dto.userId,
          organizationId: dto.organizationId,
          role: dto.newRole,
          assignedBy: dto.changedBy,
          assignedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      if (error instanceof UserNotFoundError || 
          error instanceof OrganizationNotFoundError ||
          error instanceof BusinessRuleViolationError ||
          error instanceof InsufficientPermissionsError) {
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