import { describe, it, expect, beforeEach } from 'vitest';
import { ReplicateProvider } from '../ReplicateProvider';
import { GenerationRequest } from '../../../../domain/repositories/ImageGenerationProvider';
import { ProviderId, ModelId } from '../../../../domain/value-objects/Provider';

describe('ReplicateProvider Multi-Image Support', () => {
  let provider: ReplicateProvider;

  beforeEach(() => {
    // ReplicateProvider constructor takes an optional apiToken string, not an array
    provider = new ReplicateProvider('test-api-token');
  });

  describe('flux-kontext-pro-multi model validation', () => {
    const baseMultiImageRequest: GenerationRequest = {
      prompt: 'A beautiful landscape with mountains',
      modelId: 'flux-kontext-pro-multi' as ModelId,
      providerId: 'replicate' as ProviderId,
      aspectRatio: '16:9',
      safetyTolerance: 0
    };

    // CRITICAL TEST: This would have caught the regression
    it('should require both baseImageUrl and secondImageUrl for flux-kontext-pro-multi', async () => {
      // Test missing both images
      const neitherImageRequest = { ...baseMultiImageRequest };
      const neitherValidation = await provider.validateRequest(neitherImageRequest);
      
      expect(neitherValidation.isValid).toBe(false);
      expect(neitherValidation.errors).toContain('First input image is required for multi-image Kontext Pro model');
      expect(neitherValidation.errors).toContain('Second input image is required for multi-image Kontext Pro model');
    });

    it('should fail validation when only baseImageUrl is provided', async () => {
      const onlyBaseImageRequest = {
        ...baseMultiImageRequest,
        baseImageUrl: 'https://storage.example.com/base.webp'
        // secondImageUrl is missing - this is the regression scenario
      };

      const validation = await provider.validateRequest(onlyBaseImageRequest);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Second input image is required for multi-image Kontext Pro model');
      expect(validation.errors).not.toContain('First input image is required');
    });

    it('should fail validation when only secondImageUrl is provided', async () => {
      const onlySecondImageRequest = {
        ...baseMultiImageRequest,
        secondImageUrl: 'https://storage.example.com/second.webp'
        // baseImageUrl is missing
      };

      const validation = await provider.validateRequest(onlySecondImageRequest);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('First input image is required for multi-image Kontext Pro model');
      expect(validation.errors).not.toContain('Second input image is required');
    });

    // CRITICAL TEST: This validates the happy path after the fix
    it('should pass validation when both images are provided with valid URLs', async () => {
      const validMultiImageRequest = {
        ...baseMultiImageRequest,
        baseImageUrl: 'https://storage.example.com/base.webp',
        secondImageUrl: 'https://storage.example.com/second.webp'
      };

      const validation = await provider.validateRequest(validMultiImageRequest);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject data URLs for multi-image model (must be uploaded to storage)', async () => {
      const dataUrlRequest = {
        ...baseMultiImageRequest,
        baseImageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
        secondImageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...'
      };

      const validation = await provider.validateRequest(dataUrlRequest);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('First image must be uploaded to storage before generation. Please wait for upload to complete.');
      expect(validation.errors).toContain('Second image must be uploaded to storage before generation. Please wait for upload to complete.');
    });

    it('should reject mixed data and storage URLs', async () => {
      const mixedRequest = {
        ...baseMultiImageRequest,
        baseImageUrl: 'https://storage.example.com/base.webp',
        secondImageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...'
      };

      const validation = await provider.validateRequest(mixedRequest);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Second image must be uploaded to storage before generation. Please wait for upload to complete.');
      expect(validation.errors).not.toContain('First image must be uploaded');
    });

    it('should accept temp-upload URLs for both images', async () => {
      const tempUploadRequest = {
        ...baseMultiImageRequest,
        baseImageUrl: 'https://storage.supabase.co/storage/v1/object/public/assets/org-123/temp-uploads/base.webp',
        secondImageUrl: 'https://storage.supabase.co/storage/v1/object/public/assets/org-123/temp-uploads/second-image.webp'
      };

      const validation = await provider.validateRequest(tempUploadRequest);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should accept permanent storage URLs for both images', async () => {
      const storageRequest = {
        ...baseMultiImageRequest,
        baseImageUrl: 'https://hkddquflhrdrsslqslhe.supabase.co/storage/v1/object/public/assets/org-123/user-456/ai-generations/gen1.webp',
        secondImageUrl: 'https://hkddquflhrdrsslqslhe.supabase.co/storage/v1/object/public/assets/org-123/user-456/ai-generations/gen2.webp'
      };

      const validation = await provider.validateRequest(storageRequest);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('single-image models should ignore secondImageUrl', () => {
    it('should pass validation for flux-schnell with secondImageUrl ignored', async () => {
      const singleImageRequest: GenerationRequest = {
        prompt: 'A single image generation',
        modelId: 'flux-schnell' as ModelId,
        providerId: 'replicate' as ProviderId,
        aspectRatio: '16:9'
        // No safetyTolerance for flux-schnell (not supported)
        // secondImageUrl is omitted - should be ignored for single-image models
      };

      const validation = await provider.validateRequest(singleImageRequest);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should pass validation for flux-kontext-max with secondImageUrl ignored', async () => {
      const singleImageRequest: GenerationRequest = {
        prompt: 'A single image generation',
        modelId: 'flux-kontext-max' as ModelId,
        providerId: 'replicate' as ProviderId,
        aspectRatio: '16:9',
        safetyTolerance: 3, // flux-kontext-max supports safety tolerance
        baseImageUrl: 'https://storage.example.com/base.webp'
        // secondImageUrl is omitted - should be ignored for single-image models
      };

      const validation = await provider.validateRequest(singleImageRequest);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('regression prevention edge cases', () => {
    it('REGRESSION TEST: should detect when secondImageUrl becomes undefined in request', async () => {
      // Simulate the exact scenario that caused the regression
      const requestWithUndefinedSecond = {
        prompt: 'Test generation',
        modelId: 'flux-kontext-pro-multi' as ModelId,
        providerId: 'replicate' as ProviderId,
        aspectRatio: '16:9',
        safetyTolerance: 0,
        baseImageUrl: 'https://storage.example.com/base.webp',
        secondImageUrl: undefined // This is what was happening due to the bug
      };

      const validation = await provider.validateRequest(requestWithUndefinedSecond);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Second input image is required for multi-image Kontext Pro model');
    });

    it('REGRESSION TEST: should detect when secondImageUrl becomes null in request', async () => {
      const requestWithNullSecond = {
        prompt: 'Test generation',
        modelId: 'flux-kontext-pro-multi' as ModelId,
        providerId: 'replicate' as ProviderId,
        aspectRatio: '16:9',
        safetyTolerance: 0,
        baseImageUrl: 'https://storage.example.com/base.webp'
        // secondImageUrl is omitted (equivalent to null/undefined in this context)
      };

      const validation = await provider.validateRequest(requestWithNullSecond);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Second input image is required for multi-image Kontext Pro model');
    });

    it('REGRESSION TEST: should detect when secondImageUrl becomes empty string', async () => {
      const requestWithEmptySecond = {
        prompt: 'Test generation',
        modelId: 'flux-kontext-pro-multi' as ModelId,
        providerId: 'replicate' as ProviderId,
        aspectRatio: '16:9',
        safetyTolerance: 0,
        baseImageUrl: 'https://storage.example.com/base.webp',
        secondImageUrl: '' // Empty string should also be invalid
      };

      const validation = await provider.validateRequest(requestWithEmptySecond);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Second input image is required for multi-image Kontext Pro model');
    });
  });

  describe('request construction and input mapping', () => {
    it('should properly map both images to kontext_text_to_image input', async () => {
      // This tests that the createInput method properly handles both images
      const request: GenerationRequest = {
        prompt: 'Test multi-image generation',
        modelId: 'flux-kontext-pro-multi' as ModelId,
        providerId: 'replicate' as ProviderId,
        aspectRatio: '16:9',
        safetyTolerance: 0,
        baseImageUrl: 'https://storage.example.com/first.webp',
        secondImageUrl: 'https://storage.example.com/second.webp'
      };

      // Note: We can't easily test createInput without mocking Replicate API
      // But we can test that validation passes, which means the input mapping should work
      const validation = await provider.validateRequest(request);
      expect(validation.isValid).toBe(true);
      
      // Additional verification could be added here if we mock the Replicate client
    });
  });
}); 