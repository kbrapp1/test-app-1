/**
 * Next.js Server Component that renders the Digital Asset Management (DAM)
 * upload page, including a title, a back link, and the AssetUploader component
 * which handles the actual file upload functionality.
 */

import React from 'react';
import Link from 'next/link';
import { AssetUploader } from '@/lib/dam/presentation/components/upload/AssetUploader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

export default async function DamUploadPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Await the dynamic searchParams API before using its properties
  const { folderId: folderParam } = await searchParams;

  const currentFolderId =
    Array.isArray(folderParam) ? folderParam[0] :
    typeof folderParam === 'string' ? folderParam :
    null;

  return (
    // Apply consistent padding and layout like the gallery page
    <main className="flex-1 p-4 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Upload Assets</h1>
        {/* Link back to the current folder or root */}
        <Link href={currentFolderId ? `/dam?folderId=${currentFolderId}` : '/dam'}>
          <Button variant="outline" asChild>
            <span>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </span>
          </Button>
        </Link>
      </div>
      {/* Use the new domain-based AssetUploader component */}
      <AssetUploader currentFolderId={currentFolderId} />
    </main>
  );
} 