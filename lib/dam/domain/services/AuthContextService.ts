import type { 
  IAuthContextRepository, 
  AuthContext, 
  AuthContextResult 
} from '../repositories/IAuthContextRepository';

/**
 * Domain service for authentication context
 * Provides reusable authentication logic across DAM operations
 * Uses dependency injection for clean architecture compliance
 */
export class AuthContextService {
  constructor(private readonly authRepository: IAuthContextRepository) {}

  /**
   * Gets authenticated context for DAM operations
   * @returns Promise resolving to authentication context
   * @throws Error if authentication fails
   */
  async getContext(): Promise<AuthContext> {
    const result = await this.authRepository.getAuthContext();
    
    if (!result.success || !result.context) {
      throw new Error(result.error || 'Authentication failed');
    }
    
    return result.context;
  }

  /**
   * Validates user access to organization
   * @param userId - User identifier
   * @param organizationId - Organization identifier
   * @returns Promise resolving to boolean indicating access
   */
  async validateAccess(userId: string, organizationId: string): Promise<boolean> {
    return this.authRepository.validateUserAccess(userId, organizationId);
  }

  /**
   * Gets authentication context result with error handling
   * @returns Promise resolving to authentication context result
   */
  async getContextResult(): Promise<AuthContextResult> {
    return this.authRepository.getAuthContext();
  }
} 
