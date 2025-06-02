import { useMemo } from 'react';
import { GenerationDto } from '../../../application/dto';

/**
 * Hook for computed generation state
 * Single responsibility: Calculate derived state from generations list
 */
export function useGenerationStateComputed(generations: GenerationDto[]) {
  return useMemo(() => {
    const activeGenerations = generations.filter(g => 
      ['pending', 'processing'].includes(g.status)
    );
    
    const completedGenerations = generations.filter(g => 
      g.status === 'completed'
    );

    const recentGenerations = generations.slice(0, 10);
    const hasMoreGenerations = generations.length > 10;

    return {
      activeGenerations,
      completedGenerations,
      recentGenerations,
      hasMoreGenerations,
      totalCount: generations.length,
      activeCount: activeGenerations.length,
      completedCount: completedGenerations.length,
      activeGenerationIds: activeGenerations.map(g => g.id),
    };
  }, [generations]);
} 