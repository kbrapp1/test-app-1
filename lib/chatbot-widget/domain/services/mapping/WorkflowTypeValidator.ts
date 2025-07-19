/**
 * Workflow Type Validator Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for type validation business logic
 * - Contains business rules for valid types and formats
 * - No external dependencies
 * - Encapsulates type safety business logic
 */

export class WorkflowTypeValidator {
  /**
   * Validate if value is a valid object
   */
  public isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Validate if value is a valid string
   */
  public isString(value: unknown): value is string {
    return typeof value === 'string';
  }

  /**
   * Validate if value is a valid number
   */
  public isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  /**
   * Validate if value is a valid string array
   */
  public isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
  }

  /**
   * Validate if value is a valid sentiment type
   */
  public isValidSentiment(value: unknown): value is 'positive' | 'neutral' | 'negative' {
    return typeof value === 'string' && 
           (value === 'positive' || value === 'neutral' || value === 'negative');
  }

  /**
   * Validate if value is a valid journey stage
   */
  public isValidJourneyStage(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    
    const validStages = [
      'initial', 'awareness', 'consideration', 'decision', 
      'purchase', 'support', 'advocacy', 'retention'
    ];
    
    return validStages.includes(value);
  }

  /**
   * Validate if value is a valid intent type
   */
  public isValidIntent(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    
    const validIntents = [
      'general_inquiry', 'product_question', 'support_request',
      'pricing_question', 'demo_request', 'complaint', 'compliment',
      'feature_request', 'technical_support', 'billing_question'
    ];
    
    return validIntents.includes(value);
  }

  /**
   * Validate if confidence value is in valid range
   */
  public isValidConfidence(value: unknown): value is number {
    return this.isNumber(value) && value >= 0 && value <= 1;
  }

  /**
   * Validate if progress percentage is in valid range
   */
  public isValidProgressPercentage(value: unknown): value is number {
    return this.isNumber(value) && value >= 0 && value <= 100;
  }

  /**
   * Validate if relevance score is in valid range
   */
  public isValidRelevanceScore(value: unknown): value is number {
    return this.isNumber(value) && value >= 0 && value <= 1;
  }

  /**
   * Validate if call to action type is valid
   */
  public isValidCallToActionType(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    
    const validTypes = [
      'none', 'schedule_demo', 'contact_sales', 'view_pricing',
      'download_resource', 'start_trial', 'learn_more', 'get_support'
    ];
    
    return validTypes.includes(value);
  }

  /**
   * Validate entity object structure
   */
  public isValidEntityObject(value: unknown): value is Record<string, unknown> {
    if (!this.isObject(value)) return false;
    
    // Business rule: Entity objects should have at least type or value
    return Object.keys(value).length > 0;
  }

  /**
   * Validate token usage object structure
   */
  public isValidTokenUsage(value: unknown): value is { promptTokens: number; completionTokens: number; totalTokens: number } {
    if (!this.isObject(value)) return false;
    
    const hasPromptTokens = 'prompt_tokens' in value || 'promptTokens' in value;
    const hasCompletionTokens = 'completion_tokens' in value || 'completionTokens' in value;
    const hasTotalTokens = 'total_tokens' in value || 'totalTokens' in value;
    
    return hasPromptTokens && hasCompletionTokens && hasTotalTokens;
  }
}