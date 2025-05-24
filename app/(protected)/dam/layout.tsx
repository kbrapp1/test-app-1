import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FolderSidebar } from '@/lib/dam/presentation/components/navigation';
// import type { Folder } from '@/types/dam'; // REMOVED Old import
import type { Folder as DomainFolder, PlainFolder } from '@/lib/dam/types/dam.types'; // UPDATED to use shared types
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository'; // ADDED import

// Function to fetch root folders and convert to plain objects
async function fetchFolders(supabase: SupabaseClient): Promise<PlainFolder[]> { // MODIFIED Return type
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) return [];
  const repo = new SupabaseFolderRepository(supabase); // Use repository that handles mapping via FolderMapper
  let folders: DomainFolder[] = [];
  try {
    folders = await repo.findRootFolders(activeOrgId);
  } catch (error) {
    console.error('Error fetching root folders in repository:', error);
  }
  // Convert domain entities to plain objects for client component serialization
  return folders.map(folder => folder.toPlainObject());
}

export default async function DamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
            get: async (name: string) => {
                const cookieStore = await cookies(); 
                return cookieStore.get(name)?.value;
            },
        },
    }
  );

  const folders = await fetchFolders(supabase);

  return (
    <div className="flex h-full">
      <FolderSidebar initialFolders={folders} />
      {children}
    </div>
  );
} 