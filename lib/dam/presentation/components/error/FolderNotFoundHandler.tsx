'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FolderNotFoundHandlerProps {
  folderId: string;
  redirectDelay?: number;
}

/**
 * FolderNotFoundHandler - Client Component for Graceful Error Handling
 * 
 * This component provides a user-friendly interface when a folder is not found:
 * - Shows clear error message
 * - Provides manual navigation options
 * - Automatically redirects to root after delay
 * - Follows DDD presentation patterns
 */
export const FolderNotFoundHandler: React.FC<FolderNotFoundHandlerProps> = ({
  folderId,
  redirectDelay = 5000
}) => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dam');
    }, redirectDelay);

    return () => clearTimeout(timer);
  }, [router, redirectDelay]);

  const handleGoToRoot = () => {
    router.push('/dam');
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Folder Not Found</AlertTitle>
          <AlertDescription>
            The folder you're looking for (ID: {folderId}) could not be found. 
            It may have been deleted or moved.
          </AlertDescription>
        </Alert>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            You will be automatically redirected to the root folder in {Math.ceil(redirectDelay / 1000)} seconds.
          </p>
          
          <Button onClick={handleGoToRoot} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Go to Root Folder Now
          </Button>
        </div>
      </div>
    </div>
  );
}; 
