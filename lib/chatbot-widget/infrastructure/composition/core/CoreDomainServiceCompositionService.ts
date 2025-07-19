// Specialized composition services
import { SessionManagementCompositionService } from './SessionManagementCompositionService';
import { ContentProcessingCompositionService } from './ContentProcessingCompositionService';
import { LeadManagementCompositionService } from './LeadManagementCompositionService';
import { CoreUtilityCompositionService } from './CoreUtilityCompositionService';

// Domain service interfaces for passthrough
import { ITokenCountingService } from '../../../domain/services/interfaces/ITokenCountingService';

// Domain services for return types
import { SessionContextService } from '../../../domain/services/session-management/SessionContextService';
import { SessionStateService } from '../../../domain/services/session-management/SessionStateService';
import { ChatSessionValidationService } from '../../../domain/services/session-management/ChatSessionValidationService';
import { SessionLeadQualificationService } from '../../../domain/services/session-management/SessionLeadQualificationService';
import { ContextWindowService } from '../../../domain/services/utilities/ContextWindowService';
import { EntityAccumulationService } from '../../../domain/services/context/EntityAccumulationService';
import { LeadExtractionService } from '../../../domain/services/lead-management/LeadExtractionService';
import { KnowledgeBaseFormService } from '../../../domain/services/knowledge-processing/KnowledgeBaseFormService';
import { UserContentSanitizationService } from '../../../domain/services/content-processing/UserContentSanitizationService';
import { ContentValidationService } from '../../../domain/services/content-processing/ContentValidationService';
import { ContentLengthValidationService } from '../../../domain/services/content-processing/ContentLengthValidationService';
import { ContentTypeValidationService } from '../../../domain/services/content-processing/ContentTypeValidationService';

/**
 * Core Domain Service Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Unified facade for all specialized core domain composition services
 * - Follow @golden-rule domain service composition patterns
 * - Delegates to specialized composition services for single responsibility
 * - Provides unified interface for backward compatibility
 * - Keep under 250 lines - focused on delegation only
 * - Never return null - always provide valid service instances
 * - Maintains clean separation of concerns across specialized services
 */
export class CoreDomainServiceCompositionService {
  // ===== SESSION MANAGEMENT SERVICE DELEGATION =====

  /** Get Session Context Service */
  static getSessionContextService(): SessionContextService {
    return SessionManagementCompositionService.getSessionContextService();
  }

  /** Get Session State Service */
  static getSessionStateService(): SessionStateService {
    return SessionManagementCompositionService.getSessionStateService();
  }

  /** Get Chat Session Validation Service */
  static getChatSessionValidationService(): typeof ChatSessionValidationService {
    return SessionManagementCompositionService.getChatSessionValidationService();
  }

  /** Get Session Lead Qualification Service */
  static getSessionLeadQualificationService(): typeof SessionLeadQualificationService {
    return SessionManagementCompositionService.getSessionLeadQualificationService();
  }

  // ===== CORE UTILITY SERVICE DELEGATION =====

  /** Get Context Window Service */
  static getContextWindowService(tokenCountingService?: ITokenCountingService): ContextWindowService {
    return CoreUtilityCompositionService.getContextWindowService(tokenCountingService);
  }

  /** Get Entity Accumulation Service */
  static getEntityAccumulationService(): typeof EntityAccumulationService {
    return CoreUtilityCompositionService.getEntityAccumulationService();
  }

  // ===== LEAD MANAGEMENT SERVICE DELEGATION =====

  /** Get Lead Extraction Service */
  static getLeadExtractionService(): LeadExtractionService {
    return LeadManagementCompositionService.getLeadExtractionService();
  }

  /** Get Knowledge Base Form Service */
  static getKnowledgeBaseFormService(): KnowledgeBaseFormService {
    return LeadManagementCompositionService.getKnowledgeBaseFormService();
  }

  // ===== CONTENT PROCESSING SERVICE DELEGATION =====

