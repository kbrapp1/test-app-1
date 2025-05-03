import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const folderId = url.searchParams.get('folderId');

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

  // Fetch folders under this folderId - Select only needed columns
  let folderQuery = supabase.from('folders').select('id, name, parent_folder_id');
  if (folderId) folderQuery = folderQuery.eq('parent_folder_id', folderId);
  else folderQuery = folderQuery.is('parent_folder_id', null);
  const { data: foldersData, error: foldersError } = await folderQuery.order('name', { ascending: true });
  if (foldersError) {
    return NextResponse.json({ error: foldersError.message }, { status: 500 });
  }

  // Fetch assets under this folderId - Select only needed columns
  let assetQuery = supabase.from('assets').select('id, name, storage_path, mime_type, folder_id');
  if (folderId) assetQuery = assetQuery.eq('folder_id', folderId);
  else assetQuery = assetQuery.is('folder_id', null);
  const { data: assetsData, error: assetsError } = await assetQuery.order('created_at', { ascending: false });
  if (assetsError) {
    return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }

  // Build public URLs
  const assetsWithUrls = (assetsData || []).map((asset: any) => {
    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(asset.storage_path);
    return {
      ...asset,
      type: 'asset',
      publicUrl: urlData?.publicUrl || '/placeholder.png',
    };
  });

  // Combine and tag folders
  const folders = (foldersData || []).map((f: any) => ({ ...f, type: 'folder' }));
  const combined = [...folders, ...assetsWithUrls];

  return NextResponse.json(combined);
} 