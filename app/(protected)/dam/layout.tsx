import React from 'react';
import { FolderSidebar } from '@/lib/dam/presentation/components/navigation';
import { DamDragDropProvider } from '@/lib/dam/presentation/components/DamDragDropProvider';
import { getRootFolders } from '@/lib/dam/application/actions/navigation.actions';

export default async function DamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use DDD-compliant server action instead of direct infrastructure access
  const folders = await getRootFolders();

  return (
    <DamDragDropProvider>
      <div className="flex h-full">
        <FolderSidebar initialFolders={folders} />
        {children}
      </div>
    </DamDragDropProvider>
  );
} 