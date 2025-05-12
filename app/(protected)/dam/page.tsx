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
import { UploadCloud, Search, X } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const currentSearchTerm = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : '';

  // Use the optimized recursive fetch
  const breadcrumbPath = await fetchBreadcrumbPathRecursive(supabase, currentFolderId);

  return (
    <TooltipProvider>
      <main className="flex-1 px-4 pt-2 pb-4 overflow-auto">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-4 w-full">
            <form method="GET" action="/dam" className="flex items-center gap-2 grow max-w-2xl">
              {currentFolderId && !currentSearchTerm && (
                <input type="hidden" name="folderId" value={currentFolderId} />
              )}
              <div className="relative grow">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search by name</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  type="search"
                  name="q"
                  placeholder="Search all assets & folders..."
                  className="pl-10 pr-13 py-2 h-10 text-base w-full"
                  defaultValue={currentSearchTerm}
                />
                {currentSearchTerm && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/dam${currentFolderId ? `?folderId=${currentFolderId}` : ''}`}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                        aria-label="Clear search"
                      >
                        <X className="h-8 w-8 text-muted-foreground hover:text-foreground" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear search</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="submit" variant="default" size="icon" aria-label="Search" className="shrink-0">
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search</p>
                </TooltipContent>
              </Tooltip>
            </form>

            {/* Conditional Upload Button - aligned to the right of the search form */}
            <div className="shrink-0 ml-auto">
              {!currentSearchTerm && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline">
                      <a
                        href={currentFolderId ? `/dam/upload?folderId=${currentFolderId}` : '/dam/upload'}
                        aria-label="Upload to current folder"
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload to Folder
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload to current folder</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {currentSearchTerm && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline">
                      <a href="/dam/upload" aria-label="Upload new assets">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload Assets
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload new assets</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {!currentSearchTerm && (
            <div className="grow min-w-[200px]">
               <DamBreadcrumbs path={breadcrumbPath} />
            </div>
          )}
          {currentSearchTerm && (
               <div className="text-sm text-muted-foreground">
                  Showing search results for "<strong>{currentSearchTerm}</strong>". <Link href="/dam" className="text-primary hover:underline">Clear search</Link>
              </div>
          )}
        </div>

        <div>
          <AssetGalleryClient currentFolderId={currentFolderId} initialSearchTerm={currentSearchTerm} />
        </div>
      </main>
    </TooltipProvider>
  );
}