import { describe, it, expect } from 'vitest';
import { ProviderFactory } from '../infrastructure/providers/ProviderFactory';
import { ProviderService } from '../application/services/ProviderService';

describe('Provider System Integration', () => {
  it('should initialize providers correctly', () => {
    const registry = ProviderFactory.createProviderRegistry();
    const providerService = new ProviderService(registry);
    
    const availableProviders = providerService.getAvailableProviders();
    
    // Should have one Replicate provider
    expect(availableProviders).toHaveLength(1);
    
    // Should have Replicate provider with multiple models
    const replicateProvider = availableProviders.find(p => p.providerId === 'replicate');
    expect(replicateProvider).toBeTruthy();
    
    const models = replicateProvider?.getSupportedModels();
    expect(models).toHaveLength(2); // flux-kontext-max and flux-schnell
  });

  it('should provide correct model capabilities', () => {
    const registry = ProviderFactory.createProviderRegistry();
    const providerService = new ProviderService(registry);
    
    const availableProviders = providerService.getAvailableProviders();
    const replicateProvider = availableProviders.find(p => p.providerId === 'replicate');
    expect(replicateProvider).toBeTruthy();
    
    // Check FLUX Kontext Max
    const kontextModel = replicateProvider?.getModel('flux-kontext-max');
    expect(kontextModel).toBeTruthy();
    expect(kontextModel?.capabilities.supportsImageEditing).toBe(true);
    expect(kontextModel?.capabilities.costPerGeneration).toBe(8);
    expect(kontextModel?.capabilities.estimatedTimeSeconds).toBe(25);

    // Check FLUX Schnell
    const schnellModel = replicateProvider?.getModel('flux-schnell');
    expect(schnellModel).toBeTruthy();
    expect(schnellModel?.capabilities.supportsImageEditing).toBe(false);
    expect(schnellModel?.capabilities.costPerGeneration).toBe(1);
    expect(schnellModel?.capabilities.estimatedTimeSeconds).toBe(10);
  });

  it('should find cheapest and default providers', () => {
    const defaultConfig = ProviderFactory.getDefaultProviderConfig();
    expect(defaultConfig.providerId).toBe('replicate');
    expect(defaultConfig.modelId).toBe('flux-schnell');

    const cheapestConfig = ProviderFactory.getCheapestProviderConfig();
    expect(cheapestConfig.providerId).toBe('replicate');
    expect(cheapestConfig.modelId).toBe('flux-schnell');
  });

  it('should validate generation requests', () => {
    const registry = ProviderFactory.createProviderRegistry();
    const providerService = new ProviderService(registry);

    // Valid request
    const validResult = providerService.validateRequest(
      { prompt: 'A beautiful sunset' },
      { providerId: 'replicate', modelId: 'flux-schnell' }
    );
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Invalid request - empty prompt
    const invalidResult = providerService.validateRequest(
      { prompt: '' },
      { providerId: 'replicate', modelId: 'flux-schnell' }
    );
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it('should estimate costs correctly', () => {
    const registry = ProviderFactory.createProviderRegistry();
    const providerService = new ProviderService(registry);

    const kontextCost = providerService.estimateCost(
      { prompt: 'A beautiful sunset' },
      { providerId: 'replicate', modelId: 'flux-kontext-max' }
    );
    expect(kontextCost).toBe(8);

    const schnellCost = providerService.estimateCost(
      { prompt: 'A beautiful sunset' },
      { providerId: 'replicate', modelId: 'flux-schnell' }
    );
    expect(schnellCost).toBe(1);
  });
}); 