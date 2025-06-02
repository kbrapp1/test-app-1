import { describe, it, expect } from 'vitest';
import { Generation } from '../domain/entities/Generation';
import { GenerationFactory } from '../domain/services/GenerationFactory';
import { GenerationRowMapper } from '../infrastructure/persistence/supabase/mappers/GenerationRowMapper';

describe('Generic Provider ID Integration', () => {
  it('should store and retrieve externalProviderId for Replicate provider', () => {
    // Create a generation for Replicate 
    const generation = GenerationFactory.create({
      organizationId: 'org-123',
      userId: 'user-456',
      prompt: 'A cat in space',
      modelName: 'flux-kontext-max',
      providerName: 'replicate',
    });

    // Set external provider ID with Replicate format
    const replicateId = 'prediction_abc123';
    generation.setExternalProviderId(replicateId);

    // Convert to database row
    const row = GenerationRowMapper.toRow(generation);

    // Verify generic field stores Replicate ID
    expect(row.external_provider_id).toBe(replicateId);

    // Convert back from database row
    const reconstructed = GenerationRowMapper.fromRow({
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Verify the generic getter returns Replicate ID
    expect(reconstructed.externalProviderId).toBe(replicateId);
  });

  it('should store and retrieve externalProviderId for OpenAI provider (future)', () => {
    // Create a generation for OpenAI (future provider)
    const generation = GenerationFactory.create({
      organizationId: 'org-123',
      userId: 'user-456',
      prompt: 'A dog in space',
      modelName: 'dall-e-3',
      providerName: 'openai',
    });

    // Set external provider ID with OpenAI format
    const openaiId = 'req_xyz789';
    generation.setExternalProviderId(openaiId);

    // Convert to database row
    const row = GenerationRowMapper.toRow(generation);

    // Verify generic field stores OpenAI ID
    expect(row.external_provider_id).toBe(openaiId);

    // Convert back from database row
    const reconstructed = GenerationRowMapper.fromRow({
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Verify the generic getter returns OpenAI ID
    expect(reconstructed.externalProviderId).toBe(openaiId);
  });

  it('should handle Google provider with generic external ID', () => {
    // Create a generation for Google (future provider)
    const generation = GenerationFactory.create({
      organizationId: 'org-123',
      userId: 'user-456',
      prompt: 'A bird flying',
      modelName: 'imagen-3',
      providerName: 'google',
    });

    // Set external provider ID with Google format
    const googleId = 'job_456def';
    generation.setExternalProviderId(googleId);

    // Convert to database row
    const row = GenerationRowMapper.toRow(generation);
    
    // Verify all providers use the same generic field
    expect(row.external_provider_id).toBe(googleId);

    // Database mapping should work correctly
    const reconstructed = GenerationRowMapper.fromRow({
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    expect(reconstructed.externalProviderId).toBe(googleId);
  });

  it('should maintain backward compatibility with null external provider ID', () => {
    // Create a generation without setting any provider ID
    const generation = GenerationFactory.create({
      organizationId: 'org-123',
      userId: 'user-456',
      prompt: 'A mountain landscape',
      modelName: 'flux-schnell',
      providerName: 'replicate',
    });

    // Don't set any external provider ID
    const row = GenerationRowMapper.toRow(generation);
    
    // Generic field should be null
    expect(row.external_provider_id).toBeNull();

    // Reconstruction should work correctly
    const reconstructed = GenerationRowMapper.fromRow({
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    expect(reconstructed.externalProviderId).toBeNull();
  });
}); 