export interface FluxGenerationInput {
  prompt: string;
  input_image?: string; // Base64 data URL or HTTP URL for image editing
  width?: number;
  height?: number;
  aspect_ratio?: string; // e.g., "16:9", "1:1", "3:4"
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  output_format?: string;
  output_quality?: number;
  safety_tolerance?: number;
  prompt_upsampling?: boolean;
}

export interface ModelCapabilities {
  maxPromptLength: number;
  supportedSizes: Array<{ width: number; height: number }>;
  supportedAspectRatios: string[];
  defaultSettings: Partial<FluxGenerationInput>;
  costPerGeneration: number;
  supportsImageEditing: boolean;
  supportsTextToImage: boolean;
}

export class FluxModelService {
  private readonly modelId = 'black-forest-labs/flux-kontext-max';

  getModelId(): string {
    return this.modelId;
  }

  getCapabilities(): ModelCapabilities {
    return {
      maxPromptLength: 2000,
      supportedSizes: [
        { width: 512, height: 512 },
        { width: 768, height: 768 },
        { width: 1024, height: 1024 },
        { width: 1280, height: 720 }, // 16:9
        { width: 720, height: 1280 }, // 9:16
        { width: 1024, height: 768 }, // 4:3
        { width: 768, height: 1024 }, // 3:4
      ],
      supportedAspectRatios: [
        '1:1', '3:4', '4:3', '16:9', '9:16', 
        '21:9', '9:21', '3:7', '7:3'
      ],
      defaultSettings: {
        aspect_ratio: '1:1',
        output_format: 'jpg',
        safety_tolerance: 2,
        prompt_upsampling: false,
      },
      costPerGeneration: 8, // FLUX Kontext Max premium pricing (~$0.08 per generation)
      supportsImageEditing: true,
      supportsTextToImage: true,
    };
  }

  createInput(request: FluxGenerationInput): Record<string, unknown> {
    const defaults = this.getCapabilities().defaultSettings;
    
    const input: Record<string, unknown> = {
      prompt: request.prompt,
      output_format: request.output_format || defaults.output_format,
      safety_tolerance: request.safety_tolerance || defaults.safety_tolerance,
      prompt_upsampling: request.prompt_upsampling || defaults.prompt_upsampling,
    };

    // Add input image for editing mode
    if (request.input_image) {
      input.input_image = request.input_image;
    }

    // Handle dimensions - use aspect_ratio if provided, otherwise width/height
    if (request.aspect_ratio) {
      input.aspect_ratio = request.aspect_ratio;
    } else if (request.width && request.height) {
      // Convert width/height to aspect ratio
      const gcd = this.calculateGCD(request.width, request.height);
      const aspectWidth = request.width / gcd;
      const aspectHeight = request.height / gcd;
      input.aspect_ratio = `${aspectWidth}:${aspectHeight}`;
    } else {
      input.aspect_ratio = defaults.aspect_ratio;
    }

    // Add optional seed for reproducibility
    if (request.seed !== undefined && request.seed !== null) {
      input.seed = request.seed;
    }

    return input;
  }

  estimateCost(request: FluxGenerationInput): number {
    // FLUX Kontext has consistent pricing regardless of image size or editing mode
    return this.getCapabilities().costPerGeneration;
  }

  getEstimatedTimeSeconds(): number {
    return 25; // FLUX Kontext is typically faster than FLUX Pro (20-30 seconds)
  }

  isEditingMode(request: FluxGenerationInput): boolean {
    return !!request.input_image;
  }

  private calculateGCD(a: number, b: number): number {
    return b === 0 ? a : this.calculateGCD(b, a % b);
  }
} 