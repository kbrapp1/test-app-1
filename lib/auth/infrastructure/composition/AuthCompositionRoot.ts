/**
 * Auth Composition Root - Dependency Injection Container
 * 
 * AI INSTRUCTIONS:
 * - Wire all auth domain dependencies properly
 * - Implement singleton pattern for composition root
 * - Ensure lazy initialization of dependencies
 * - Keep under 200 lines following @golden-rule
 * - Only include components that actually exist
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

// Domain Layer
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { AuthenticationDomainService } from '../../domain/services/AuthenticationDomainService';
import { PermissionService } from '../../domain/services/PermissionService';
import { TokenService } from '../../domain/services/TokenService';
import { SuperAdminDomainService } from '../../domain/services/SuperAdminDomainService';

// Use Cases
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { SwitchOrganizationUseCase } from '../../application/use-cases/SwitchOrganizationUseCase';
import { ChangeUserRoleUseCase } from '../../application/use-cases/ChangeUserRoleUseCase';
import { GrantSuperAdminUseCase } from '../../application/use-cases/GrantSuperAdminUseCase';
import { RevokeSuperAdminUseCase } from '../../application/use-cases/RevokeSuperAdminUseCase';

// Application Services
import { SuperAdminApplicationService } from '../../application/services/SuperAdminApplicationService';

// Infrastructure Layer
import { UserRepository } from '../persistence/supabase/UserRepository';
import { SupabaseOrganizationRepository } from '../persistence/supabase/OrganizationRepository';
import { ProfileRepository } from '../persistence/supabase/ProfileRepository';
import { OnboardingService } from '../services/OnboardingService';
import { OrganizationQueryService } from '../services/OrganizationQueryService';
import { OrganizationMemberService } from '../services/OrganizationMemberService';

// Adapters
import { SupabaseAuthAdapter } from '../adapters/SupabaseAuthAdapter';
import { JwtTokenAdapter } from '../adapters/JwtTokenAdapter';
import { DatabaseUserAdapter } from '../adapters/DatabaseUserAdapter';
import { OnboardingAdapter } from '../adapters/OnboardingAdapter';

/**
 * Auth Composition Root - Singleton dependency injection container
 */
export class AuthCompositionRoot {
  private static instance: AuthCompositionRoot;
  private supabase: SupabaseClient;

  // Repository instances
  private _userRepository?: IUserRepository;
  private _organizationRepository?: IOrganizationRepository;
  private _profileRepository?: IProfileRepository;

  // Service instances
  private _onboardingService?: OnboardingService;
  private _organizationQueryService?: OrganizationQueryService;
  private _organizationMemberService?: OrganizationMemberService;
  private _superAdminDomainService?: SuperAdminDomainService;
  private _superAdminApplicationService?: SuperAdminApplicationService;

  // Adapter instances
  private _supabaseAuthAdapter?: SupabaseAuthAdapter;
  private _jwtTokenAdapter?: JwtTokenAdapter;
  private _databaseUserAdapter?: DatabaseUserAdapter;
  private _onboardingAdapter?: OnboardingAdapter;

