'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { listTextAssets } from '@/lib/actions/dam'; // Import the action
import { ScrollArea } from "@/components/ui/scroll-area"; // For potentially long lists
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileTextIcon, AlertCircleIcon } from 'lucide-react';
import { Asset } from '@/types/dam'; // Import the shared Asset type

// Remove local TextAsset type - use imported Asset type
// type TextAsset = {
//   id: string;
//   name: string;
//   created_at: string;
//   // Add other relevant fields if returned by the action
// };

interface AssetSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Use the imported Asset type for the callback
  onAssetSelect: (asset: Asset) => void; 
  trigger?: React.ReactNode;
}

export function AssetSelectorModal({ 
  open,
  onOpenChange,
  onAssetSelect,
  trigger
}: AssetSelectorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Use the imported Asset type for state
  const [assets, setAssets] = useState<Asset[]>([]); 
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (open && !hasFetched && !isLoading) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Assume listTextAssets returns data compatible with Asset[]
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
    if (!open) {
        setHasFetched(false); // Reset fetch status when closed
    }
  }, [open, hasFetched, isLoading]);

  // Use the imported Asset type for the parameter
  const handleSelect = (asset: Asset) => { 
    onAssetSelect(asset);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Select Text Asset</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full p-4 border rounded-md">
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
          {!isLoading && !error && assets.length === 0 && hasFetched && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileTextIcon className="h-12 w-12 mb-2" />
              <p>No text assets found in your library.</p>
              <p className="text-sm">(Supported types: .txt, .md)</p> 
              {/* TODO: Add link to upload page? */}
            </div>
          )}
          {!isLoading && !error && assets.length > 0 && (
            <ul className="space-y-2">
              {assets.map((asset) => (
                <li key={asset.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-accent">
                  <div className='flex items-center gap-2'>
                     <FileTextIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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