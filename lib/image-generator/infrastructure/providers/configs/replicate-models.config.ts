import { ProviderModel } from '../../../domain/value-objects/Provider';

/**
 * Centralized Replicate Provider Model Configuration
 * 
 * This file contains all model definitions and capabilities for the Replicate provider.
 * Modify this file to add new models or update existing capabilities.
 */

export const REPLICATE_MODELS: ProviderModel[] = [
  {
    id: 'flux-kontext-max',
    name: 'FLUX Kontext Max',
    description: 'Advanced image editing and generation with enhanced typography capabilities',
    capabilities: {
      maxPromptLength: 2000,
      supportedAspectRatios: ['1:1', '3:4', '4:3', '16:9', '9:16', '21:9', '9:21', '3:7', '7:3'],
      defaultSettings: {
        aspectRatio: '1:1',
        outputFormat: 'jpeg',
        safetyTolerance: 2,
      },
      costPerGeneration: 8, // 8 cents
      estimatedTimeSeconds: 25,
      supportsImageEditing: true,        // 🎯 Controls image upload section
      supportsTextToImage: true,         // 🎯 Basic text-to-image capability
      supportsCustomDimensions: true,    // 🎯 Allows custom aspect ratios
      supportsStyleControls: true,       // 🎯 Shows style preset section
      supportedOutputFormats: ['jpeg', 'png'],
      maxSafetyTolerance: 6,            // 🎯 Safety slider max value
      minSafetyTolerance: 1,            // 🎯 Safety slider min value
    },
    isDefault: false,
    isBeta: false,
  },
  {
    id: 'flux-schnell',
    name: 'FLUX Schnell',
    description: 'Fastest image generation model for rapid prototyping and testing',
    capabilities: {
      maxPromptLength: 2000,
      supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      defaultSettings: {
        aspectRatio: '1:1',
        outputFormat: 'png',
      },
      costPerGeneration: 1, // 1 cent - much cheaper!
      estimatedTimeSeconds: 10,
      supportsImageEditing: false,       // 🎯 Hides image upload section
      supportsTextToImage: true,
      supportsCustomDimensions: false,   // 🎯 Limited aspect ratio options
      supportsStyleControls: false,      // 🎯 No style controls
      supportedOutputFormats: ['png', 'webp', 'jpg'],
      // No safety tolerance - not configurable for schnell
    },
    isDefault: true,
    isBeta: false,
  },
  {
    id: 'flux-dev',
    name: 'FLUX Dev',
    description: 'Development model with experimental features',
    capabilities: {
      maxPromptLength: 2500,
      supportedAspectRatios: ['1:1', '3:4', '4:3', '16:9', '9:16'],
      defaultSettings: {
        aspectRatio: '1:1',
        outputFormat: 'png',
        safetyTolerance: 3,
      },
      costPerGeneration: 5, // 5 cents
      estimatedTimeSeconds: 20,
      supportsImageEditing: true,        // 🎯 Image editing enabled
      supportsTextToImage: true,
      supportsCustomDimensions: true,
      supportsStyleControls: true,       // 🎯 SHOWS style controls section!
      supportedOutputFormats: ['png', 'jpeg', 'webp'],
      maxSafetyTolerance: 5,
      minSafetyTolerance: 1,
    },
    isDefault: false,
    isBeta: true, // 🎯 Shows "Beta" badge in UI
  },
];

/**
 * Model ID to Replicate API endpoint mapping
 */
export const REPLICATE_MODEL_ENDPOINTS: Record<string, string> = {
  'flux-kontext-max': 'black-forest-labs/flux-kontext-max',
  'flux-schnell': 'black-forest-labs/flux-schnell',
  'flux-dev': 'black-forest-labs/flux-dev',
};

/**
 * Feature capability groups for easy reference
 */
export const FEATURE_GROUPS = {
  IMAGE_EDITING_MODELS: REPLICATE_MODELS.filter(m => m.capabilities.supportsImageEditing),
  STYLE_CONTROL_MODELS: REPLICATE_MODELS.filter(m => m.capabilities.supportsStyleControls),
  BUDGET_MODELS: REPLICATE_MODELS.filter(m => m.capabilities.costPerGeneration <= 2),
  PREMIUM_MODELS: REPLICATE_MODELS.filter(m => m.capabilities.costPerGeneration >= 5),
  FAST_MODELS: REPLICATE_MODELS.filter(m => m.capabilities.estimatedTimeSeconds <= 15),
} as const; 