  private constructor() {
    this.supabase = createClient();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthCompositionRoot {
    if (!AuthCompositionRoot.instance) {
      AuthCompositionRoot.instance = new AuthCompositionRoot();
    }
    return AuthCompositionRoot.instance;
  }

  // Repository Factories
  public getUserRepository(): IUserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository(this.supabase);
    }
    return this._userRepository;
  }

  public getOrganizationRepository(): IOrganizationRepository {
    if (!this._organizationRepository) {
      this._organizationRepository = new SupabaseOrganizationRepository(this.supabase);
    }
    return this._organizationRepository;
  }

  public getProfileRepository(): IProfileRepository {
    if (!this._profileRepository) {
      this._profileRepository = new ProfileRepository(this.supabase);
    }
    return this._profileRepository;
  }

  // Domain Service Factories (static classes)
  public getAuthenticationDomainService(): typeof AuthenticationDomainService {
    return AuthenticationDomainService;
  }

  public getPermissionService(): typeof PermissionService {
    return PermissionService;
  }

  public getTokenService(): typeof TokenService {
    return TokenService;
  }

  // Infrastructure Service Factories
  public getOnboardingService(): OnboardingService {
    if (!this._onboardingService) {
      this._onboardingService = new OnboardingService(this.supabase);
    }
    return this._onboardingService;
  }

  public getOrganizationQueryService(): OrganizationQueryService {
    if (!this._organizationQueryService) {
      this._organizationQueryService = new OrganizationQueryService(this.supabase);
    }
    return this._organizationQueryService;
  }

  public getOrganizationMemberService(): OrganizationMemberService {
    if (!this._organizationMemberService) {
      this._organizationMemberService = new OrganizationMemberService(this.supabase);
    }
    return this._organizationMemberService;
  }

  // Adapter Factories
  public getSupabaseAuthAdapter(): SupabaseAuthAdapter {
    if (!this._supabaseAuthAdapter) {
      this._supabaseAuthAdapter = new SupabaseAuthAdapter(this.supabase);
    }
    return this._supabaseAuthAdapter;
  }

  public getJwtTokenAdapter(): JwtTokenAdapter {
    if (!this._jwtTokenAdapter) {
      this._jwtTokenAdapter = new JwtTokenAdapter(this.supabase);
    }
    return this._jwtTokenAdapter;
  }

  public getDatabaseUserAdapter(): DatabaseUserAdapter {
    if (!this._databaseUserAdapter) {
      this._databaseUserAdapter = new DatabaseUserAdapter(this.supabase);
    }
    return this._databaseUserAdapter;
  }

  public getOnboardingAdapter(): OnboardingAdapter {
    if (!this._onboardingAdapter) {
      this._onboardingAdapter = new OnboardingAdapter(this.supabase);
    }
    return this._onboardingAdapter;
  }

  // Use Case Factories
  public getLoginUserUseCase(): LoginUserUseCase {
    return new LoginUserUseCase(
      this.getUserRepository()
    );
  }

  public getRegisterUserUseCase(): RegisterUserUseCase {
    return new RegisterUserUseCase(
      this.getUserRepository(),
      this.getOrganizationRepository()
    );
  }

  public getSwitchOrganizationUseCase(): SwitchOrganizationUseCase {
    return new SwitchOrganizationUseCase(
      this.getUserRepository()
    );
  }

  public getChangeUserRoleUseCase(): ChangeUserRoleUseCase {
    return new ChangeUserRoleUseCase(
      this.getUserRepository(),
      this.getOrganizationRepository()
    );
  }

  public getSuperAdminDomainService(): SuperAdminDomainService {
    if (!this._superAdminDomainService) {
      this._superAdminDomainService = new SuperAdminDomainService();
    }
    return this._superAdminDomainService;
  }

  public getSuperAdminApplicationService(): SuperAdminApplicationService {
    if (!this._superAdminApplicationService) {
      this._superAdminApplicationService = new SuperAdminApplicationService(
        this.getUserRepository(),
        this.getOrganizationRepository(),
        this.getSuperAdminDomainService()
      );
    }
    return this._superAdminApplicationService;
  }

  public getGrantSuperAdminUseCase(): GrantSuperAdminUseCase {
    return new GrantSuperAdminUseCase(
      this.getUserRepository(),
      this.getSuperAdminDomainService()
    );
  }

  public getRevokeSuperAdminUseCase(): RevokeSuperAdminUseCase {
    return new RevokeSuperAdminUseCase(
      this.getUserRepository(),
      this.getSuperAdminDomainService()
    );
  }

  /**
   * Reset all instances (useful for testing)
   */
  public static reset(): void {
    AuthCompositionRoot.instance = new AuthCompositionRoot();
  }
}

// Convenience factory functions for common use cases
export const getLoginUserUseCase = () => AuthCompositionRoot.getInstance().getLoginUserUseCase();
export const getRegisterUserUseCase = () => AuthCompositionRoot.getInstance().getRegisterUserUseCase();
export const getSwitchOrganizationUseCase = () => AuthCompositionRoot.getInstance().getSwitchOrganizationUseCase();
export const getChangeUserRoleUseCase = () => AuthCompositionRoot.getInstance().getChangeUserRoleUseCase();
export const getGrantSuperAdminUseCase = () => AuthCompositionRoot.getInstance().getGrantSuperAdminUseCase();
export const getRevokeSuperAdminUseCase = () => AuthCompositionRoot.getInstance().getRevokeSuperAdminUseCase();
export const getSuperAdminApplicationService = () => AuthCompositionRoot.getInstance().getSuperAdminApplicationService(); 