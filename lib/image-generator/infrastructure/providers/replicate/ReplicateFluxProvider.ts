import { ReplicateClient } from './ReplicateClient';
import { FluxModelService, FluxGenerationInput, ModelCapabilities } from './FluxModelService';
import { GenerationValidator, ValidationResult } from './GenerationValidator';
import { StatusMapper, PredictionStatus, DomainStatus } from './StatusMapper';

export interface GenerationRequest {
  prompt: string;
  baseImageUrl?: string; // Base64 data URL or HTTP URL for image editing
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
  outputFormat?: string;
  outputQuality?: number;
  safetyTolerance?: number;
  editType?: 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap';
}

export interface GenerationResult {
  predictionId: string;
  status: DomainStatus;
  imageUrl?: string;
  error?: string;
  estimatedTimeSeconds?: number;
}

export class ReplicateFluxProvider {
  private client: ReplicateClient | null = null;
  private readonly modelService: FluxModelService;
  private readonly validator: GenerationValidator;
  private readonly statusMapper: StatusMapper;
  private readonly timeoutMs = 120000; // 120 seconds (2 minutes) for extra safety
  private readonly apiToken?: string;

  constructor(apiToken?: string) {
    this.apiToken = apiToken;
    this.modelService = new FluxModelService();
    this.validator = new GenerationValidator(this.modelService.getCapabilities());
    this.statusMapper = new StatusMapper();
  }

  private getClient(): ReplicateClient {
    if (!this.client) {
      this.client = new ReplicateClient(this.apiToken);
    }
    return this.client;
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    const fluxInput = this.mapToFluxInput(request);
    const validation = this.validator.validateRequest(fluxInput);
    
    if (!validation.isValid) {
      throw new Error(`Invalid generation request: ${validation.errors.join(', ')}`);
    }

    const prediction = await this.getClient().createPrediction({
      model: this.modelService.getModelId(),
      input: this.modelService.createInput(fluxInput),
    });

    return {
      predictionId: prediction.id,
      status: this.statusMapper.mapReplicateStatus(prediction.status),
      estimatedTimeSeconds: this.modelService.getEstimatedTimeSeconds(),
    };
  }

  async checkPredictionStatus(predictionId: string): Promise<PredictionStatus> {
    const prediction = await this.getClient().getPrediction(predictionId);
    return this.statusMapper.mapToPredictionStatus(prediction);
  }

  async cancelPrediction(predictionId: string): Promise<void> {
    await this.getClient().cancelPrediction(predictionId);
  }

  getModelCapabilities(): ModelCapabilities {
    return this.modelService.getCapabilities();
  }

  estimateCost(request: GenerationRequest): number {
    const fluxInput = this.mapToFluxInput(request);
    return this.modelService.estimateCost(fluxInput);
  }

  validateRequest(request: GenerationRequest): ValidationResult {
    const fluxInput = this.mapToFluxInput(request);
    return this.validator.validateRequest(fluxInput);
  }



  getImageUrl(predictionStatus: PredictionStatus): string | null {
    return this.statusMapper.getImageUrl(predictionStatus);
  }

  private mapToFluxInput(request: GenerationRequest): FluxGenerationInput {
    return {
      prompt: request.prompt,
      input_image: request.baseImageUrl,
      width: request.imageWidth,
      height: request.imageHeight,
      aspect_ratio: request.aspectRatio,
      num_inference_steps: request.numInferenceSteps,
      guidance_scale: request.guidanceScale,
      seed: request.seed,
      output_format: request.outputFormat,
      output_quality: request.outputQuality,
      safety_tolerance: request.safetyTolerance,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 