  /** Get User Content Sanitization Service */
  static getUserContentSanitizationService(): UserContentSanitizationService {
    return ContentProcessingCompositionService.getUserContentSanitizationService();
  }

  /** Get Content Validation Service */
  static getContentValidationService(): ContentValidationService {
    return ContentProcessingCompositionService.getContentValidationService();
  }

  /** Get Content Length Validation Service */
  static getContentLengthValidationService(): ContentLengthValidationService {
    return ContentProcessingCompositionService.getContentLengthValidationService();
  }

  /** Get Content Type Validation Service */
  static getContentTypeValidationService(): ContentTypeValidationService {
    return ContentProcessingCompositionService.getContentTypeValidationService();
  }

  // ===== CACHE MANAGEMENT METHODS =====

  /**
   * Clear all cached domain service instances
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset for testing scenarios
   * - Delegate to all specialized composition services
   * - Follow @golden-rule testing support patterns
   */
  static clearCache(): void {
    SessionManagementCompositionService.clearCache();
    ContentProcessingCompositionService.clearCache();
    LeadManagementCompositionService.clearCache();
    CoreUtilityCompositionService.clearCache();
  }

  /**
   * Get Domain Service Statistics
   * 
   * AI INSTRUCTIONS:
   * - Aggregate statistics from all specialized composition services
   * - Follow @golden-rule monitoring and observability patterns
   * - Provide comprehensive service health overview
   */
  static getServiceStatistics(): {
    sessionManagement: ReturnType<typeof SessionManagementCompositionService.getServiceStatistics>;
    contentProcessing: ReturnType<typeof ContentProcessingCompositionService.getServiceStatistics>;
    leadManagement: ReturnType<typeof LeadManagementCompositionService.getServiceStatistics>;
    coreUtility: ReturnType<typeof CoreUtilityCompositionService.getServiceStatistics>;
    totalServicesInitialized: number;
    totalServices: number;
  } {
    const sessionStats = SessionManagementCompositionService.getServiceStatistics();
    const contentStats = ContentProcessingCompositionService.getServiceStatistics();
    const leadStats = LeadManagementCompositionService.getServiceStatistics();
    const utilityStats = CoreUtilityCompositionService.getServiceStatistics();
    
    return {
      sessionManagement: sessionStats,
      contentProcessing: contentStats,
      leadManagement: leadStats,
      coreUtility: utilityStats,
      totalServicesInitialized: sessionStats.servicesInitialized + 
                                contentStats.servicesInitialized + 
                                leadStats.servicesInitialized + 
                                utilityStats.servicesInitialized,
      totalServices: sessionStats.totalServices + 
                    contentStats.totalServices + 
                    leadStats.totalServices + 
                    utilityStats.totalServices
    };
  }

  /** Health check for all core domain services */
  static async healthCheck(): Promise<{
    sessionManagement: Awaited<ReturnType<typeof SessionManagementCompositionService.healthCheck>>;
    contentProcessing: Awaited<ReturnType<typeof ContentProcessingCompositionService.healthCheck>>;
    leadManagement: Awaited<ReturnType<typeof LeadManagementCompositionService.healthCheck>>;
    coreUtility: Awaited<ReturnType<typeof CoreUtilityCompositionService.healthCheck>>;
    overall: boolean;
  }> {
    const [sessionHealth, contentHealth, leadHealth, utilityHealth] = await Promise.all([
      SessionManagementCompositionService.healthCheck(),
      ContentProcessingCompositionService.healthCheck(),
      LeadManagementCompositionService.healthCheck(),
      CoreUtilityCompositionService.healthCheck()
    ]);

    const overall = sessionHealth.overall && 
                   contentHealth.overall && 
                   leadHealth.overall && 
                   utilityHealth.overall;

    return {
      sessionManagement: sessionHealth,
      contentProcessing: contentHealth,
      leadManagement: leadHealth,
      coreUtility: utilityHealth,
      overall
    };
  }
}