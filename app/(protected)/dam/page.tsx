/**
 * Next.js Server Component that renders the Digital Asset Management (DAM)
 * gallery page, including a folder sidebar, main content area, and breadcrumb
 * navigation. It also includes a client-side asset gallery component for
 * rendering uploaded images.
 */

// Domain imports
import { DamWorkspaceView } from '@/lib/dam/presentation/components/workspace';
import { getFolderNavigation } from '@/lib/dam/application/actions/navigation.actions';
import { getActiveOrganizationWithFlags } from '@/lib/organization/application/services/getActiveOrganizationWithFlags';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Ban } from 'lucide-react';

export const dynamic = 'force-dynamic'; // REINSTATED

export default async function DamGalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Feature flag check - server-side
  const supabase = createSupabaseServerClient();
  const organization = await getActiveOrganizationWithFlags(supabase);
  const flags = organization?.featureFlags as Record<string, boolean> | undefined;
  const isDamEnabled = flags?.dam ?? false;

  // If DAM feature is not enabled, show feature not enabled message
  if (!isDamEnabled) {
    return (
      <main className="flex-1 px-4 pt-2 pb-4 overflow-auto">
        <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)] text-center">
          <Ban className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Feature Not Enabled</h1>
          <p className="text-muted-foreground">
            The Digital Asset Management feature is not enabled for your organization.
          </p>
          <p className="text-muted-foreground mt-1">
            Please contact your administrator for more information.
          </p>
        </div>
      </main>
    );
  }

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