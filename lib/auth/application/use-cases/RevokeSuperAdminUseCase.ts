/**
 * Revoke Super Admin Use Case - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate super admin access revocation workflow
 * - Coordinate domain services and repositories
 * - Handle cross-aggregate operations
 * - Single responsibility: Revoke super admin access
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { SuperAdminDomainService } from '../../domain/services/SuperAdminDomainService';
import { UserId } from '../../domain/value-objects/UserId';
import { 
  BusinessRuleViolationError, 
  UserNotFoundError,
  InsufficientPermissionsError 
} from '../../domain/errors/AuthDomainError';

export interface RevokeSuperAdminRequest {
  targetUserId: string;
  revokedByUserId: string;
  reason?: string;
}

export interface RevokeSuperAdminResponse {
  success: boolean;
  targetUserId: string;
  revokedByUserId: string;
  revokedAt: Date;
  reason?: string;
}

export class RevokeSuperAdminUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly superAdminDomainService: SuperAdminDomainService
  ) {}

  async execute(request: RevokeSuperAdminRequest): Promise<RevokeSuperAdminResponse> {
    const targetUserId = UserId.create(request.targetUserId);
    const revokedByUserId = UserId.create(request.revokedByUserId);

    // Find both users
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new UserNotFoundError(
        request.targetUserId,
        { operation: 'revokeSuperAdmin' }
      );
    }

    const revokedByUser = await this.userRepository.findById(revokedByUserId);
    if (!revokedByUser) {
      throw new UserNotFoundError(
        request.revokedByUserId,
        { operation: 'revokeSuperAdmin' }
      );
    }

    // Use domain service to revoke access (includes business rule validation)
    this.superAdminDomainService.revokeSuperAdminAccess(targetUser, revokedByUser);

    // Save the updated user
    await this.userRepository.save(targetUser);

    const revokedAt = new Date();
    
    return {
      success: true,
      targetUserId: request.targetUserId,
      revokedByUserId: request.revokedByUserId,
      revokedAt,
      reason: request.reason
    };
  }
} 