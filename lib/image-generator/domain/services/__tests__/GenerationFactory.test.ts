import { describe, it, expect } from 'vitest';
import { GenerationFactory } from '../GenerationFactory';
import { CreateGenerationData } from '../../entities/Generation';

describe('GenerationFactory', () => {
  const baseCreateData: CreateGenerationData = {
    organizationId: 'org-123',
    userId: 'user-456',
    prompt: 'A beautiful landscape',
    modelName: 'flux-kontext-max',
    providerName: 'replicate',
    imageWidth: 1024,
    imageHeight: 1024,
    metadata: {}
  };

  describe('create', () => {
    it('should create generation with no images (text-to-image)', () => {
      const generation = GenerationFactory.create(baseCreateData);
      
      expect(generation.baseImageUrl).toBeNull();
      expect(generation.secondImageUrl).toBeNull();
      expect(generation.editType).toBe('text-to-image');
    });

    it('should create generation with base image only (image-to-image)', () => {
      const dataWithBaseImage: CreateGenerationData = {
        ...baseCreateData,
        baseImageUrl: 'https://storage.example.com/base-image.webp'
      };

      const generation = GenerationFactory.create(dataWithBaseImage);
      
      expect(generation.baseImageUrl).toBe('https://storage.example.com/base-image.webp');
      expect(generation.secondImageUrl).toBeNull();
      expect(generation.editType).toBe('image-editing');
    });

    // CRITICAL TEST: This would have caught the regression
    it('should create generation with both base and second image URLs (multi-image)', () => {
      const dataWithBothImages: CreateGenerationData = {
        ...baseCreateData,
        baseImageUrl: 'https://storage.example.com/base-image.webp',
        secondImageUrl: 'https://storage.example.com/second-image.webp',
        modelName: 'flux-kontext-pro-multi'
      };

      const generation = GenerationFactory.create(dataWithBothImages);
      
      // These assertions would have failed before the fix
      expect(generation.baseImageUrl).toBe('https://storage.example.com/base-image.webp');
      expect(generation.secondImageUrl).toBe('https://storage.example.com/second-image.webp');
      expect(generation.editType).toBe('image-editing');
    });

    // CRITICAL TEST: Ensure secondImageUrl is preserved through the entire creation process
    it('should preserve secondImageUrl when provided in CreateGenerationData', () => {
      const testSecondImageUrl = 'https://storage.example.com/test-second-image.webp';
      
      const dataWithSecondImage: CreateGenerationData = {
        ...baseCreateData,
        baseImageUrl: 'https://storage.example.com/base.webp',
        secondImageUrl: testSecondImageUrl
      };

      const generation = GenerationFactory.create(dataWithSecondImage);
      
      // This is the exact assertion that would have caught the regression
      expect(generation.secondImageUrl).toBe(testSecondImageUrl);
      expect(generation.secondImageUrl).not.toBeNull();
      expect(generation.secondImageUrl).not.toBeUndefined();
    });

    it('should handle secondImageUrl as null when not provided', () => {
      const generation = GenerationFactory.create(baseCreateData);
      
      expect(generation.secondImageUrl).toBeNull();
    });

    it('should handle secondImageUrl as null when explicitly set to null', () => {
      const dataWithNullSecondImage: CreateGenerationData = {
        ...baseCreateData,
        secondImageUrl: null
      };

      const generation = GenerationFactory.create(dataWithNullSecondImage);
      
      expect(generation.secondImageUrl).toBeNull();
    });

    it('should handle secondImageUrl as null when explicitly set to undefined', () => {
      const dataWithUndefinedSecondImage: CreateGenerationData = {
        ...baseCreateData,
        secondImageUrl: undefined
      };

      const generation = GenerationFactory.create(dataWithUndefinedSecondImage);
      
      expect(generation.secondImageUrl).toBeNull();
    });

    // Test edge cases for multi-image models
    it('should create valid generation for flux-kontext-pro-multi model with both images', () => {
      const multiImageData: CreateGenerationData = {
        ...baseCreateData,
        modelName: 'flux-kontext-pro-multi',
        baseImageUrl: 'https://storage.example.com/first.webp',
        secondImageUrl: 'https://storage.example.com/second.webp'
      };

      const generation = GenerationFactory.create(multiImageData);
      
      expect(generation.modelName).toBe('flux-kontext-pro-multi');
      expect(generation.baseImageUrl).toBe('https://storage.example.com/first.webp');
      expect(generation.secondImageUrl).toBe('https://storage.example.com/second.webp');
    });
  });

  describe('multi-image model support validation', () => {
    // These tests ensure the factory properly handles all multi-image scenarios
    
    it('should handle temp-upload URLs for both images', () => {
      const tempUploadData: CreateGenerationData = {
        ...baseCreateData,
        baseImageUrl: 'https://storage.supabase.co/storage/v1/object/public/assets/org-123/temp-uploads/base.webp',
        secondImageUrl: 'https://storage.supabase.co/storage/v1/object/public/assets/org-123/temp-uploads/second-image.webp'
      };

      const generation = GenerationFactory.create(tempUploadData);
      
      expect(generation.baseImageUrl).toContain('temp-uploads/base.webp');
      expect(generation.secondImageUrl).toContain('temp-uploads/second-image.webp');
    });

    it('should handle storage URLs for both images', () => {
      const storageData: CreateGenerationData = {
        ...baseCreateData,
        baseImageUrl: 'https://hkddquflhrdrsslqslhe.supabase.co/storage/v1/object/public/assets/org-123/user-456/ai-generations/gen1.webp',
        secondImageUrl: 'https://hkddquflhrdrsslqslhe.supabase.co/storage/v1/object/public/assets/org-123/user-456/ai-generations/gen2.webp'
      };

      const generation = GenerationFactory.create(storageData);
      
      expect(generation.baseImageUrl).toContain('ai-generations/gen1.webp');
      expect(generation.secondImageUrl).toContain('ai-generations/gen2.webp');
    });

    it('should handle mixed URL types (base from temp-uploads, second from storage)', () => {
      const mixedData: CreateGenerationData = {
        ...baseCreateData,
        baseImageUrl: 'https://storage.supabase.co/storage/v1/object/public/assets/org-123/temp-uploads/base.webp',
        secondImageUrl: 'https://hkddquflhrdrsslqslhe.supabase.co/storage/v1/object/public/assets/org-123/user-456/ai-generations/second.webp'
      };

      const generation = GenerationFactory.create(mixedData);
      
      expect(generation.baseImageUrl).toContain('temp-uploads');
      expect(generation.secondImageUrl).toContain('ai-generations');
    });
  });

  describe('regression prevention tests', () => {
    // These specific tests are designed to catch the exact regression that occurred
    
    it('REGRESSION TEST: secondImageUrl must be passed through GenerationData construction', () => {
      const testData: CreateGenerationData = {
        organizationId: 'test-org',
        userId: 'test-user',
        prompt: 'Test prompt for regression',
        modelName: 'flux-kontext-pro-multi',
        providerName: 'replicate',
        baseImageUrl: 'https://example.com/base.webp',
        secondImageUrl: 'https://example.com/second.webp'
      };

      const generation = GenerationFactory.create(testData);
      
      // This exact check would have failed before the fix
      expect(generation.secondImageUrl).toBe('https://example.com/second.webp');
      
      // Additional paranoid checks
      expect(generation.secondImageUrl).toBeTruthy();
      expect(typeof generation.secondImageUrl).toBe('string');
      expect(generation.secondImageUrl!.length).toBeGreaterThan(0);
    });

    it('REGRESSION TEST: all image URLs should be preserved in exact order', () => {
      const urls = {
        base: 'https://storage.example.com/first-uploaded-image.webp',
        second: 'https://storage.example.com/second-uploaded-image.webp'
      };

      const testData: CreateGenerationData = {
        ...baseCreateData,
        baseImageUrl: urls.base,
        secondImageUrl: urls.second
      };

      const generation = GenerationFactory.create(testData);
      
      // Verify exact URLs are preserved
      expect(generation.baseImageUrl).toBe(urls.base);
      expect(generation.secondImageUrl).toBe(urls.second);
      
      // Verify no cross-contamination
      expect(generation.baseImageUrl).not.toBe(urls.second);
      expect(generation.secondImageUrl).not.toBe(urls.base);
    });

    it('REGRESSION TEST: secondImageUrl should survive serialization/deserialization', () => {
      const originalData: CreateGenerationData = {
        ...baseCreateData,
        baseImageUrl: 'https://example.com/base.webp',
        secondImageUrl: 'https://example.com/second.webp'
      };

      const generation = GenerationFactory.create(originalData);
      
      // Simulate what happens in the actual flow - conversion to JSON and back
      const generationJson = JSON.parse(JSON.stringify({
        baseImageUrl: generation.baseImageUrl,
        secondImageUrl: generation.secondImageUrl,
        // ... other properties would be here
      }));
      
      expect(generationJson.secondImageUrl).toBe('https://example.com/second.webp');
      expect(generationJson.baseImageUrl).toBe('https://example.com/base.webp');
    });
  });

  describe('edge cases and error conditions', () => {
    it('should handle empty string secondImageUrl as null', () => {
      const dataWithEmptySecondImage: CreateGenerationData = {
        ...baseCreateData,
        secondImageUrl: ''
      };

      const generation = GenerationFactory.create(dataWithEmptySecondImage);
      
      expect(generation.secondImageUrl).toBeNull();
    });

    it('should handle whitespace-only secondImageUrl as preserved (not trimmed)', () => {
      const dataWithWhitespaceSecondImage: CreateGenerationData = {
        ...baseCreateData,
        secondImageUrl: '   '
      };

      const generation = GenerationFactory.create(dataWithWhitespaceSecondImage);
      
      // GenerationFactory preserves the whitespace string as-is, doesn't auto-trim
      expect(generation.secondImageUrl).toBe('   ');
    });

    it('should preserve valid secondImageUrl even with whitespace', () => {
      const urlWithSpaces = '  https://example.com/image.webp  ';
      const dataWithSpacedUrl: CreateGenerationData = {
        ...baseCreateData,
        secondImageUrl: urlWithSpaces
      };

      const generation = GenerationFactory.create(dataWithSpacedUrl);
      
      // Should preserve the URL (with spaces, if that's what was provided)
      expect(generation.secondImageUrl).toBe(urlWithSpaces);
    });
  });
}); 