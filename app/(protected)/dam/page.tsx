import { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { AssetGallery } from "@/components/dam/AssetGallery";
import { FolderSidebar, Folder, HierarchicalFolder } from '@/components/dam/folder-sidebar';
import { DamBreadcrumbs, type BreadcrumbItemData } from '@/components/dam/dam-breadcrumbs';
// TODO: Import Breadcrumb component when created

// Force dynamic rendering for this page because Supabase client uses cookies
export const dynamic = 'force-dynamic';

async function fetchFolders(supabase: any): Promise<Folder[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error fetching user or no user:', userError);
    return []; // Handle error or redirect appropriately
  }

  const { data: folders, error: foldersError } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (foldersError) {
    console.error('Error fetching folders:', foldersError);
    return []; // Or throw an error
  }
  
  // Explicitly cast to Folder[] if Supabase types aren't fully inferred
  return folders as Folder[] || [];
}

// Helper function to build folder hierarchy
function buildFolderHierarchy(folders: Folder[]): HierarchicalFolder[] {
  const folderMap: { [id: string]: HierarchicalFolder } = {};
  const rootFolders: HierarchicalFolder[] = [];

  // First pass: Create map and initialize children arrays
  folders.forEach(folder => {
    folderMap[folder.id] = { ...folder, children: [] };
  });

  // Second pass: Build the tree structure
  folders.forEach(folder => {
    const node = folderMap[folder.id];
    if (folder.parent_folder_id && folderMap[folder.parent_folder_id]) {
      folderMap[folder.parent_folder_id].children.push(node);
    } else {
      rootFolders.push(node);
    }
  });

  // Optional: Sort children alphabetically within each node (recursive)
  const sortChildren = (node: HierarchicalFolder) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortChildren);
  };
  rootFolders.sort((a, b) => a.name.localeCompare(b.name));
  rootFolders.forEach(sortChildren);

  return rootFolders;
}

// Function to fetch breadcrumb path
async function fetchBreadcrumbPath(supabase: any, folderId: string | null): Promise<BreadcrumbItemData[]> {
  if (!folderId) {
    return [{ id: null, name: 'Root', href: '/dam' }];
  }

  const path: BreadcrumbItemData[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const { data, error } = await supabase
      .from('folders')
      .select('id, name, parent_folder_id')
      .eq('id', currentId)
      .single();

    // Cast the type after destructuring
    const folder = data as { id: string; name: string; parent_folder_id: string | null } | null;

    if (error || !folder) {
      console.error('Error fetching folder for breadcrumbs:', error);
      // Return a partial path or default if an error occurs
      return [{ id: null, name: 'Root', href: '/dam' }, {id: folderId, name: 'Error', href: '/dam?folderId=' + folderId}]; 
    }

    path.unshift({ // Add to the beginning of the array
      id: folder.id,
      name: folder.name,
      href: `/dam?folderId=${folder.id}`
    });
    currentId = folder.parent_folder_id;
  }

  // Add the Root breadcrumb at the beginning
  path.unshift({ id: null, name: 'Root', href: '/dam' });

  return path;
}

// Define props for the page to accept searchParams
interface DamGalleryPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function DamGalleryPage({ searchParams }: DamGalleryPageProps) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Fetch folders data server-side
  const folders = await fetchFolders(supabase);
  const hierarchicalFolders = buildFolderHierarchy(folders);

  // Determine the current folder ID from searchParams asynchronously
  const { folderId } = await searchParams!;
  const currentFolderId = typeof folderId === 'string' ? folderId : null;

  // Fetch breadcrumb data based on currentFolderId
  const breadcrumbPath = await fetchBreadcrumbPath(supabase, currentFolderId);

  return (
    <div className="flex h-full">
      {/* Folder Sidebar */}
      <FolderSidebar folders={hierarchicalFolders} currentFolderId={currentFolderId} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 overflow-auto">
            <div className="mb-4 flex items-center justify-between">
          {/* Render Breadcrumb component here */}
          <DamBreadcrumbs path={breadcrumbPath} />
                <Link href="/dam/upload" passHref legacyBehavior>
                    <Button asChild>
                        <a>
                            <UploadCloud className="mr-2 h-4 w-4" /> Upload Assets
                        </a>
                    </Button>
                </Link>
            </div>
        {/* Asset Gallery */}
      <Suspense fallback={<p className="text-center">Loading assets...</p>}>
          {/* Pass selected folder ID to AssetGallery */}
          <AssetGallery currentFolderId={currentFolderId} />
      </Suspense>
      </main>
    </div>
  );
}