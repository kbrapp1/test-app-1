/**
 * Switch Organization Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate organization switching workflow
 * - Match current organization selector functionality
 * - Keep simple - essential coordination only
 * - Focus on business validation and state updates
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserAggregate } from '../../domain/aggregates/UserAggregate';
import { UserId } from '../../domain/value-objects/UserId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { 
  UserNotFoundError,
  BusinessRuleViolationError 
} from '../../domain/errors/AuthDomainError';
import { UserDTO } from '../dto/UserDTO';
import { UserMapper } from '../mappers/UserMapper';

export interface SwitchOrganizationDTO {
  userId: string;
  targetOrganizationId: string;
}

export interface SwitchOrganizationResult {
  success: boolean;
  user?: UserDTO;
  error?: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
}

export class SwitchOrganizationUseCase {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(dto: SwitchOrganizationDTO): Promise<SwitchOrganizationResult> {
    try {
      // Convert DTO to domain value objects
      const userId = UserId.create(dto.userId);
      const targetOrganizationId = OrganizationId.create(dto.targetOrganizationId);

      // Find user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundError(
          dto.userId,
          { userId: dto.userId }
        );
      }

      // Switch organization (domain logic handles validation)
      user.switchOrganization(targetOrganizationId);

      // Save user with new organization context
      await this.userRepository.save(user);

      return {
        success: true,
        user: UserMapper.toDTOWithoutOrg(user)
      };

    } catch (error) {
      if (error instanceof UserNotFoundError || 
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