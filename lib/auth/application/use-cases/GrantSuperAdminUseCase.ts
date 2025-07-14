/**
 * Grant Super Admin Use Case - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate super admin access granting workflow
 * - Coordinate domain services and repositories
 * - Handle cross-aggregate operations
 * - Single responsibility: Grant super admin access
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { SuperAdminDomainService } from '../../domain/services/SuperAdminDomainService';
import { UserId } from '../../domain/value-objects/UserId';
import { 
  UserNotFoundError
} from '../../domain/errors/AuthDomainError';

export interface GrantSuperAdminRequest {
  targetUserId: string;
  grantedByUserId: string;
  reason?: string;
}

export interface GrantSuperAdminResponse {
  success: boolean;
  targetUserId: string;
  grantedByUserId: string;
  grantedAt: Date;
  reason?: string;
}

export class GrantSuperAdminUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly superAdminDomainService: SuperAdminDomainService
  ) {}

  async execute(request: GrantSuperAdminRequest): Promise<GrantSuperAdminResponse> {
    const targetUserId = UserId.create(request.targetUserId);
    const grantedByUserId = UserId.create(request.grantedByUserId);

    // Find both users
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new UserNotFoundError(
        request.targetUserId,
        { operation: 'grantSuperAdmin' }
      );
    }

    const grantedByUser = await this.userRepository.findById(grantedByUserId);
    if (!grantedByUser) {
      throw new UserNotFoundError(
        request.grantedByUserId,
        { operation: 'grantSuperAdmin' }
      );
    }

    // Use domain service to grant access (includes business rule validation)
    this.superAdminDomainService.grantSuperAdminAccess(targetUser, grantedByUser);

    // Save the updated user
    await this.userRepository.save(targetUser);

    const grantedAt = new Date();
    
    return {
      success: true,
      targetUserId: request.targetUserId,
      grantedByUserId: request.grantedByUserId,
      grantedAt,
      reason: request.reason
    };
  }
} 