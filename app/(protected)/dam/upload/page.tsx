/**
 * Next.js Server Component that renders the Digital Asset Management (DAM)
 * upload page, including a title, a back link, and the AssetUploader component
 * which handles the actual file upload functionality.
 */

import React from 'react';
import Link from 'next/link';
import { AssetUploader } from '@/components/dam/AssetUploader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// This is now a Server Component again
export default function DamUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Upload Assets</h1>
        <Link href="/dam" passHref legacyBehavior>
          <Button variant="outline" asChild>
            <a>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </a>
          </Button>
        </Link>
      </div>

      {/* Removed Test Button - will move logic into AssetUploader if needed */}
      
      <AssetUploader />
    </div>
  );
} 