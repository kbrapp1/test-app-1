/**
 * Login User Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate basic user login workflow
 * - Match current Supabase login flow
 * - Keep simple - essential coordination only
 * - Focus on business validation after Supabase auth
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserAggregate } from '../../domain/aggregates/UserAggregate';
import { Email } from '../../domain/value-objects/Email';
import { 
  UserNotFoundError,
  InvalidCredentialsError,
  BusinessRuleViolationError 
} from '../../domain/errors/AuthDomainError';
import { UserDTO } from '../dto/UserDTO';
import { UserMapper } from '../mappers/UserMapper';

export interface LoginUserDTO {
  email: string;
  organizationId?: string;
}

export interface LoginUserResult {
  success: boolean;
  user?: UserDTO;
  error?: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
}

export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(dto: LoginUserDTO): Promise<LoginUserResult> {
    try {
      // Convert DTO to domain value objects
      const email = Email.create(dto.email);

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new UserNotFoundError(
          dto.email,
          { email: dto.email }
        );
      }

      // Validate user status
      if (user.status !== 'active') {
        throw new InvalidCredentialsError({
          email: dto.email,
          status: user.status,
          reason: 'User account is not active'
        });
      }

      // Validate email verification
      if (!user.emailVerified) {
        throw new InvalidCredentialsError({
          email: dto.email,
          emailVerified: false,
          reason: 'Email address not verified'
        });
      }

      // Record login time
      user.recordLogin();
      await this.userRepository.save(user);

      return {
        success: true,
        user: UserMapper.toDTOWithoutOrg(user)
      };

    } catch (error) {
      if (error instanceof UserNotFoundError || 
          error instanceof InvalidCredentialsError ||
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