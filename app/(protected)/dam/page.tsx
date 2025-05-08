/**
 * Next.js Server Component that renders the Digital Asset Management (DAM)
 * gallery page, including a folder sidebar, main content area, and breadcrumb
 * navigation. It also includes a client-side asset gallery component for
 * rendering uploaded images.
 */

import Link from 'next/link';
import { cookies } from 'next/headers';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { AssetGalleryClient } from '@/components/dam/AssetGalleryClient';
import type { Folder } from '@/types/dam';
import { DamBreadcrumbs, type BreadcrumbItemData } from '@/components/dam/dam-breadcrumbs';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
// TODO: Import Breadcrumb component when created

// Force dynamic rendering for this page because Supabase client uses cookies
export const dynamic = 'force-dynamic';

// Optimized function to fetch breadcrumb path using a recursive CTE
async function fetchBreadcrumbPathRecursive(supabase: SupabaseClient, folderId: string | null): Promise<BreadcrumbItemData[]> {
  const path: BreadcrumbItemData[] = [{ id: null, name: 'Root', href: '/dam' }];

  if (!folderId) {
    return path;
  }

  // Call RPC and parse response safely without using `any`
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rpcRaw = await supabase.rpc('get_folder_path', { p_folder_id: folderId }) as unknown;
  const { data: rpcData, error } = rpcRaw as { data: { id: string; name: string }[] | null; error: unknown };

  if (error) {
    console.error('Error fetching folder path via RPC:', error);
    // Fallback or specific error handling
    path.push({ id: folderId, name: 'Error', href: `/dam?folderId=${folderId}` });
    return path;
  }

  // The RPC function returns the path in the correct order (Root -> ... -> Current)
  // Skip the first item if it's the root, as we add it manually
  const rpcRows = rpcData ?? [];
  const rpcPath = rpcRows.map(p => ({
    id: p.id,
    name: p.name,
    href: `/dam?folderId=${p.id}`
  }));

  return [...path, ...rpcPath];
}

// Define the page component with explicit typing for searchParams
export default async function DamGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams;
  const folderParam = resolvedSearchParams?.folderId;
  const currentFolderId =
    Array.isArray(folderParam) ? folderParam[0] :
    typeof folderParam === 'string' ? folderParam :
    null;

  // Use the optimized recursive fetch
  const breadcrumbPath = await fetchBreadcrumbPathRecursive(supabase, currentFolderId);

  return (
    <main className="flex-1 p-4 overflow-auto">
      <div className="mb-4 flex items-center justify-between">
        <DamBreadcrumbs path={breadcrumbPath} />
        <div className="flex items-center space-x-2">
          <Link 
            href={currentFolderId ? `/dam/upload?folderId=${currentFolderId}` : '/dam/upload'}
            passHref 
            legacyBehavior
          >
            <Button asChild>
              <a>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload Assets
              </a>
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-4">
        <AssetGalleryClient currentFolderId={currentFolderId} />
      </div>
    </main>
  );
}