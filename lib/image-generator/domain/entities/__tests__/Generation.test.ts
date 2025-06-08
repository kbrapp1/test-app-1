import { describe, it, expect, beforeEach } from 'vitest';
import { Generation, CreateGenerationData } from '../Generation';
import { GenerationFactory } from '../../services/GenerationFactory';
import { Prompt } from '../../value-objects/Prompt';
import { GenerationStatus } from '../../value-objects/GenerationStatus';
import { GenerationDisplayService } from '../../services/GenerationDisplayService';

describe('Generation', () => {
  let validGenerationData: CreateGenerationData;

  beforeEach(() => {
    validGenerationData = {
      organizationId: 'org-123',
      userId: 'user-456',
      prompt: 'A beautiful sunset over mountains',
      modelName: 'flux-kontext-max',
      providerName: 'replicate',
      imageWidth: 1024,
      imageHeight: 1024,
      metadata: { tags: ['landscape', 'sunset'] }
    };
  });

  describe('create', () => {
    it('should create a new generation with valid data', () => {
      const generation = GenerationFactory.create(validGenerationData);

      expect(generation.id).toBeDefined();
      expect(generation.organizationId).toBe('org-123');
      expect(generation.userId).toBe('user-456');
      expect(generation.prompt.toString()).toBe('A beautiful sunset over mountains');
      expect(generation.modelName).toBe('flux-kontext-max');
      expect(generation.providerName).toBe('replicate');
      expect(generation.status.value).toBe('pending');
      expect(generation.imageWidth).toBe(1024);
      expect(generation.imageHeight).toBe(1024);
      expect(generation.costCents).toBe(8);
      expect(generation.savedToDAM).toBe(false);
      expect(generation.createdAt).toBeInstanceOf(Date);
      expect(generation.updatedAt).toBeInstanceOf(Date);
    });

    it('should create generation with default values', () => {
      const minimalData = {
        organizationId: 'org-123',
        userId: 'user-456',
        prompt: 'Test prompt',
        modelName: 'flux-kontext-max',
        providerName: 'replicate'
      };

      const generation = GenerationFactory.create(minimalData);

      expect(generation.modelName).toBe('flux-kontext-max');
      expect(generation.providerName).toBe('replicate');
      expect(generation.imageWidth).toBe(1024);
      expect(generation.imageHeight).toBe(1024);
      expect(generation.metadata).toEqual({});
    });

    it('should throw error for invalid prompt', () => {
      const invalidData = {
        ...validGenerationData,
        prompt: '' // Empty prompt
      };

      expect(() => GenerationFactory.create(invalidData)).toThrow('Invalid prompt');
    });

    it('should throw error for prompt that is too short', () => {
      const invalidData = {
        ...validGenerationData,
        prompt: 'Hi' // Too short
      };

      expect(() => GenerationFactory.create(invalidData)).toThrow('Invalid prompt');
    });
  });

  describe('status management', () => {
    let generation: Generation;

    beforeEach(() => {
      generation = GenerationFactory.create(validGenerationData);
    });

    it('should start with pending status', () => {
      expect(generation.isPending()).toBe(true);
      expect(generation.isProcessing()).toBe(false);
      expect(generation.isCompleted()).toBe(false);
      expect(generation.isFailed()).toBe(false);
    });

    it('should transition from pending to processing', () => {
      const processingStatus = GenerationStatus.create('processing');
      generation.updateStatus(processingStatus);

      expect(generation.isProcessing()).toBe(true);
      expect(generation.isPending()).toBe(false);
      expect(generation.status.value).toBe('processing');
    });

    it('should transition from processing to completed', () => {
      generation.updateStatus(GenerationStatus.create('processing'));
      const completedStatus = GenerationStatus.create('completed');
      generation.updateStatus(completedStatus);

      expect(generation.isCompleted()).toBe(true);
      expect(generation.isProcessing()).toBe(false);
      expect(generation.status.value).toBe('completed');
    });

    it('should prevent invalid status transitions', () => {
      const completedStatus = GenerationStatus.create('completed');
      
      expect(() => {
        generation.updateStatus(completedStatus);
      }).toThrow('Cannot transition from pending to completed');
    });

    it('should prevent transitions from terminal states', () => {
      generation.updateStatus(GenerationStatus.create('processing'));
      generation.updateStatus(GenerationStatus.create('completed'));

      expect(() => {
        generation.updateStatus(GenerationStatus.create('failed'));
      }).toThrow('Cannot transition from completed to failed');
    });
  });

  describe('markAsCompleted', () => {
    it('should mark generation as completed with result', () => {
      const generation = GenerationFactory.create(validGenerationData);
      generation.updateStatus(GenerationStatus.create('processing'));
      
      const imageUrl = 'https://example.com/image.webp';
      const generationTime = 25;

      generation.markAsCompleted(imageUrl, generationTime);

      expect(generation.isCompleted()).toBe(true);
      expect(generation.resultImageUrl).toBe(imageUrl);
      expect(generation.generationTimeSeconds).toBe(generationTime);
    });
  });

  describe('markAsFailed', () => {
    it('should mark generation as failed with error message', () => {
      const generation = GenerationFactory.create(validGenerationData);
      generation.updateStatus(GenerationStatus.create('processing'));
      
      const errorMessage = 'Generation failed due to invalid prompt';

      generation.markAsFailed(errorMessage);

      expect(generation.isFailed()).toBe(true);
      expect(generation.errorMessage).toBe(errorMessage);
    });
  });

  describe('DAM integration', () => {
    let generation: Generation;

    beforeEach(() => {
      generation = GenerationFactory.create(validGenerationData);
      generation.updateStatus(GenerationStatus.create('processing'));
      generation.markAsCompleted('https://example.com/image.webp', 30);
    });

    it('should allow linking to DAM asset when completed', () => {
      expect(generation.canSaveToDAM()).toBe(true);

      const assetId = 'asset-789';
      generation.linkToDAMAsset(assetId);

      expect(generation.savedToDAM).toBe(true);
      expect(generation.damAssetId).toBe(assetId);
    });

    it('should prevent linking to DAM when not completed', () => {
      const pendingGeneration = GenerationFactory.create(validGenerationData);

      expect(pendingGeneration.canSaveToDAM()).toBe(false);
      expect(() => {
        pendingGeneration.linkToDAMAsset('asset-123');
      }).toThrow('Cannot save to DAM');
    });

    it('should prevent linking to DAM when already saved', () => {
      generation.linkToDAMAsset('asset-789');

      expect(() => {
        generation.linkToDAMAsset('asset-999');
      }).toThrow('Cannot save to DAM');
    });
  });

  describe('utility methods', () => {
    let generation: Generation;

    beforeEach(() => {
      generation = GenerationFactory.create(validGenerationData);
    });

    it('should return correct display title', () => {
      expect(GenerationDisplayService.getDisplayTitle(generation)).toBe('A beautiful sunset over mountains');
    });

    it('should truncate long display titles', () => {
      const longPromptData = {
        ...validGenerationData,
        prompt: 'This is a very long prompt that should be truncated when displayed as a title because it exceeds fifty characters'
      };
      const longGeneration = GenerationFactory.create(longPromptData);

      const title = GenerationDisplayService.getDisplayTitle(longGeneration);
      expect(title.length).toBeLessThanOrEqual(50);
      expect(title.endsWith('...')).toBe(true);
    });

    it('should return Unknown duration when not completed', () => {
      expect(GenerationDisplayService.getDurationString(generation)).toBe('Unknown');
    });

    it('should format duration in seconds', () => {
      generation.updateStatus(GenerationStatus.create('processing'));
      generation.markAsCompleted('https://example.com/image.webp', 45);

      expect(GenerationDisplayService.getDurationString(generation)).toBe('45s');
    });

    it('should format duration in minutes and seconds', () => {
      generation.updateStatus(GenerationStatus.create('processing'));
      generation.markAsCompleted('https://example.com/image.webp', 90);

      expect(GenerationDisplayService.getDurationString(generation)).toBe('1m 30s');
    });

    it('should return formatted cost display', () => {
      expect(GenerationDisplayService.getCostDisplay(generation)).toBe('8¢');
    });

    it('should calculate estimated cost', () => {
      expect(generation.costCents).toBe(8);
    });
  });

  describe('auto-save functionality', () => {
    it('should generate correct auto-save storage path', () => {
      const generation = GenerationFactory.create(validGenerationData);
      const expectedPath = `${validGenerationData.organizationId}/${validGenerationData.userId}/ai-generations/${generation.id}.webp`;
      
      expect(GenerationDisplayService.getAutoSaveStoragePath(generation)).toBe(expectedPath);
    });

    it('should set auto-saved image URL and update timestamp', async () => {
      const generation = GenerationFactory.create(validGenerationData);
      const originalUpdatedAt = generation.updatedAt;
      
      // Wait a tiny bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const permanentUrl = 'https://storage.example.com/saved-image.webp';
      generation.setAutoSavedImageUrl(permanentUrl);
      
      expect(generation.resultImageUrl).toBe(permanentUrl);
      expect(generation.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should use auto-save path containing organization, user, and generation ID', () => {
      const generation = GenerationFactory.create({
        organizationId: 'org-abc123',
        userId: 'user-xyz789',
        prompt: 'Test image',
        modelName: 'flux-kontext-max',
        providerName: 'replicate',
      });
      
      const path = GenerationDisplayService.getAutoSaveStoragePath(generation);
      expect(path).toContain('org-abc123');
      expect(path).toContain('user-xyz789');
      expect(path).toContain('ai-generations');
      expect(path).toContain(generation.id);
      expect(path.endsWith('.webp')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle metadata correctly', () => {
      const dataWithMetadata = {
        ...validGenerationData,
        metadata: { 
          tags: ['test'], 
          source: 'api',
          quality: 'high'
        }
      };

      const generation = GenerationFactory.create(dataWithMetadata);
      const metadata = generation.metadata;

      expect(metadata.tags).toEqual(['test']);
      expect(metadata.source).toBe('api');
      expect(metadata.quality).toBe('high');

      // Ensure metadata is immutable (returns copy)
      metadata.newField = 'should not affect original';
      expect(generation.metadata.newField).toBeUndefined();
    });

    it('should update timestamps on status changes', async () => {
      const generation = GenerationFactory.create(validGenerationData);
      const originalUpdatedAt = generation.updatedAt;

      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      generation.updateStatus(GenerationStatus.create('processing'));
      expect(generation.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should handle null/undefined values correctly', () => {
      const generation = GenerationFactory.create(validGenerationData);

      expect(generation.resultImageUrl).toBeNull();
      expect(generation.externalProviderId).toBeNull();
      expect(generation.generationTimeSeconds).toBeNull();
      expect(generation.damAssetId).toBeNull();
      expect(generation.errorMessage).toBeNull();
    });
  });
}); 
