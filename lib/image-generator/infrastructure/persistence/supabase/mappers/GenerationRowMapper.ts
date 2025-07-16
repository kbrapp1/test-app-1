import { Generation } from '../../../../domain/entities/Generation';
import { GenerationSerializationService, GenerationSnapshot } from '../../../../domain/services/GenerationSerializationService';

// Database row type
export interface GenerationRow {
  id: string;
  organization_id: string;
  user_id: string;
  prompt: string;
  model_name: string;
  provider_name: string;
  status: string;
  result_image_url: string | null;
  cost_cents: number;
  generation_time_seconds: number | null;
  image_width: number;
  image_height: number;
  saved_to_dam: boolean;
  dam_asset_id: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Provider analytics fields added in migration 20250601224802
  estimated_cost_cents: number | null;
  external_provider_id: string | null;
  aspect_ratio: string;
  base_image_url: string | null;
  second_image_url: string | null;
  edit_type: string;
  source_dam_asset_id: string | null;
}

export class GenerationRowMapper {
  static toRow(generation: Generation): Omit<GenerationRow, 'created_at' | 'updated_at'> & {
    created_at?: string;
    updated_at?: string;
  } {
    const snapshot = GenerationSerializationService.toSnapshot(generation);
    
    return {
      id: snapshot.id,
      organization_id: snapshot.organizationId,
      user_id: snapshot.userId,
      prompt: snapshot.prompt,
      model_name: snapshot.modelName,
      provider_name: snapshot.providerName,
      status: snapshot.status,
      result_image_url: snapshot.resultImageUrl,
      cost_cents: snapshot.costCents,
      generation_time_seconds: snapshot.generationTimeSeconds,
      image_width: snapshot.imageWidth,
      image_height: snapshot.imageHeight,
      saved_to_dam: snapshot.savedToDAM,
      dam_asset_id: snapshot.damAssetId,
      error_message: snapshot.errorMessage,
      metadata: snapshot.metadata,
      created_at: snapshot.createdAt.toISOString(),
      updated_at: snapshot.updatedAt.toISOString(),
      // Provider analytics fields
      estimated_cost_cents: generation.costCents,
      external_provider_id: snapshot.externalProviderId, // 🆕 Use generic provider ID
      aspect_ratio: snapshot.aspectRatio,
      base_image_url: snapshot.baseImageUrl,
      second_image_url: snapshot.secondImageUrl,
      edit_type: snapshot.editType,
      source_dam_asset_id: snapshot.sourceDamAssetId,
    };
  }

  static fromRow(row: GenerationRow): Generation {
    const snapshot: GenerationSnapshot = {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      prompt: row.prompt,
      modelName: row.model_name,
      providerName: row.provider_name,
      status: row.status,
      resultImageUrl: row.result_image_url,
      baseImageUrl: row.base_image_url,
      secondImageUrl: row.second_image_url,
      externalProviderId: row.external_provider_id, // 🆕 Use generic provider ID from DB
      costCents: row.cost_cents,
      generationTimeSeconds: row.generation_time_seconds,
      imageWidth: row.image_width,
      imageHeight: row.image_height,
      aspectRatio: row.aspect_ratio || '1:1', // Use stored aspect ratio or default
      editType: (row.edit_type || 'text-to-image') as 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap',
      savedToDAM: row.saved_to_dam,
      damAssetId: row.dam_asset_id,
      sourceDamAssetId: row.source_dam_asset_id,
      errorMessage: row.error_message,
      metadata: row.metadata,
      seed: null, // Not stored in current schema
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return GenerationSerializationService.fromSnapshot(snapshot);
  }

  static fromRows(rows: GenerationRow[]): Generation[] {
    return rows.map(row => this.fromRow(row));
  }
} 