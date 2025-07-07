/**
 * PromptProcessingCompositionRoot Infrastructure Service
 * 
 * AI INSTRUCTIONS:
 * - Wire all dependencies using dependency injection
 * - Implement singleton pattern and lazy initialization
 * - Follow @golden-rule composition root patterns exactly
 * - Ensure proper service lifecycle management
 * - Keep under 250 lines - focus on dependency wiring only
 * - Maintain separation between infrastructure and domain concerns
 * - Handle service creation and configuration
 */

import { UserContentSanitizationService } from '../../domain/services/content-processing/UserContentSanitizationService';
import { ContentValidationService } from '../../domain/services/content-processing/ContentValidationService';
import { ContentTypeValidationService } from '../../domain/services/content-processing/ContentTypeValidationService';
import { ContentLengthValidationService } from '../../domain/services/content-processing/ContentLengthValidationService';
import { SanitizeUserContentUseCase } from '../../application/use-cases/SanitizeUserContentUseCase';
import { ValidateContentUseCase } from '../../application/use-cases/ValidateContentUseCase';
import { PromptAssemblyApplicationService } from '../../application/services/PromptAssemblyApplicationService';
import { PromptTemplateEngine } from '../providers/templating/PromptTemplateEngine';
import { ContentMapper } from '../../application/mappers/ContentMapper';
import { KnowledgeContentSupabaseRepository } from '../persistence/supabase/KnowledgeContentSupabaseRepository';
import { IKnowledgeContentRepository } from '../../domain/repositories/IKnowledgeContentRepository';
import { ContentProcessingService } from '../persistence/supabase/services/ContentProcessingService';
import { ContentAnalyticsService } from '../persistence/supabase/services/ContentAnalyticsService';

export interface PromptProcessingServices {
  readonly userContentSanitizationService: UserContentSanitizationService;
  readonly contentValidationService: ContentValidationService;
  readonly contentTypeValidationService: ContentTypeValidationService;
  readonly contentLengthValidationService: ContentLengthValidationService;
  readonly sanitizeUserContentUseCase: SanitizeUserContentUseCase;
  readonly validateContentUseCase: ValidateContentUseCase;
  readonly promptAssemblyApplicationService: PromptAssemblyApplicationService;
  readonly promptTemplateEngine: PromptTemplateEngine;
  readonly contentMapper: ContentMapper;
  readonly knowledgeContentRepository: IKnowledgeContentRepository;
}

export class PromptProcessingCompositionRoot {
  private static instance: PromptProcessingCompositionRoot | null = null;
  private services: PromptProcessingServices | null = null;

  private constructor() {
    // AI: Private constructor for singleton pattern
  }

  // AI: Get singleton instance with lazy initialization
  static getInstance(): PromptProcessingCompositionRoot {
    if (!PromptProcessingCompositionRoot.instance) {
      PromptProcessingCompositionRoot.instance = new PromptProcessingCompositionRoot();
    }
    return PromptProcessingCompositionRoot.instance;
  }

  // AI: Get all services with lazy initialization
  getServices(): PromptProcessingServices {
    if (!this.services) {
      this.services = this.createServices();
    }
    return this.services;
  }

  // AI: Get individual services with proper dependency injection
  getUserContentSanitizationService(): UserContentSanitizationService {
    return this.getServices().userContentSanitizationService;
  }

  getContentValidationService(): ContentValidationService {
    return this.getServices().contentValidationService;
  }

  getContentTypeValidationService(): ContentTypeValidationService {
    return this.getServices().contentTypeValidationService;
  }

  getContentLengthValidationService(): ContentLengthValidationService {
    return this.getServices().contentLengthValidationService;
  }

  getSanitizeUserContentUseCase(): SanitizeUserContentUseCase {
    return this.getServices().sanitizeUserContentUseCase;
  }

  getValidateContentUseCase(): ValidateContentUseCase {
    return this.getServices().validateContentUseCase;
  }

  getPromptAssemblyApplicationService(): PromptAssemblyApplicationService {
    return this.getServices().promptAssemblyApplicationService;
  }

  getPromptTemplateEngine(): PromptTemplateEngine {
    return this.getServices().promptTemplateEngine;
  }

  getContentMapper(): ContentMapper {
    return this.getServices().contentMapper;
  }

  getKnowledgeContentRepository(): IKnowledgeContentRepository {
    return this.getServices().knowledgeContentRepository;
  }

  // AI: Reset singleton for testing purposes
  static reset(): void {
    PromptProcessingCompositionRoot.instance = null;
  }

