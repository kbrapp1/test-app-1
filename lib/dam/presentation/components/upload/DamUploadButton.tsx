import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UploadCloud } from 'lucide-react';

interface DamUploadButtonProps {
  currentFolderId: string | null;
}

export function DamUploadButton({ currentFolderId }: DamUploadButtonProps) {
  const router = useRouter();

  const navigateToUpload = () => {
    const uploadPath = currentFolderId ? `/dam/upload?folderId=${currentFolderId}` : '/dam/upload';
    router.push(uploadPath);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="hidden sm:flex items-center gap-2" onClick={navigateToUpload}>
              <UploadCloud className="h-5 w-5" />
              Upload
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload assets</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button variant="outline" size="icon" className="sm:hidden" onClick={navigateToUpload}>
        <UploadCloud className="h-5 w-5" />
        <span className="sr-only">Upload</span>
      </Button>
    </>
  );
} 
