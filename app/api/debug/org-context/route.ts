import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated', userError }, { status: 401 });
    }

    // Test our main function
    const orgIdFromFunction = await getActiveOrganizationId();

    // Test direct database query
    const { data: orgIdFromDb, error: dbError } = await supabase
      .rpc('get_active_organization_id');

    // Check user_organization_context table directly
    const { data: contextData, error: contextError } = await supabase
      .from('user_organization_context')
      .select(`
        active_organization_id,
        last_accessed_at,
        organizations!inner(name)
      `)
      .eq('user_id', user.id)
      .single();

    // Check assets in different organizations
    const { data: acmeAssets, error: acmeError } = await supabase
      .from('assets')
      .select('id, name')
      .eq('organization_id', '69cddc52-461c-430d-8707-13cde7f0cfb7') // Acme
      .limit(3);

    const { data: ironmarkAssets, error: ironmarkError } = await supabase
      .from('assets')
      .select('id, name')
      .eq('organization_id', 'ce099184-5169-474e-be71-4fcb9e5e94f8') // Ironmark
      .limit(3);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      organizationContext: {
        fromMainFunction: orgIdFromFunction,
        fromDirectDb: orgIdFromDb,
        fromContextTable: contextData,
        dbError,
        contextError
      },
      assetCounts: {
        acme: {
          organizationId: '69cddc52-461c-430d-8707-13cde7f0cfb7',
          assets: acmeAssets,
          error: acmeError
        },
        ironmark: {
          organizationId: 'ce099184-5169-474e-be71-4fcb9e5e94f8', 
          assets: ironmarkAssets,
          error: ironmarkError
        }
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 