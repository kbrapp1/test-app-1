import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { DatabaseError } from '@/lib/errors/base';
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

export async function getHandler(
  request: NextRequest,
  user: User,
  supabase: SupabaseClient
) {
  try {
    // Get organization context with refresh logic
    let activeOrgId = await getActiveOrganizationId();
    
    // If no organization found, try forcing a session refresh
    if (!activeOrgId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            activeOrgId = await getActiveOrganizationId();
          }
        }
      } catch (refreshError) {
        console.warn('Team Members API: Session refresh failed:', refreshError);
      }
    }

    if (!activeOrgId) {
      return NextResponse.json({ error: 'Active organization not found' }, { status: 401 });
    }
    
    const { data: members, error: rpcError } = await supabase.rpc(
      'get_organization_members_with_profiles',
      { target_org_id: activeOrgId }
    );

    if (rpcError) {
      console.error('[TEAM_MEMBERS_GET_RPC] Supabase RPC error:', JSON.stringify(rpcError, null, 2));
      return NextResponse.json({ error: 'Failed to fetch organization members via RPC', details: rpcError.message }, { status: 500 });
    }

    if (!members) {
      return NextResponse.json({ members: [] });
    }
    
    return NextResponse.json({ 
      members: members as Member[],
      organizationId: activeOrgId // Include for debugging
    }); 

  } catch (error) {
    console.error('[TEAM_MEMBERS_GET_RPC] CATCH_BLOCK_ERROR:', error);
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
    return NextResponse.json({ error: 'An unexpected error occurred', details: errorMessage }, { status: 500 });
  }
}

export const GET = withErrorHandling(withAuth(getHandler));

// Basic check to ensure the route is hit - can be removed later
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
} 