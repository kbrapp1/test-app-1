// Domain services imports
import { LeadExtractionService } from '../../../domain/services/lead-management/LeadExtractionService';
import { KnowledgeBaseFormService } from '../../../domain/services/knowledge-processing/KnowledgeBaseFormService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Lead Management Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Centralized factory for lead management domain services
 * - Follow @golden-rule domain service composition patterns
 * - Singleton pattern for stateless domain services only
 * - Provide error handling for all service initialization
 * - Single responsibility: Lead management service instantiation
 * - Keep under 250 lines - focused on lead management concerns only
 * - Never return null - always provide valid service instances
 */
export class LeadManagementCompositionService {
  // ===== SINGLETON INSTANCES FOR STATELESS DOMAIN SERVICES =====
  
  private static leadExtractionService: LeadExtractionService | null = null;
  private static knowledgeBaseFormService: KnowledgeBaseFormService | null = null;

  // ===== DOMAIN SERVICE FACTORIES =====

  /**
   * Get Lead Extraction Service
   * 
   * AI INSTRUCTIONS:
   * - Singleton pattern for stateless domain service
   * - Follow @golden-rule domain service composition patterns
   * - Provide error handling for service initialization
   */
  static getLeadExtractionService(): LeadExtractionService {
    if (!this.leadExtractionService) {
      try {
        this.leadExtractionService = new LeadExtractionService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize lead extraction service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.leadExtractionService;
  }

  /** Get Knowledge Base Form Service */
  static getKnowledgeBaseFormService(): KnowledgeBaseFormService {
    if (!this.knowledgeBaseFormService) {
      try {
        this.knowledgeBaseFormService = new KnowledgeBaseFormService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize knowledge base form service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.knowledgeBaseFormService;
  }

  // ===== CACHE MANAGEMENT METHODS =====

  /**
   * Clear all cached lead management service instances
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset for testing scenarios
   * - Follow @golden-rule testing support patterns
   * - Reset all singleton instances
   */
  static clearCache(): void {
    this.leadExtractionService = null;
    this.knowledgeBaseFormService = null;
  }

  /**
   * Get Lead Management Service Statistics
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule monitoring and observability patterns
   * - Provide insights into service initialization state
   * - Help with debugging and health checks
   */
  static getServiceStatistics(): {
    leadExtractionServiceInitialized: boolean;
    knowledgeBaseFormServiceInitialized: boolean;
    servicesInitialized: number;
    totalServices: number;
  } {
    const initialized = [
      this.leadExtractionService !== null,
      this.knowledgeBaseFormService !== null
    ];
    
    return {
      leadExtractionServiceInitialized: this.leadExtractionService !== null,
      knowledgeBaseFormServiceInitialized: this.knowledgeBaseFormService !== null,
      servicesInitialized: initialized.filter(Boolean).length,
      totalServices: initialized.length
    };
  }

  /** Health check for all lead management services */
  static async healthCheck(): Promise<{
    leadExtractionService: boolean;
    knowledgeBaseFormService: boolean;
    overall: boolean;
  }> {
    const results = {
      leadExtractionService: false,
      knowledgeBaseFormService: false,
      overall: false
    };

    try {
      const leadExtractionService = this.getLeadExtractionService();
      results.leadExtractionService = !!leadExtractionService;
    } catch {
      // Service failed to initialize
    }

    try {
      const knowledgeBaseFormService = this.getKnowledgeBaseFormService();
      results.knowledgeBaseFormService = !!knowledgeBaseFormService;
    } catch {
      // Service failed to initialize
    }

    results.overall = Object.values(results).slice(0, -1).every(Boolean);

    return results;
  }
}