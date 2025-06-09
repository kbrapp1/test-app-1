import { describe, it, expect } from 'vitest';
import { ProviderFactory } from '../infrastructure/providers/ProviderFactory';
import { ProviderService } from '../application/services/ProviderService';

describe('Provider System Integration', () => {
  it('should initialize providers correctly', async () => {
    const registry = ProviderFactory.createProviderRegistry();
    const providerService = new ProviderService(registry);
    
    const availableProviders = await providerService.getAvailableProviders();
    
    // Should have one Replicate provider
    expect(availableProviders).toHaveLength(1);
    
    // Should have Replicate provider with multiple models
    const replicateProvider = availableProviders.find(p => p.providerId === 'replicate');
    expect(replicateProvider).toBeTruthy();
    
    const models = await replicateProvider?.getSupportedModels();
    expect(models).toHaveLength(5); // imagen-4, flux-kontext-max, flux-kontext-pro-multi, flux-schnell, and flux-dev
  });

  it('should provide correct model capabilities', async () => {
    const registry = ProviderFactory.createProviderRegistry();
    const providerService = new ProviderService(registry);
    
    const availableProviders = await providerService.getAvailableProviders();
    const replicateProvider = availableProviders.find(p => p.providerId === 'replicate');
    expect(replicateProvider).toBeTruthy();
    
    // Check FLUX Kontext Max
    const kontextModel = await replicateProvider?.getModel('flux-kontext-max');
    expect(kontextModel).toBeTruthy();
    expect(kontextModel?.capabilities.supportsImageEditing).toBe(true);
    expect(kontextModel?.capabilities.costPerGeneration).toBe(8);
    expect(kontextModel?.capabilities.estimatedTimeSeconds).toBe(25);

    // Check FLUX Schnell
    const schnellModel = await replicateProvider?.getModel('flux-schnell');
    expect(schnellModel).toBeTruthy();
    expect(schnellModel?.capabilities.supportsImageEditing).toBe(false);
    expect(schnellModel?.capabilities.costPerGeneration).toBe(1);
    expect(schnellModel?.capabilities.estimatedTimeSeconds).toBe(10);

    // Check Google Imagen-4
    const imagenModel = await replicateProvider?.getModel('imagen-4');
    expect(imagenModel).toBeTruthy();
    expect(imagenModel?.capabilities.supportsImageEditing).toBe(false);
    expect(imagenModel?.capabilities.supportsTextToImage).toBe(true);
    expect(imagenModel?.capabilities.supportsStyleControls).toBe(true);
    expect(imagenModel?.capabilities.costPerGeneration).toBe(12);
    expect(imagenModel?.capabilities.estimatedTimeSeconds).toBe(30);
    expect(imagenModel?.isBeta).toBe(true);

    // Check FLUX Kontext Pro Multi-Image
    const multiImageModel = await replicateProvider?.getModel('flux-kontext-pro-multi');
    expect(multiImageModel).toBeTruthy();
    expect(multiImageModel?.capabilities.supportsImageEditing).toBe(true);
    expect(multiImageModel?.capabilities.supportsMultipleImages).toBe(true);
    expect(multiImageModel?.capabilities.requiredImages).toBe(2);
    expect(multiImageModel?.capabilities.supportsTextToImage).toBe(false);
    expect(multiImageModel?.capabilities.costPerGeneration).toBe(12);
    expect(multiImageModel?.capabilities.estimatedTimeSeconds).toBe(35);
    expect(multiImageModel?.isBeta).toBe(true);
  });

  it('should find cheapest and default providers', () => {
    const defaultConfig = ProviderFactory.getDefaultProviderConfig();
    expect(defaultConfig.providerId).toBe('replicate');
    expect(defaultConfig.modelId).toBe('flux-schnell');

    const cheapestConfig = ProviderFactory.getCheapestProviderConfig();
    expect(cheapestConfig.providerId).toBe('replicate');
    expect(cheapestConfig.modelId).toBe('flux-schnell');
  });

  it('should validate generation requests', async () => {
    const registry = ProviderFactory.createProviderRegistry();
    const providerService = new ProviderService(registry);

    // Valid request
    const validResult = await providerService.validateRequest(
      { prompt: 'A beautiful sunset' },
      { providerId: 'replicate', modelId: 'flux-schnell' }
    );
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Invalid request - empty prompt
    const invalidResult = await providerService.validateRequest(
      { prompt: '' },
      { providerId: 'replicate', modelId: 'flux-schnell' }
    );
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it('should estimate costs correctly', async () => {
    const registry = ProviderFactory.createProviderRegistry();
    const providerService = new ProviderService(registry);

    const kontextCost = await providerService.estimateCost(
      { prompt: 'A beautiful sunset' },
      { providerId: 'replicate', modelId: 'flux-kontext-max' }
    );
    expect(kontextCost).toBe(8);

    const schnellCost = await providerService.estimateCost(
      { prompt: 'A beautiful sunset' },
      { providerId: 'replicate', modelId: 'flux-schnell' }
    );
    expect(schnellCost).toBe(1);
  });
}); 