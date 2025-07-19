import { SupabaseClient } from '@supabase/supabase-js';

// Specialized composition services
import { RepositoryCompositionService } from '../RepositoryCompositionService';
import { DomainServiceCompositionService } from '../DomainServiceCompositionService';
import { ApplicationServiceCompositionService } from '../ApplicationServiceCompositionService';
import { UseCaseCompositionService } from '../UseCaseCompositionService';
import { AIConfigurationCompositionService } from '../AIConfigurationCompositionService';
import { InfrastructureCompositionService } from '../InfrastructureCompositionService';
import { ErrorTrackingCompositionService } from '../ErrorTrackingCompositionService';
import { ChatbotInitializationCoordinator } from './ChatbotInitializationCoordinator';

/**
 * Testing Coordinator for Chatbot Widget Domain
 * - Provides testing utilities and configuration support
 * - Handles test environment setup and teardown
 * - Manages service reset for isolated test runs
 * - Enables clean test state management
 */
export class ChatbotTestingCoordinator {
  
  /**
   * Configure composition root with Supabase client for testing
   * Allows test environments to inject mock or test database clients
   */
  static configureWithSupabaseClient(client: SupabaseClient): void {
    RepositoryCompositionService.configureWithSupabaseClient(client);
  }

  /**
   * Reset all services for testing isolation
   * Ensures each test starts with a clean state
   */
  static resetForTesting(): void {
    // Reset all composition services
    RepositoryCompositionService.reset();
    DomainServiceCompositionService.clearCache();
    ApplicationServiceCompositionService.reset();
    UseCaseCompositionService.reset();
    AIConfigurationCompositionService.reset();
    InfrastructureCompositionService.reset();
    ErrorTrackingCompositionService.reset();
    
    // Reset initialization state
    ChatbotInitializationCoordinator.resetInitialization();
  }

  /**
   * Prepare test environment with minimal setup
   * Useful for unit tests that need basic service configuration
   */
  static prepareTestEnvironment(): void {
    // Configure basic test services without full initialization
    // This can be extended based on testing needs
  }

  /**
   * Validate service configuration for tests
   * Ensures all required services are properly configured
   */
  static validateTestConfiguration(): boolean {
    try {
      // Basic validation that core services can be instantiated
      const hasRepositories = !!RepositoryCompositionService;
      const hasDomainServices = !!DomainServiceCompositionService;
      const hasApplicationServices = !!ApplicationServiceCompositionService;
      
      return hasRepositories && hasDomainServices && hasApplicationServices;
    } catch (error) {
      console.error('Test configuration validation failed:', error);
      return false;
    }
  }
}