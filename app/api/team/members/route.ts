import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// interface Profile { // No longer directly needed here
//   id: string;
//   full_name: string | null;
//   email: string | null;
// }

// interface MembershipWithProfile { // No longer directly needed here
//   user_id: string;
//   profile: Profile | null; 
// }

interface Member {
  id: string; // UUIDs will be strings here
  name: string;
}

export async function GET() {
  // console.log('[TEAM_MEMBERS_GET_RPC] Received request');
  try {
    const supabase = createClient();
    const activeOrgId = await getActiveOrganizationId();
    // console.log('[TEAM_MEMBERS_GET_RPC] Active Org ID:', activeOrgId);

    if (!activeOrgId) {
      // console.warn('[TEAM_MEMBERS_GET_RPC] Active organization not found');
      return NextResponse.json({ error: 'Active organization not found' }, { status: 401 });
    }

    // console.log(`[TEAM_MEMBERS_GET_RPC] Calling RPC for org: ${activeOrgId}`);
    
    const { data: members, error: rpcError } = await supabase.rpc(
      'get_organization_members_with_profiles',
      { target_org_id: activeOrgId }
    );

    if (rpcError) {
      console.error('[TEAM_MEMBERS_GET_RPC] Supabase RPC error:', JSON.stringify(rpcError, null, 2)); // Keep critical error logs
      return NextResponse.json({ error: 'Failed to fetch organization members via RPC', details: rpcError.message }, { status: 500 });
    }

    // console.log('[TEAM_MEMBERS_GET_RPC] Raw data from RPC:', JSON.stringify(members, null, 2));

    if (!members) {
      // console.log('[TEAM_MEMBERS_GET_RPC] No members found (or RPC returned null unexpectedly), returning empty array.');
      return NextResponse.json({ members: [] });
    }
    
    // console.log('[TEAM_MEMBERS_GET_RPC] Processed members (from RPC):', JSON.stringify(members, null, 2));
    return NextResponse.json({ members: members as Member[] }); 

  } catch (error) {
    console.error('[TEAM_MEMBERS_GET_RPC] CATCH_BLOCK_ERROR:', error); // Keep critical error logs
    let errorMessage = 'Internal server error';
    let errorDetails: any = {};
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { name: error.name, message: error.message, stack: error.stack };
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } else {
      errorDetails = { error: String(error) };
    }
    // console.error('[TEAM_MEMBERS_GET_RPC] Full error details:', JSON.stringify(errorDetails, null, 2)); // Optional: comment out if too verbose
    return NextResponse.json({ error: 'An unexpected error occurred', details: errorMessage }, { status: 500 });
  }
}

// Basic check to ensure the route is hit - can be removed later
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
} 