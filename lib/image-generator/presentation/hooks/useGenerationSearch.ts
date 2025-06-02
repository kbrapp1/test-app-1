import { useState, useMemo } from 'react';
import { GenerationDto } from '../../application/dto';

export interface UseGenerationSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredGenerations: GenerationDto[];
  clearSearch: () => void;
}

export const useGenerationSearch = (generations: GenerationDto[]): UseGenerationSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGenerations = useMemo(() => {
    if (!searchQuery.trim()) {
      return generations;
    }
    
    return generations.filter(gen => 
      gen.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [generations, searchQuery]);

  const clearSearch = () => setSearchQuery('');

  return {
    searchQuery,
    setSearchQuery,
    filteredGenerations,
    clearSearch,
  };
}; 