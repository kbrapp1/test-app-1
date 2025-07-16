import { createClient } from '@supabase/supabase-js';
import { ManageGenerationStatusUseCase } from '../../application/use-cases/ManageGenerationStatusUseCase';
import { StatusManagementService } from '../../application/services/StatusManagementService';
import { StatusCheckingSupabaseRepository } from '../persistence/supabase/StatusCheckingSupabaseRepository';
import { ExternalProviderStatusService } from '../providers/ExternalProviderStatusService';

/**
 * Status Management Factory
 * Single Responsibility: Wire up all dependencies for status management
 * Infrastructure Layer - Dependency injection and configuration
 */
export class StatusManagementFactory {
  
  /**
   * Create a fully configured status management use case
   * Production configuration with real Supabase and external providers
   */
  static createProductionUseCase(
    supabaseUrl: string,
    supabaseServiceRoleKey: string,
    replicateApiToken?: string
  ): ManageGenerationStatusUseCase {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Create repository
    const repository = new StatusCheckingSupabaseRepository(supabase);
    
    // Create provider service with configuration
    const providerService = new ExternalProviderStatusService([
      {
        name: 'replicate',
        baseUrl: 'https://api.replicate.com/v1',
        apiKey: replicateApiToken || process.env.REPLICATE_API_TOKEN || '',
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000
      }
    ]);
    
    // Create application service
    const statusManagementService = new StatusManagementService(
      repository,
      providerService
    );
    
    // Create and return use case
    return new ManageGenerationStatusUseCase(statusManagementService);
  }

  /**
   * Create use case for testing with mock dependencies
   * Test configuration for unit and integration tests
   */
  static createTestUseCase(
    mockRepository: StatusCheckingSupabaseRepository,
    mockProviderService?: ExternalProviderStatusService
  ): ManageGenerationStatusUseCase {
    const providerService = mockProviderService || new ExternalProviderStatusService([]);
    
    const statusManagementService = new StatusManagementService(
      mockRepository,
      providerService
    );
    
    return new ManageGenerationStatusUseCase(statusManagementService);
  }

  /**
   * Create development use case with local configuration
   * Development configuration with environment-based settings
   */
  static createDevelopmentUseCase(): ManageGenerationStatusUseCase {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    return this.createProductionUseCase(
      supabaseUrl,
      supabaseServiceKey,
      process.env.REPLICATE_API_TOKEN
    );
  }

  /**
   * Create repository only for specific use cases
   * Useful when you only need database access
   */
  static createRepository(
    supabaseUrl: string,
    supabaseServiceRoleKey: string
  ): StatusCheckingSupabaseRepository {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    return new StatusCheckingSupabaseRepository(supabase);
  }

  /**
   * Create provider service only for specific use cases
   * Useful when you only need external provider integration
   */
  static createProviderService(
    replicateApiToken?: string
  ): ExternalProviderStatusService {
    return new ExternalProviderStatusService([
      {
        name: 'replicate',
        baseUrl: 'https://api.replicate.com/v1',
        apiKey: replicateApiToken || process.env.REPLICATE_API_TOKEN || '',
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000
      }
    ]);
  }

  /**
   * Create application service only for specific use cases
   * Useful for testing application logic without full use case
   */
  static createStatusManagementService(
    repository: StatusCheckingSupabaseRepository,
    providerService: ExternalProviderStatusService
  ): StatusManagementService {
    return new StatusManagementService(repository, providerService);
  }

  /**
   * Health check for all dependencies
   * Verify all services are properly configured
   */
  static async healthCheck(useCase: ManageGenerationStatusUseCase): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Test basic use case functionality
      const testResult = await useCase.unifiedStatusCheck('test-user', 'test-org', {
        specificGenerationIds: []
      });

      if (!testResult) {
        errors.push('Use case returned null result');
      }

    } catch (error) {
      errors.push(`Use case health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      success: errors.length === 0,
      errors
    };
  }
} 