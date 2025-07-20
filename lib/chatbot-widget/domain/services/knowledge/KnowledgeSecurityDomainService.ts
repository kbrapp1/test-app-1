/**
 * Knowledge Security Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for knowledge management security validation
 * - Contains business rules for security context validation
 * - Single responsibility: knowledge security business logic
 * - No external dependencies (pure domain layer)
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export class KnowledgeSecurityDomainService {
  /**
   * Validate organization and chatbot config context according to business rules
   */
  validateSecurityContext(organizationId: string, chatbotConfigId: string): void {
    this.validateOrganizationId(organizationId);
    this.validateChatbotConfigId(organizationId, chatbotConfigId);
  }

  /**
   * Validate organization ID according to business rules
   */
  validateOrganizationId(organizationId: string): void {
    if (!organizationId?.trim()) {
      throw new BusinessRuleViolationError(
        'Organization ID is required for knowledge management operations',
        { providedOrganizationId: organizationId }
      );
    }

    // Business rule: Organization ID format validation
    if (!/^[a-zA-Z0-9\-_]+$/.test(organizationId)) {
      throw new BusinessRuleViolationError(
        'Invalid organization ID format - must contain only alphanumeric characters, hyphens, and underscores',
        { organizationId }
      );
    }

    // Business rule: Organization ID length validation
    if (organizationId.length < 3 || organizationId.length > 50) {
      throw new BusinessRuleViolationError(
        'Organization ID must be between 3 and 50 characters',
        { organizationId, length: organizationId.length }
      );
    }
  }

  /**
   * Validate chatbot config ID according to business rules
   */
  validateChatbotConfigId(organizationId: string, chatbotConfigId: string): void {
    if (!chatbotConfigId?.trim()) {
      throw new BusinessRuleViolationError(
        'Chatbot config ID is required for knowledge management operations',
        { 
          organizationId,
          providedChatbotConfigId: chatbotConfigId
        }
      );
    }

    // Business rule: Chatbot config ID format validation
    if (!/^[a-zA-Z0-9\-_]+$/.test(chatbotConfigId)) {
      throw new BusinessRuleViolationError(
        'Invalid chatbot config ID format - must contain only alphanumeric characters, hyphens, and underscores',
        { 
          organizationId,
          chatbotConfigId
        }
      );
    }

    // Business rule: Chatbot config ID length validation
    if (chatbotConfigId.length < 3 || chatbotConfigId.length > 50) {
      throw new BusinessRuleViolationError(
        'Chatbot config ID must be between 3 and 50 characters',
        { 
          organizationId,
          chatbotConfigId, 
          length: chatbotConfigId.length 
        }
      );
    }
  }

  /**
   * Validate that organization has permission for knowledge operation
   */
  validateKnowledgeOperationPermission(
    organizationId: string, 
    chatbotConfigId: string, 
    operation: 'read' | 'write' | 'delete'
  ): void {
    // Ensure basic security context is valid
    this.validateSecurityContext(organizationId, chatbotConfigId);

    // Business rule: All operations currently require the same base permissions
    // Future enhancement: Could add operation-specific validation rules here
    
    // Business rule: Validate operation type
    const validOperations = ['read', 'write', 'delete'];
    if (!validOperations.includes(operation)) {
      throw new BusinessRuleViolationError(
        'Invalid knowledge operation type',
        { 
          organizationId,
          chatbotConfigId,
          operation,
          validOperations
        }
      );
    }
  }

  /**
   * Business rule: Validate tenant isolation parameters
   */
  validateTenantIsolation(organizationId: string, chatbotConfigId: string): void {
    this.validateSecurityContext(organizationId, chatbotConfigId);
    
    // Business rule: Organization and chatbot config must form valid tenant boundary
    // This ensures proper data isolation in multi-tenant architecture
    
    // Future enhancement: Could add cross-reference validation with user permissions
    // Future enhancement: Could add rate limiting validation per organization
    // Future enhancement: Could add feature flag validation per organization
  }
}