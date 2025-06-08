import { describe, it, expect } from 'vitest';
import { GenerationValidationService } from '../GenerationValidationService';
import { GenerationStatus } from '../../value-objects/GenerationStatus';
import { GenerationFactory } from './../../../domain/services/GenerationFactory';
import { Prompt } from '../../value-objects/Prompt';
import { Generation } from '../../entities/Generation';

// Helper to create a plain Generation with custom state
function createGenerationWithStatus(statusValue: string): Generation {
  const data = {
    organizationId: 'org-1',
    userId: 'user-1',
    prompt: 'Test prompt',
    modelName: 'flux-kontext-max',
    providerName: 'replicate',
    baseImageUrl: null,
    metadata: {}
  };
  const generation = GenerationFactory.create(data as any);
  // Force status
  generation.updateStatus(GenerationStatus.create(statusValue));
  return generation;
}

describe('GenerationValidationService', () => {
  describe('canTransitionTo / validateStatusTransition', () => {
    it('allows valid transitions', () => {
      const pending = GenerationStatus.create('pending');
      const processing = GenerationStatus.create('processing');
      expect(GenerationValidationService.canTransitionTo(pending, processing)).toBe(true);
      expect(() => GenerationValidationService.validateStatusTransition(pending, processing)).not.toThrow();
    });

    it('rejects invalid transitions', () => {
      const pending = GenerationStatus.create('pending');
      const completed = GenerationStatus.create('completed');
      expect(GenerationValidationService.canTransitionTo(pending, completed)).toBe(false);
      expect(() => GenerationValidationService.validateStatusTransition(pending, completed))
        .toThrow('Cannot transition from pending to completed');
    });
  });

  describe('validateExternalProviderId', () => {
    it('accepts non-empty provider IDs', () => {
      expect(() => GenerationValidationService.validateExternalProviderId('abc')).not.toThrow();
    });
    it('rejects empty or whitespace IDs', () => {
      expect(() => GenerationValidationService.validateExternalProviderId('')).toThrow('External provider ID cannot be empty');
      expect(() => GenerationValidationService.validateExternalProviderId('   ')).toThrow('External provider ID cannot be empty');
    });
  });

  describe('validatePermanentUrl', () => {
    it('accepts non-empty URLs', () => {
      expect(() => GenerationValidationService.validatePermanentUrl('http://example.com')).not.toThrow();
    });
    it('rejects empty or whitespace URLs', () => {
      expect(() => GenerationValidationService.validatePermanentUrl('')).toThrow('Permanent URL cannot be empty');
      expect(() => GenerationValidationService.validatePermanentUrl('  ')).toThrow('Permanent URL cannot be empty');
    });
  });

  describe('canSaveToDAM / validateDAMLinking', () => {
    it('only allows saving when completed and not yet saved', () => {
      const gen = createGenerationWithStatus('processing');
      expect(GenerationValidationService.canSaveToDAM(gen)).toBe(false);
      expect(() => GenerationValidationService.validateDAMLinking(gen)).toThrow();

      gen.markAsCompleted('http://img', 10);
      expect(gen.isCompleted()).toBe(true);
      expect(GenerationValidationService.canSaveToDAM(gen)).toBe(true);
      expect(() => GenerationValidationService.validateDAMLinking(gen)).not.toThrow();

      gen.linkToDAMAsset('asset123');
      expect(gen.savedToDAM).toBe(true);
      expect(() => GenerationValidationService.validateDAMLinking(gen)).toThrow();
    });
  });

  describe('isEditingMode / hasBaseImage', () => {
    it('identifies editing mode based on editType', () => {
      const dataText = { organizationId: 'o', userId: 'u', prompt: 'Valid prompt', modelName: 'm', providerName: 'pr', metadata: {} } as any;
      const textGen = GenerationFactory.create(dataText);
      expect(GenerationValidationService.isEditingMode(textGen)).toBe(false);

      const dataEdit = { ...dataText, baseImageUrl: 'http://base' };
      const editGen = GenerationFactory.create(dataEdit as any);
      expect(GenerationValidationService.isEditingMode(editGen)).toBe(true);
      expect(GenerationValidationService.hasBaseImage(editGen)).toBe(true);
    });
  });
}); 