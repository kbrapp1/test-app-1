import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FolderSidebar } from '@/components/dam/folder-sidebar';
import type { Folder } from '@/types/dam';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// Function to fetch root folders
async function fetchFolders(supabase: SupabaseClient): Promise<Folder[]> {
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) return [];
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('organization_id', activeOrgId)
    .is('parent_folder_id', null)
    .order('name', { ascending: true });
  if (error) console.error('Error fetching folders for layout:', error);
  return data || [];
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