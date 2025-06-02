import { Prompt } from '../value-objects/Prompt';

export interface CreateGenerationRequest {
  organizationId: string;
  userId: string;
  prompt: string;
  modelName?: string;
  providerName?: string;
  imageWidth?: number;
  imageHeight?: number;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export class GenerationValidator {
  private static readonly SUPPORTED_DIMENSIONS = [
    { width: 512, height: 512 },
    { width: 768, height: 768 },
    { width: 1024, height: 1024 },
    { width: 1152, height: 896 },
    { width: 896, height: 1152 },
    { width: 1216, height: 832 },
    { width: 832, height: 1216 },
    { width: 1344, height: 768 },
    { width: 768, height: 1344 },
    { width: 1536, height: 640 },
    { width: 640, height: 1536 }
  ];

  private static readonly SUPPORTED_MODELS = [
    'flux-1-kontext-pro',
    'flux-1-kontext-max'
  ];

  private static readonly SUPPORTED_PROVIDERS = [
    'replicate'
  ];

  private static readonly MAX_GENERATIONS_PER_HOUR = 10;
  private static readonly MAX_GENERATIONS_PER_DAY = 50;

  static validateCreationRequest(data: CreateGenerationRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!data.organizationId || typeof data.organizationId !== 'string') {
      errors.push('Organization ID is required and must be a string');
    }

    if (!data.userId || typeof data.userId !== 'string') {
      errors.push('User ID is required and must be a string');
    }

    if (!data.prompt || typeof data.prompt !== 'string') {
      errors.push('Prompt is required and must be a string');
    }

    // Validate prompt using Prompt value object
    if (data.prompt) {
      const promptValidation = this.validatePrompt(data.prompt);
      if (!promptValidation.isValid) {
        errors.push(...promptValidation.errors);
      }
    }

    // Validate optional fields
    if (data.modelName && !this.SUPPORTED_MODELS.includes(data.modelName)) {
      errors.push(`Unsupported model: ${data.modelName}. Supported models: ${this.SUPPORTED_MODELS.join(', ')}`);
    }

    if (data.providerName && !this.SUPPORTED_PROVIDERS.includes(data.providerName)) {
      errors.push(`Unsupported provider: ${data.providerName}. Supported providers: ${this.SUPPORTED_PROVIDERS.join(', ')}`);
    }

    // Validate image dimensions
    if (data.imageWidth !== undefined || data.imageHeight !== undefined) {
      const dimensionValidation = this.validateImageDimensions(
        data.imageWidth || 1024,
        data.imageHeight || 1024
      );
      if (!dimensionValidation.isValid) {
        errors.push(...dimensionValidation.errors);
      }
    }

    // Validate metadata
    if (data.metadata && typeof data.metadata !== 'object') {
      errors.push('Metadata must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validatePrompt(prompt: string): ValidationResult {
    if (!Prompt.isValid(prompt)) {
      const tempPrompt = Prompt.create(prompt);
      if (!tempPrompt.isSuccess()) {
        return {
          isValid: false,
          errors: [tempPrompt.getError().message]
        };
      }
    }

    return {
      isValid: true,
      errors: []
    };
  }

  static validateImageDimensions(width: number, height: number): ValidationResult {
    const errors: string[] = [];

    if (!Number.isInteger(width) || width <= 0) {
      errors.push('Width must be a positive integer');
    }

    if (!Number.isInteger(height) || height <= 0) {
      errors.push('Height must be a positive integer');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Check if dimensions are supported
    const isSupported = this.SUPPORTED_DIMENSIONS.some(
      dim => dim.width === width && dim.height === height
    );

    if (!isSupported) {
      const supportedDimsText = this.SUPPORTED_DIMENSIONS
        .map(dim => `${dim.width}x${dim.height}`)
        .join(', ');
      
      errors.push(
        `Unsupported dimensions: ${width}x${height}. Supported dimensions: ${supportedDimsText}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async canUserGenerate(userId: string, organizationId: string): Promise<boolean> {
    try {
      // TODO: Implement actual checks against database/repository
      // For now, return true for basic validation
      
      // Basic validation
      if (!userId || !organizationId) {
        return false;
      }

      // TODO: Check user is member of organization
      // TODO: Check user has generation permissions
      // TODO: Check organization has remaining quota
      // TODO: Check user hasn't exceeded rate limits

      return true;
    } catch (error) {
      // If validation fails, err on the side of caution
      return false;
    }
  }

  static estimateCost(prompt: string, model: string = 'flux-1-kontext-pro'): number {
    // Base costs in cents
    const modelCosts: Record<string, number> = {
      'flux-1-kontext-pro': 5, // ~$0.05
      'flux-1-kontext-max': 10 // ~$0.10
    };

    let baseCost = modelCosts[model] || 5;

    // Adjust cost based on prompt complexity (simple heuristic)
    if (prompt.length > 1000) {
      baseCost = Math.floor(baseCost * 1.2); // 20% increase for long prompts
    }

    const wordCount = prompt.split(/\s+/).length;
    if (wordCount > 100) {
      baseCost = Math.floor(baseCost * 1.1); // 10% increase for complex prompts
    }

    return baseCost;
  }

  // Helper methods for business rules validation
  static validateGenerationLimits(userGenerations: number, timeframe: 'hour' | 'day'): ValidationResult {
    const errors: string[] = [];
    
    if (timeframe === 'hour' && userGenerations >= this.MAX_GENERATIONS_PER_HOUR) {
      errors.push(`Maximum generations per hour (${this.MAX_GENERATIONS_PER_HOUR}) exceeded`);
    }

    if (timeframe === 'day' && userGenerations >= this.MAX_GENERATIONS_PER_DAY) {
      errors.push(`Maximum generations per day (${this.MAX_GENERATIONS_PER_DAY}) exceeded`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static getSupportedDimensions(): Array<{ width: number; height: number; label: string }> {
    return this.SUPPORTED_DIMENSIONS.map(dim => ({
      ...dim,
      label: `${dim.width} × ${dim.height}${dim.width === dim.height ? ' (Square)' : ''}`
    }));
  }

  static getSupportedModels(): string[] {
    return [...this.SUPPORTED_MODELS];
  }

  static getSupportedProviders(): string[] {
    return [...this.SUPPORTED_PROVIDERS];
  }
} 