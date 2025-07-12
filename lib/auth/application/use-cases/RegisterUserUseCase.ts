/**
 * Register User Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate basic user registration workflow
 * - Match current Supabase signup flow
 * - Include role assignment for new users
 * - Focus on essential business coordination only
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { UserAggregate } from '../../domain/aggregates/UserAggregate';
import { Email } from '../../domain/value-objects/Email';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { 
  DuplicateResourceError,
  BusinessRuleViolationError,
  OrganizationNotFoundError 
} from '../../domain/errors/AuthDomainError';
import { CreateUserDTO, UserDTO } from '../dto/UserDTO';
import { UserMapper } from '../mappers/UserMapper';
import { UserRole } from '../../domain/value-objects/UserRole';

export interface RegisterUserResult {
  success: boolean;
  user?: UserDTO;
  error?: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
}

export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private organizationRepository: IOrganizationRepository
  ) {}

  async execute(dto: CreateUserDTO): Promise<RegisterUserResult> {
    try {
      // Convert DTO to domain value objects
      const email = Email.create(dto.email);
      const organizationId = OrganizationId.create(dto.organizationId);
      const assignedRole = dto.role || UserRole.MEMBER; // Default to member role

      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new DuplicateResourceError(
          'User',
          email.value,
          { email: email.value }
        );
      }

      // Get organization for role assignment
      const organization = await this.organizationRepository.findById(organizationId);
      if (!organization) {
        throw new OrganizationNotFoundError(
          dto.organizationId,
          { organizationId: dto.organizationId }
        );
      }

      // Create new user through domain factory method
      const user = UserAggregate.register(email, organizationId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        timezone: dto.timezone,
        language: dto.language
      });

      // Add user to organization with specified role
      organization.addMember(user.getId(), assignedRole, organization.ownerId);

      // Save user and organization
      await Promise.all([
        this.userRepository.save(user),
        this.organizationRepository.save(organization)
      ]);

      return {
        success: true,
        user: UserMapper.toDTO(user, organization)
      };

    } catch (error) {
      if (error instanceof DuplicateResourceError || 
          error instanceof BusinessRuleViolationError ||
          error instanceof OrganizationNotFoundError) {
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