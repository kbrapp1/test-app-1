/**
 * Next.js Server Component that renders the Digital Asset Management (DAM)
 * gallery page, including a folder sidebar, main content area, and breadcrumb
 * navigation. It also includes a client-side asset gallery component for
 * rendering uploaded images.
 */

import Link from 'next/link';
import { cookies } from 'next/headers';
// import { ReadonlyURLSearchParams } from 'next/navigation'; // No longer directly used here
// import { Button } from '@/components/ui/button'; // Moved to client component
// import { UploadCloud, Search, X } from 'lucide-react'; // Moved to client component
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
// import { Input } from '@/components/ui/input'; // Moved to client component
/*
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // TooltipProvider is in client component
*/


// Domain imports
import { DamPageClient, type BreadcrumbItemData } from '@/lib/dam/presentation/components/page';
// import { getActiveOrganizationId } from '@/lib/auth/server-action'; // Not directly used here, but auth context is via withAuth

export const dynamic = 'force-dynamic'; // REINSTATED

// Optimized function to fetch breadcrumb path using a recursive CTE
async function fetchBreadcrumbPathRecursive(supabase: SupabaseClient, folderId: string | null): Promise<BreadcrumbItemData[]> {
  const path: BreadcrumbItemData[] = [{ id: null, name: 'Root', href: '/dam' }];

  if (!folderId) {
    return path;
  }

  const rpcRaw = await supabase.rpc('get_folder_path', { p_folder_id: folderId }) as unknown;
  const { data: rpcData, error } = rpcRaw as { data: { id: string; name: string }[] | null; error: unknown };

  if (error) {
    console.error('Error fetching folder path via RPC:', error);
    path.push({ id: folderId, name: 'Error', href: `/dam?folderId=${folderId}` });
    return path;
  }

  const rpcRows = rpcData ?? [];
  const rpcPath = rpcRows.map(p => ({
    id: p.id,
    name: p.name,
    href: `/dam?folderId=${p.id}`
  }));

  return [...path, ...rpcPath];
}

export default async function DamGalleryPage({
  searchParams,
}: {
  searchParams: any; // Forcing type to any for diagnostic purposes
}) {
  // Await searchParams to safely use dynamic API
  const resolvedSearchParams = await searchParams;
  // Access searchParams with optional chaining after casting to any
  const folderIdParamInput = resolvedSearchParams?.folderId;
  const searchParamInput = resolvedSearchParams?.search;

  const currentFolderId =
    Array.isArray(folderIdParamInput) ? folderIdParamInput[0] :
    typeof folderIdParamInput === 'string' ? folderIdParamInput :
    null;

  const currentSearchTerm = 
    Array.isArray(searchParamInput) ? searchParamInput[0] :
    typeof searchParamInput === 'string' ? searchParamInput :
    '';

  // Now proceed with Supabase client creation and other async operations
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

  const breadcrumbPath = await fetchBreadcrumbPathRecursive(supabase, currentFolderId);

  return (
    // <TooltipProvider> REMOVED: Now inside DamPageClientView or not needed at this level
      <main className="flex-1 px-4 pt-2 pb-4 overflow-auto">
        {/* 
          Breadcrumb and search result text rendering is now handled by DamPageClientView
          <div className="mb-6 flex flex-col gap-4">
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
        */}

        <DamPageClient 
          initialCurrentFolderId={currentFolderId} 
          initialCurrentSearchTerm={currentSearchTerm} 
          breadcrumbPath={breadcrumbPath} // Pass breadcrumbPath as a prop
        />
      </main>
    // </TooltipProvider>
  );
}