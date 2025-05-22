import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FolderSidebar } from '@/components/dam/folder-sidebar';
// import type { Folder } from '@/types/dam'; // REMOVED Old import
import type { Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder'; // ADDED Correct import
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository'; // ADDED import

// Function to fetch root folders
async function fetchFolders(supabase: SupabaseClient): Promise<DomainFolder[]> { // MODIFIED Return type
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) return [];
  console.log('[DamLayout] Fetching root folders for org:', activeOrgId);
  const repo = new SupabaseFolderRepository(supabase); // Use repository that handles mapping via FolderMapper
  let folders: DomainFolder[] = [];
  try {
    folders = await repo.findRootFolders(activeOrgId);
    console.log('[DamLayout] Fetched root folders:', folders.length);
  } catch (error) {
    console.error('Error fetching root folders in repository:', error);
  }
  return folders;
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