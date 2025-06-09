import { Generation } from '../../domain/entities/Generation';
import { GenerationDto, GenerationStatusDto, GenerationStatsDto } from '../dto';
import { GenerationStats } from '../../infrastructure/persistence/supabase/services/GenerationStatsCalculator';
import { Prompt } from '../../domain/value-objects/Prompt';
import { GenerationStatus } from '../../domain/value-objects/GenerationStatus';

/**
 * Mapper for converting between Generation domain entities and DTOs
 * Follows DDD principles by keeping domain and application layers separate
 */
export class GenerationMapper {
  
  /**
   * Convert domain entity to DTO for application layer
   */
  static toDto(generation: Generation): GenerationDto {
    return {
      id: generation.getId(),
      prompt: generation.prompt.toString(),
      imageUrl: generation.resultImageUrl || undefined,
      baseImageUrl: generation.baseImageUrl || undefined,
      secondImageUrl: generation.secondImageUrl || undefined,
      status: this.mapStatusToDto(generation.getStatus()),
      width: generation.imageWidth,
      height: generation.imageHeight,
      aspectRatio: generation.aspectRatio,
      costCents: generation.getCostCents(),
      createdAt: generation.createdAt.toISOString(),
      updatedAt: generation.updatedAt.toISOString(),
      generationTimeSeconds: generation.getGenerationTimeSeconds() || undefined,
      savedToDAM: generation.isSavedToDAM(),
      replicateId: generation.externalProviderId || undefined,
      errorMessage: generation.errorMessage || undefined,
      editType: generation.editType,
      damAssetId: generation.damAssetId || undefined,
      modelName: generation.modelName,
    };
  }

  /**
   * Convert DTO to domain entity (for reconstruction from external data)
   * Note: This is typically used only by infrastructure layer mappers
   */
  static toDomainEntity(dto: GenerationDto): Generation {
    // For DTOs, we assume the data is already validated
    // This mapper is primarily for application layer boundaries
    throw new Error('Use Infrastructure layer mappers for reconstructing domain entities from external data');
  }

  /**
   * Convert multiple domain entities to DTOs
   */
  static toDtoList(generations: Generation[]): GenerationDto[] {
    return generations.map(generation => this.toDto(generation));
  }

  /**
   * Convert multiple DTOs to domain entities
   * Note: Use Infrastructure layer mappers for this operation
   */
  static toDomainEntityList(dtos: GenerationDto[]): Generation[] {
    throw new Error('Use Infrastructure layer mappers for reconstructing domain entities from external data');
  }

  /**
   * Create stats DTO from domain entities (legacy method for compatibility)
   */
  static toStatsDto(generations: Generation[]): GenerationStatsDto {
    const textToImageCount = generations.filter(g => g.editType === 'text-to-image').length;
    const imageEditingCount = generations.filter(g => g.editType === 'image-editing').length;
    
    return {
      totalGenerations: generations.length,
      completedGenerations: generations.filter(g => g.getStatus().toString() === 'completed').length,
      failedGenerations: generations.filter(g => g.getStatus().toString() === 'failed').length,
      totalCostCents: generations.reduce((sum, g) => sum + g.getCostCents(), 0),
      avgGenerationTimeSeconds: generations.length > 0 
        ? generations.reduce((sum, g) => sum + (g.getGenerationTimeSeconds() || 0), 0) / generations.length
        : 0,
      savedToDAMCount: generations.filter(g => g.isSavedToDAM()).length,
      textToImageCount,
      imageEditingCount,
    };
  }

  /**
   * Convert GenerationStats (from repository aggregation) to DTO
   * Preferred method for efficient stats queries
   */
  static statsToDto(stats: GenerationStats): GenerationStatsDto {
    return {
      totalGenerations: stats.totalGenerations,
      completedGenerations: stats.completedGenerations,
      failedGenerations: stats.failedGenerations,
      totalCostCents: stats.totalCostCents,
      avgGenerationTimeSeconds: stats.avgGenerationTimeSeconds,
      savedToDAMCount: stats.savedToDAMCount,
      // These fields are not available in GenerationStats, provide defaults
      textToImageCount: 0,
      imageEditingCount: 0,
    };
  }

  /**
   * Map domain status to DTO status
   */
  private static mapStatusToDto(status: GenerationStatus): GenerationStatusDto {
    return status.toString() as GenerationStatusDto;
  }
} 