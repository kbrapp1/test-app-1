'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { listTextAssets } from '@/lib/actions/dam/text-asset.actions'; // Import the action
import { ScrollArea } from "@/components/ui/scroll-area"; // For potentially long lists
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileTextIcon, AlertCircleIcon, SearchIcon } from 'lucide-react';
import { ComponentAsset as Asset } from '@/lib/dam/types/component'; // Keep for potential future use
import { TextAssetSummaryDto } from '@/lib/dam/application/use-cases/ListTextAssetsUseCase'; // Import the correct type

interface AssetSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Use the TextAssetSummaryDto type for the callback since that's what listTextAssets returns
  onAssetSelect: (asset: TextAssetSummaryDto) => void; 
  trigger?: React.ReactNode;
}

export function AssetSelectorModal({ 
  open,
  onOpenChange,
  onAssetSelect,
  trigger
}: AssetSelectorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<TextAssetSummaryDto[]>([]); // Updated type
  const [hasFetched, setHasFetched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Add state for the debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  // Remove commented out hook usage
  // const debouncedSearchTerm = useDebounce(searchTerm, 300); // Commented out
  // const debouncedSearchTerm = searchTerm; // Use direct search term for now

  // Add useEffect for debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    // Cleanup function to clear the timeout if searchTerm changes before delay finishes
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]); // Only re-run the effect if searchTerm changes

  useEffect(() => {
    // Fetch logic now depends on 'open' and 'hasFetched'
    if (open && !hasFetched && !isLoading) { // Check hasFetched here
        const fetchData = async () => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await listTextAssets(); 
            if (result.success && result.data) {
              setAssets(result.data); // Use the TextAssetSummaryDto data directly
            } else {
              setError(result.error || 'Failed to fetch assets.');
            }
          } catch (err) {
            console.error("Failed to list text assets:", err);
            setError('An unexpected error occurred while fetching assets.');
          } finally {
            setIsLoading(false);
            setHasFetched(true); // Mark as fetched after the attempt
          }
        };
        fetchData();
    }
    if (!open) {
        setHasFetched(false); 
        setSearchTerm(''); 
        setDebouncedSearchTerm(''); // Reset debounced term as well
    }
    // Corrected dependency array
  }, [open, hasFetched, isLoading]); // Keep isLoading to prevent potential race conditions if closed quickly

  // Filter assets based on the debounced search term
  const filteredAssets = useMemo(() => {
    if (!debouncedSearchTerm) {
      return assets;
    }
    return assets.filter(asset => 
      asset.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    // Use debouncedSearchTerm for filtering
  }, [assets, debouncedSearchTerm]);

  // Use the TextAssetSummaryDto type for the parameter since that's what listTextAssets returns
  const handleSelect = (asset: TextAssetSummaryDto) => { 
    onAssetSelect(asset);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Select Text Asset</DialogTitle>
          <DialogDescription>
            Browse and select a text asset (.txt, .md) from your library. You can use the search bar to filter by name.
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assets by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8"
          />
        </div>

        <ScrollArea className="h-[400px] w-full p-4 border rounded-md mt-2">
          {isLoading && !hasFetched && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" data-testid="skeleton-item" />
              <Skeleton className="h-10 w-full" data-testid="skeleton-item" />
              <Skeleton className="h-10 w-full" data-testid="skeleton-item" />
            </div>
          )}
          {!isLoading && error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {/* Use filteredAssets for rendering */}
          {!isLoading && !error && filteredAssets.length === 0 && (
             (hasFetched && debouncedSearchTerm ? (<div className="flex flex-col items-center justify-center h-full text-muted-foreground">
               <SearchIcon className="h-12 w-12 mb-2" />
               <p>No assets found matching "{debouncedSearchTerm}".</p> 
             </div>) : hasFetched ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileTextIcon className="h-12 w-12 mb-2" />
                  <p>No text assets found in your library.</p>
                  <p className="text-sm">(Supported types: .txt, .md)</p> 
              </div>
             ) : null) // Still loading or initial state
          )}
          {!isLoading && !error && filteredAssets.length > 0 && (
            <ul className="space-y-2">
              {/* Map over filteredAssets */}
              {filteredAssets.map((asset) => (
                <li key={asset.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-accent">
                  <div className='flex items-center gap-2'>
                     <FileTextIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                     <span className="truncate" title={asset.name}>{asset.name}</span>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelect(asset)}
                  >
                    Select
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        {/* Optional: Add pagination if list can be very long */} 
      </DialogContent>
    </Dialog>
  );
} 