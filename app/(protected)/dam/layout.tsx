import React from 'react';
import { FolderSidebar } from '@/lib/dam/presentation/components/navigation';
import { DamDragDropProvider } from '@/lib/dam/presentation/components/DamDragDropProvider';
import { getRootFolders } from '@/lib/dam/application/actions/navigation.actions';
import type { PlainFolder } from '@/lib/dam/types/dam.types';


// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export default async function DamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load folders server-side for fast initial render
  let serverFolders: PlainFolder[] = [];
  try {
    serverFolders = await getRootFolders();
  } catch (error) {
    // Silent fallback - folders will be empty array
    if (process.env.NODE_ENV === 'development') {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('DamLayout: Server-side folder loading failed:', errorMessage);
    }
  }

  return (
    <DamDragDropProvider>
      <div className="flex h-full">
        <FolderSidebar initialFolders={serverFolders} />
        {children}
      </div>
    </DamDragDropProvider>
  );
} 