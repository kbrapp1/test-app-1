/**
 * Knowledge Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for knowledge validation business logic
 * - Contains business rules for input validation
 * - No external dependencies
 * - Encapsulates validation business logic
 */

export class KnowledgeValidationService {
  /**
   * Validate category parameter with business rules
   */
  public validateCategory(category: string, organizationId: string): void {
    if (!category?.trim()) {
      throw new Error(
        `Category is required for knowledge retrieval. Organization: ${organizationId}`
      );
    }

    // Business rule: Category length limits
    if (category.trim().length > 100) {
      throw new Error(
        `Category name too long (max 100 characters). Organization: ${organizationId}`
      );
    }

    // Business rule: Category format validation
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(category.trim())) {
      throw new Error(
        `Category contains invalid characters. Use only letters, numbers, spaces, hyphens, and underscores. Organization: ${organizationId}`
      );
    }
  }

  /**
   * Validate tags parameter with business rules
   */
  public validateTags(tags: string[], organizationId: string): void {
    if (!tags || tags.length === 0) {
      throw new Error(
        `At least one tag is required for knowledge retrieval. Organization: ${organizationId}`
      );
    }

    // Business rule: Maximum number of tags
    if (tags.length > 20) {
      throw new Error(
        `Too many tags (max 20). Organization: ${organizationId}`
      );
    }

    // Business rule: Validate each tag
    tags.forEach((tag, index) => {
      if (!tag?.trim()) {
        throw new Error(
          `Tag at index ${index} is empty. Organization: ${organizationId}`
        );
      }

      if (tag.trim().length > 50) {
        throw new Error(
          `Tag "${tag}" is too long (max 50 characters). Organization: ${organizationId}`
        );
      }

      if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag.trim())) {
        throw new Error(
          `Tag "${tag}" contains invalid characters. Use only letters, numbers, spaces, hyphens, and underscores. Organization: ${organizationId}`
        );
      }
    });

    // Business rule: Check for duplicate tags
    const uniqueTags = new Set(tags.map(tag => tag.trim().toLowerCase()));
    if (uniqueTags.size !== tags.length) {
      throw new Error(
        `Duplicate tags found. Organization: ${organizationId}`
      );
    }
  }

  /**
   * Validate source type parameter with business rules
   */
  public validateSourceType(sourceType: string, organizationId: string): void {
    if (!sourceType?.trim()) {
      throw new Error(
        `Source type is required for knowledge deletion. Organization: ${organizationId}`
      );
    }

    // Business rule: Source type length limits
    if (sourceType.trim().length > 50) {
      throw new Error(
        `Source type too long (max 50 characters). Organization: ${organizationId}`
      );
    }

    // Business rule: Valid source types
    const validSourceTypes = [
      'website', 'document', 'api', 'manual', 'import', 
      'csv', 'json', 'xml', 'pdf', 'text', 'markdown'
    ];

    if (!validSourceTypes.includes(sourceType.trim().toLowerCase())) {
      throw new Error(
        `Invalid source type "${sourceType}". Valid types: ${validSourceTypes.join(', ')}. Organization: ${organizationId}`
      );
    }
  }

  /**
   * Validate source URL parameter with business rules
   */
  public validateSourceUrl(sourceUrl: string, organizationId: string): void {
    if (!sourceUrl?.trim()) {
      return; // Source URL is optional
    }

    // Business rule: URL length limits
    if (sourceUrl.trim().length > 2000) {
      throw new Error(
        `Source URL too long (max 2000 characters). Organization: ${organizationId}`
      );
    }

    // Business rule: Basic URL format validation
    try {
      new URL(sourceUrl.trim());
    } catch {
      throw new Error(
        `Invalid source URL format. Organization: ${organizationId}`
      );
    }
  }

  /**
   * Validate organization ID with business rules
   */
  public validateOrganizationId(organizationId: string): void {
    if (!organizationId?.trim()) {
      throw new Error('Organization ID is required for all knowledge operations');
    }

    // Business rule: Organization ID format validation
    if (!/^[a-zA-Z0-9\-_]+$/.test(organizationId.trim())) {
      throw new Error('Organization ID contains invalid characters');
    }

    // Business rule: Organization ID length limits
    if (organizationId.trim().length < 3 || organizationId.trim().length > 50) {
      throw new Error('Organization ID must be between 3 and 50 characters');
    }
  }

  /**
   * Validate chatbot config ID with business rules
   */
  public validateChatbotConfigId(chatbotConfigId: string, organizationId: string): void {
    if (!chatbotConfigId?.trim()) {
      throw new Error(
        `Chatbot config ID is required for knowledge operations. Organization: ${organizationId}`
      );
    }

    // Business rule: Chatbot config ID format validation
    if (!/^[a-zA-Z0-9\-_]+$/.test(chatbotConfigId.trim())) {
      throw new Error(
        `Chatbot config ID contains invalid characters. Organization: ${organizationId}`
      );
    }

    // Business rule: Chatbot config ID length limits
    if (chatbotConfigId.trim().length < 3 || chatbotConfigId.trim().length > 50) {
      throw new Error(
        `Chatbot config ID must be between 3 and 50 characters. Organization: ${organizationId}`
      );
    }
  }

  /**
   * Validate shared log file parameter with business rules
   */
  public validateSharedLogFile(sharedLogFile: string | undefined, organizationId: string): void {
    if (!sharedLogFile?.trim()) {
      throw new Error(
        `SharedLogFile is required for knowledge management operations - all logging must be conversation-specific. Organization: ${organizationId}`
      );
    }

    // Business rule: Log file name format validation
    if (!/^[a-zA-Z0-9\-_\.]+\.log$/.test(sharedLogFile.trim())) {
      throw new Error(
        `Invalid shared log file format. Must end with .log and contain only alphanumeric characters, hyphens, underscores, and dots. Organization: ${organizationId}`
      );
    }

    // Business rule: Log file name length limits
    if (sharedLogFile.trim().length > 100) {
      throw new Error(
        `Shared log file name too long (max 100 characters). Organization: ${organizationId}`
      );
    }
  }

  /**
   * Validate limit parameter with business rules
   */
  public validateLimit(limit: number | undefined, organizationId: string): void {
    if (limit === undefined) {
      return; // Limit is optional
    }

    // Business rule: Limit range validation
    if (limit <= 0) {
      throw new Error(
        `Limit must be positive. Organization: ${organizationId}`
      );
    }

    if (limit > 10000) {
      throw new Error(
        `Limit too large (max 10000). Organization: ${organizationId}`
      );
    }
  }

  /**
   * Validate all common parameters for knowledge operations
   */
  public validateCommonParameters(
    organizationId: string,
    chatbotConfigId: string,
    sharedLogFile?: string
  ): void {
    this.validateOrganizationId(organizationId);
    this.validateChatbotConfigId(chatbotConfigId, organizationId);
    
    if (sharedLogFile !== undefined) {
      this.validateSharedLogFile(sharedLogFile, organizationId);
    }
  }
}