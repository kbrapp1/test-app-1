export interface FluxGenerationInput {
  prompt: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  output_quality?: number;
}

export interface ModelCapabilities {
  maxPromptLength: number;
  supportedSizes: Array<{ width: number; height: number }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class GenerationValidator {
  constructor(private capabilities: ModelCapabilities) {}

  validateRequest(request: FluxGenerationInput): ValidationResult {
    const errors: string[] = [];
    
    this.validatePrompt(request.prompt, errors);
    this.validateDimensions(request, errors);
    this.validateParameters(request, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validatePrompt(prompt: string, errors: string[]): void {
    if (!prompt || typeof prompt !== 'string') {
      errors.push('Prompt is required and must be a string');
      return;
    }

    if (prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
      return;
    }

    if (prompt.length > this.capabilities.maxPromptLength) {
      errors.push(`Prompt cannot exceed ${this.capabilities.maxPromptLength} characters`);
    }
  }

  private validateDimensions(request: FluxGenerationInput, errors: string[]): void {
    const requestedSize = {
      width: request.width || 1024,
      height: request.height || 1024,
    };

    const isSupportedSize = this.capabilities.supportedSizes.some(
      (size: { width: number; height: number }) => size.width === requestedSize.width && size.height === requestedSize.height
    );

    if (!isSupportedSize) {
      errors.push(`Unsupported image size: ${requestedSize.width}x${requestedSize.height}`);
    }
  }

  private validateParameters(request: FluxGenerationInput, errors: string[]): void {
    if (request.num_inference_steps && (request.num_inference_steps < 1 || request.num_inference_steps > 50)) {
      errors.push('Number of inference steps must be between 1 and 50');
    }

    if (request.guidance_scale && (request.guidance_scale < 1 || request.guidance_scale > 20)) {
      errors.push('Guidance scale must be between 1 and 20');
    }

    if (request.output_quality && (request.output_quality < 1 || request.output_quality > 100)) {
      errors.push('Output quality must be between 1 and 100');
    }
  }
} 