import { useState, useMemo } from 'react';
import { GenerationDto } from '../../application/dto';
import { useGenerationSearch as useServerSearch } from './queries/useGenerationSearch';

export interface UseGenerationSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredGenerations: GenerationDto[];
  clearSearch: () => void;
  isSearching: boolean;
  isSearchLoading: boolean;
}

/**
 * Combined search hook that intelligently handles search vs browsing modes
 * 
 * **Search Behavior:**
 * - 🔍 **Search Mode**: When user types search term → Server-side database search across ALL generations
 * - 📜 **Browse Mode**: When search is empty → Shows infinite scroll data (only loaded generations)
 * 
 * **Best Practice Benefits:**
 * - ✅ Can find ANY generation in database (not limited to loaded data)
 * - ✅ Search is not limited by infinite scroll pagination
 * - ✅ Fast server-side SQL search with proper indexing
 * - ✅ Smooth transition between search and browse modes
 * - ✅ Prevents false negatives from client-side filtering
 * 
 * **Previous Problem:**
 * - ❌ Old implementation only searched through loaded generations in memory
 * - ❌ Could not find older generations that weren't loaded yet
 * - ❌ Users thought search was broken when older prompts didn't appear
 */
export const useGenerationSearch = (generations: GenerationDto[]): UseGenerationSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');

  const isSearching = !!searchQuery.trim();
  
  // Server-side search when search term exists
  const { 
    data: searchResults = [], 
    isLoading: isSearchLoading 
  } = useServerSearch(searchQuery, isSearching);

  const filteredGenerations = useMemo(() => {
    if (isSearching) {
      // Return server-side search results (searches entire database)
      return searchResults;
    } else {
      // Return infinite scroll data when not searching (loaded generations only)
      return generations;
    }
  }, [isSearching, searchResults, generations]);

  const clearSearch = () => setSearchQuery('');

  return {
    searchQuery,
    setSearchQuery,
    filteredGenerations,
    clearSearch,
    isSearching,
    isSearchLoading,
  };
}; 