  // AI: Create all services with proper dependency injection
  private createServices(): PromptProcessingServices {
    // AI: Create domain services first (no dependencies)
    const contentLengthValidationService = new ContentLengthValidationService();
    const contentTypeValidationService = new ContentTypeValidationService();
    const userContentSanitizationService = new UserContentSanitizationService();
    
    // AI: Create content validation service with dependencies
    const contentValidationService = new ContentValidationService();

    // AI: Create infrastructure services
    const promptTemplateEngine = new PromptTemplateEngine();
    const contentMapper = new ContentMapper();
    const contentProcessingService = new ContentProcessingService(
      userContentSanitizationService,
      contentValidationService
    );
    const contentAnalyticsService = new ContentAnalyticsService(contentProcessingService);
    const knowledgeContentRepository = new KnowledgeContentSupabaseRepository(
      undefined,
      contentProcessingService,
      contentAnalyticsService
    );

    // AI: Create application use cases with domain service dependencies
    const sanitizeUserContentUseCase = new SanitizeUserContentUseCase(
      userContentSanitizationService,
      contentValidationService
    );

    const validateContentUseCase = new ValidateContentUseCase(
      contentValidationService,
      contentLengthValidationService,
      contentTypeValidationService
    );

    // AI: Create application services with all dependencies
    const promptAssemblyApplicationService = new PromptAssemblyApplicationService(
      sanitizeUserContentUseCase,
      validateContentUseCase
    );

    return {
      userContentSanitizationService,
      contentValidationService,
      contentTypeValidationService,
      contentLengthValidationService,
      sanitizeUserContentUseCase,
      validateContentUseCase,
      promptAssemblyApplicationService,
      promptTemplateEngine,
      contentMapper,
      knowledgeContentRepository
    };
  }

  // AI: Validate service configuration and dependencies
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const services = this.getServices();
      
      // AI: Validate all services are properly instantiated
      if (!services.userContentSanitizationService) {
        errors.push('UserContentSanitizationService not initialized');
      }
      
      if (!services.contentValidationService) {
        errors.push('ContentValidationService not initialized');
      }
      
      if (!services.contentTypeValidationService) {
        errors.push('ContentTypeValidationService not initialized');
      }
      
      if (!services.contentLengthValidationService) {
        errors.push('ContentLengthValidationService not initialized');
      }
      
      if (!services.sanitizeUserContentUseCase) {
        errors.push('SanitizeUserContentUseCase not initialized');
      }
      
      if (!services.validateContentUseCase) {
        errors.push('ValidateContentUseCase not initialized');
      }
      
      if (!services.promptAssemblyApplicationService) {
        errors.push('PromptAssemblyApplicationService not initialized');
      }
      
      if (!services.promptTemplateEngine) {
        errors.push('PromptTemplateEngine not initialized');
      }
      
      if (!services.contentMapper) {
        errors.push('ContentMapper not initialized');
      }
      
      if (!services.knowledgeContentRepository) {
        errors.push('KnowledgeContentRepository not initialized');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`Service validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors
      };
    }
  }

  // AI: Get service health status for monitoring
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, 'ok' | 'error'>;
    timestamp: Date;
  } {
    const validation = this.validateConfiguration();
    const services: Record<string, 'ok' | 'error'> = {};

    try {
      const serviceInstances = this.getServices();
      
      // AI: Check each service health
      services.userContentSanitizationService = serviceInstances.userContentSanitizationService ? 'ok' : 'error';
      services.contentValidationService = serviceInstances.contentValidationService ? 'ok' : 'error';
      services.contentTypeValidationService = serviceInstances.contentTypeValidationService ? 'ok' : 'error';
      services.contentLengthValidationService = serviceInstances.contentLengthValidationService ? 'ok' : 'error';
      services.sanitizeUserContentUseCase = serviceInstances.sanitizeUserContentUseCase ? 'ok' : 'error';
      services.validateContentUseCase = serviceInstances.validateContentUseCase ? 'ok' : 'error';
      services.promptAssemblyApplicationService = serviceInstances.promptAssemblyApplicationService ? 'ok' : 'error';
      services.promptTemplateEngine = serviceInstances.promptTemplateEngine ? 'ok' : 'error';
      services.contentMapper = serviceInstances.contentMapper ? 'ok' : 'error';

      const errorCount = Object.values(services).filter(status => status === 'error').length;
      const status = errorCount === 0 ? 'healthy' : errorCount < 3 ? 'degraded' : 'unhealthy';

      return {
        status,
        services,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: { error: 'error' },
        timestamp: new Date()
      };
    }
  }
} 