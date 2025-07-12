/**
 * Super Admin Application Service - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Coordinate super admin use cases and domain services
 * - Provide clean API for super admin operations
 * - Handle cross-aggregate coordination
 * - Single responsibility: Super admin application coordination
 */

import { GrantSuperAdminUseCase, GrantSuperAdminRequest, GrantSuperAdminResponse } from '../use-cases/GrantSuperAdminUseCase';
import { RevokeSuperAdminUseCase, RevokeSuperAdminRequest, RevokeSuperAdminResponse } from '../use-cases/RevokeSuperAdminUseCase';
import { SuperAdminDomainService } from '../../domain/services/SuperAdminDomainService';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { UserNotFoundError } from '../../domain/errors/AuthDomainError';

export interface SuperAdminContextResult {
  isSuperAdmin: boolean;
  canAccessAllOrganizations: boolean;
  canBypassOrganizationRLS: boolean;
  canTransferBetweenOrganizations: boolean;
  canInvalidateGlobalCache: boolean;
}

export interface AccessibleOrganizationsResult {
  organizations: Array<{
    id: string;
    name: string;
    memberCount: number;
    status: string;
  }>;
  totalCount: number;
  canAccessAll: boolean;
}

export class SuperAdminApplicationService {
  private readonly grantSuperAdminUseCase: GrantSuperAdminUseCase;
  private readonly revokeSuperAdminUseCase: RevokeSuperAdminUseCase;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly superAdminDomainService: SuperAdminDomainService
  ) {
    this.grantSuperAdminUseCase = new GrantSuperAdminUseCase(
      this.userRepository,
      this.superAdminDomainService
    );
    this.revokeSuperAdminUseCase = new RevokeSuperAdminUseCase(
      this.userRepository,
      this.superAdminDomainService
    );
  }

  /**
   * Grant super admin access to a user
   */
  async grantSuperAdminAccess(request: GrantSuperAdminRequest): Promise<GrantSuperAdminResponse> {
    return await this.grantSuperAdminUseCase.execute(request);
  }

  /**
   * Revoke super admin access from a user
   */
  async revokeSuperAdminAccess(request: RevokeSuperAdminRequest): Promise<RevokeSuperAdminResponse> {
    return await this.revokeSuperAdminUseCase.execute(request);
  }

  /**
   * Get super admin context for a user
   */
  async getSuperAdminContext(userId: string): Promise<SuperAdminContextResult> {
    const userIdVO = UserId.create(userId);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundError(userId, { operation: 'getSuperAdminContext' });
    }

    return this.superAdminDomainService.createSuperAdminContext(user);
  }

  /**
   * Get organizations accessible by user (with super admin bypass)
   */
  async getAccessibleOrganizations(userId: string): Promise<AccessibleOrganizationsResult> {
    const userIdVO = UserId.create(userId);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundError(userId, { operation: 'getAccessibleOrganizations' });
    }

    const allOrganizations = await this.organizationRepository.findActiveOrganizations();
    const accessibleOrgs = this.superAdminDomainService.getAccessibleOrganizations(user, allOrganizations);

    return {
      organizations: accessibleOrgs.map(org => ({
        id: org.getId().value,
        name: org.name,
        memberCount: org.memberCount,
        status: org.status
      })),
      totalCount: accessibleOrgs.length,
      canAccessAll: user.hasSuperAdminRole()
    };
  }

  /**
   * Check if user can access specific organization
   */
  async canAccessOrganization(userId: string, organizationId: string): Promise<boolean> {
    const userIdVO = UserId.create(userId);
    const orgIdVO = OrganizationId.create(organizationId);
    
    const [user, organization] = await Promise.all([
      this.userRepository.findById(userIdVO),
      this.organizationRepository.findById(orgIdVO)
    ]);

    if (!user || !organization) {
      return false;
    }

    return this.superAdminDomainService.canAccessOrganization(user, organization);
  }

  /**
   * Check if user can manage specific organization
   */
  async canManageOrganization(userId: string, organizationId: string): Promise<boolean> {
    const userIdVO = UserId.create(userId);
    const orgIdVO = OrganizationId.create(organizationId);
    
    const [user, organization] = await Promise.all([
      this.userRepository.findById(userIdVO),
      this.organizationRepository.findById(orgIdVO)
    ]);

    if (!user || !organization) {
      return false;
    }

    return this.superAdminDomainService.canManageOrganization(user, organization);
  }

  /**
   * Validate super admin operation
   */
  async validateSuperAdminOperation(userId: string, operationName: string): Promise<void> {
    const userIdVO = UserId.create(userId);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundError(userId, { operation: 'validateSuperAdminOperation' });
    }

    this.superAdminDomainService.validateSuperAdminOperation(user, operationName);
  }
} 