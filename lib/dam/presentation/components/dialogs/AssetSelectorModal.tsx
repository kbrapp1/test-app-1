'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileTextIcon, AlertCircleIcon, SearchIcon } from 'lucide-react';
import { listTextAssets } from '@/lib/dam';
import { TextAssetSummaryDto } from '../../../application/use-cases/assets/ListTextAssetsUseCase';

export interface AssetSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetSelect: (asset: TextAssetSummaryDto) => void;
  trigger?: React.ReactNode;
}

/**
 * Domain presentation component for asset selection
 * Provides text asset browsing and selection with search functionality
 * Uses domain patterns for consistent asset management
 */
export const AssetSelectorModal: React.FC<AssetSelectorModalProps> = ({ 
  open,
  onOpenChange,
  onAssetSelect,
  trigger
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<TextAssetSummaryDto[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term for better performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch assets when modal opens
  useEffect(() => {
    if (open && !hasFetched && !isLoading) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await listTextAssets();
          if (result.success && result.data) {
            setAssets(result.data);
          } else {
            setError(result.error || 'Failed to fetch assets.');
          }
        } catch (err) {
          console.error("Failed to list text assets:", err);
          setError('An unexpected error occurred while fetching assets.');
        } finally {
          setIsLoading(false);
          setHasFetched(true);
        }
      };
      fetchData();
    }
    
    // Reset state when modal closes
    if (!open) {
      setHasFetched(false);
      setSearchTerm('');
      setDebouncedSearchTerm('');
    }
  }, [open, hasFetched, isLoading]);

  // Filter assets based on search term
  const filteredAssets = useMemo(() => {
    if (!debouncedSearchTerm) {
      return assets;
    }
    return assets.filter(asset => 
      asset.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [assets, debouncedSearchTerm]);

  const handleSelect = (asset: TextAssetSummaryDto) => {
    onAssetSelect(asset);
    onOpenChange(false);
  };

  const renderEmptyState = () => {
    if (hasFetched && debouncedSearchTerm) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <SearchIcon className="h-12 w-12 mb-2" />
          <p>No assets found matching "{debouncedSearchTerm}".</p>
        </div>
      );
    }
    
    if (hasFetched) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <FileTextIcon className="h-12 w-12 mb-2" />
          <p>No text assets found in your library.</p>
          <p className="text-sm">(Supported types: .txt, .md)</p>
        </div>
      );
    }
    
    return null;
  };

  const renderLoadingState = () => (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  const renderErrorState = () => (
    <Alert variant="destructive">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  const renderAssetList = () => (
    <ul className="space-y-2">
      {filteredAssets.map((asset) => (
        <AssetSelectorItem
          key={asset.id}
          asset={asset}
          onSelect={handleSelect}
        />
      ))}
    </ul>
  );

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
          {isLoading && !hasFetched && renderLoadingState()}
          {!isLoading && error && renderErrorState()}
          {!isLoading && !error && filteredAssets.length === 0 && renderEmptyState()}
          {!isLoading && !error && filteredAssets.length > 0 && renderAssetList()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

interface AssetSelectorItemProps {
  asset: TextAssetSummaryDto;
  onSelect: (asset: TextAssetSummaryDto) => void;
}

/**
 * Domain component for individual asset selection item
 * Handles asset display and selection interaction
 */
const AssetSelectorItem: React.FC<AssetSelectorItemProps> = ({ asset, onSelect }) => (
  <li className="flex items-center justify-between p-2 border rounded-md hover:bg-accent transition-colors">
    <div className='flex items-center gap-2'>
      <FileTextIcon className="h-5 w-5 text-muted-foreground shrink-0" />
      <span className="truncate" title={asset.name}>{asset.name}</span>
    </div>
    <Button 
      variant="outline"
      size="sm"
      onClick={() => onSelect(asset)}
    >
      Select
    </Button>
  </li>
); 
