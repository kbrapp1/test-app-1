import { ProviderModel } from '../../../domain/value-objects/Provider';

/**
 * OpenAI Provider Model Configuration
 * 
 * Example of how to configure a different provider with different capabilities
 */

export const OPENAI_MODELS: ProviderModel[] = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'Most advanced OpenAI image generation with superior prompt understanding',
    capabilities: {
      maxPromptLength: 4000, // OpenAI supports longer prompts
      supportedAspectRatios: ['1:1', '16:9', '9:16'], // Limited aspect ratios
      defaultSettings: {
        aspectRatio: '1:1',
        outputFormat: 'png',
      },
      costPerGeneration: 4, // 4 cents
      estimatedTimeSeconds: 15,
      supportsImageEditing: false,       // 🎯 DALL-E 3 doesn't support editing
      supportsTextToImage: true,
      supportsCustomDimensions: false,   // 🎯 Fixed aspect ratios only
      supportsStyleControls: true,       // 🎯 OpenAI has style presets!
      supportedOutputFormats: ['png'],
      // No safety tolerance - OpenAI uses built-in safety
    },
    isDefault: true,
    isBeta: false,
  },
  {
    id: 'dall-e-2',
    name: 'DALL-E 2',
    description: 'Previous generation OpenAI model, faster and cheaper',
    capabilities: {
      maxPromptLength: 1000,
      supportedAspectRatios: ['1:1'], // Only square images
      defaultSettings: {
        aspectRatio: '1:1',
        outputFormat: 'png',
      },
      costPerGeneration: 2, // 2 cents
      estimatedTimeSeconds: 10,
      supportsImageEditing: true,        // 🎯 DALL-E 2 supports editing
      supportsTextToImage: true,
      supportsCustomDimensions: false,
      supportsStyleControls: false,      // 🎯 No style controls
      supportedOutputFormats: ['png'],
    },
    isDefault: false,
    isBeta: false,
  },
];

/**
 * Model ID to OpenAI API endpoint mapping
 */
export const OPENAI_MODEL_ENDPOINTS: Record<string, string> = {
  'dall-e-3': 'dall-e-3',
  'dall-e-2': 'dall-e-2',
};

/**
 * OpenAI-specific style presets (used when supportsStyleControls: true)
 */
export const OPENAI_STYLE_PRESETS = [
  { id: 'natural', name: 'Natural', description: 'Photorealistic and natural' },
  { id: 'vivid', name: 'Vivid', description: 'Hyper-real and dramatic' },
  { id: 'artistic', name: 'Artistic', description: 'Creative and stylized' },
] as const; 