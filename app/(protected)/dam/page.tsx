import React, { Suspense } from 'react';
import Link from 'next/link';
import { AssetGallery } from '@/components/dam/AssetGallery';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

export default function DamGalleryPage() {
  // TODO: Add user session check / redirect if needed for protected route
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Asset Library</h1>
        <Link href="/dam/upload" passHref legacyBehavior>
            <Button asChild>
                 <a>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload Assets
                </a>
            </Button>
        </Link>
      </div>
      <Suspense fallback={<p className="text-center">Loading assets...</p>}>
        <AssetGallery />
      </Suspense>
    </div>
  );
}