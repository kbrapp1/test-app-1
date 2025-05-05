import { useState } from 'react';
import { Folder, CombinedItem } from '@/types/dam';
import { useToast } from '@/components/ui/use-toast';

interface UseFolderFetchResult {
  /**
   * Fetches child folders for a given parent folder ID
   */
  fetchFolderChildren: (folderId: string) => Promise<Folder[]>;
  /**
   * True when a fetch is in progress
   */
  isLoading: boolean;
  /**
   * Error message if fetch failed
   */
  error: string | null;
}

/**
 * Custom hook for fetching folder data from the DAM API
 * Provides consistent error handling and loading state
 */
export function useFolderFetch(): UseFolderFetchResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFolderChildren = async (folderId: string): Promise<Folder[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/dam?folderId=${folderId}`);
      
      if (!res.ok) {
        const errorMsg = `API request failed with status ${res.status}`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await res.json() as CombinedItem[];
      // Filter to get only folder items
      const folderChildren = data.filter(item => item.type === 'folder') as Folder[];
      
      return folderChildren;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch folders';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Failed to load folders",
        description: errorMessage
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchFolderChildren,
    isLoading,
    error
  };
} 