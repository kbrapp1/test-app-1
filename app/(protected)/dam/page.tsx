/**
 * Next.js Server Component that renders the Digital Asset Management (DAM)
 * gallery page, including a folder sidebar, main content area, and breadcrumb
 * navigation. It also includes a client-side asset gallery component for
 * rendering uploaded images.
 */

// Domain imports
import { DamWorkspaceView } from '@/lib/dam/presentation/components/workspace';
import type { BreadcrumbItemData } from '@/lib/dam/presentation/components/navigation';
import { getFolderNavigation } from '@/lib/dam/application/actions/navigation.actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; // REINSTATED

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

  // Use DDD-compliant server action instead of direct database access
  const navigationResult = await getFolderNavigation(currentFolderId);
  
  // Handle folder not found - redirect to root
  if (navigationResult.shouldRedirect && navigationResult.redirectTo) {
    redirect(navigationResult.redirectTo);
  }
  
  const breadcrumbPath = navigationResult.breadcrumbs;

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

        <DamWorkspaceView 
          initialCurrentFolderId={currentFolderId} 
          initialCurrentSearchTerm={currentSearchTerm} 
          breadcrumbPath={breadcrumbPath} // Pass breadcrumbPath as a prop
        />
      </main>
    // </TooltipProvider>
  );
}