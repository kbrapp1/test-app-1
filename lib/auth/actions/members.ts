'use server';

import { createClient } from '@/lib/supabase/server'; // Using server client for actions
import { cookies } from 'next/headers';

interface InviteMemberParams {
  email: string;
  name?: string;
  organizationId: string;
  roleId: string;
}

interface InviteMemberResult {
  success: boolean;
  error?: string;
  isNewUser?: boolean;
  invitedMember?: any; // Define more specific type if needed based on Edge Function response
}

export async function inviteMemberToOrganization(
  params: InviteMemberParams
): Promise<InviteMemberResult> {
  const supabase = createClient();

  const { email, name, organizationId, roleId } = params;

  if (!organizationId) {
    return { success: false, error: 'Organization ID is missing.' };
  }

  try {
    // Get auth token for the Edge Function
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return { success: false, error: `Session error: ${sessionError.message}` };
    }
    if (!session) {
      return { success: false, error: 'You must be logged in to invite members' };
    }

    // Determine the correct application URL based on the environment
    let appUrl: string;
    
    if (process.env.NODE_ENV === 'development') {
      // Local development environment - use localhost
      appUrl = process.env.NEXT_PUBLIC_APP_URL_DEV || 'http://localhost:3000';
    } else {
      // Deployed environment (Vercel dev/staging/production)
      // Prioritize explicitly set NEXT_PUBLIC_SITE_URL for production
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        appUrl = process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        // Fallback to VERCEL_URL (automatically set by Vercel)
        const vercelUrl = process.env.VERCEL_URL;
        if (vercelUrl) {
          appUrl = `https://${vercelUrl}`;
        } else {
          appUrl = 'https://test-app-1-beta.vercel.app';
        }
      }
    }

    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-member`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email,
        name: name || undefined,
        organization_id: organizationId,
        role_id: roleId,
        explicit_app_url: appUrl,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to invite member via Edge Function' };
    }

    return {
      success: true,
      isNewUser: result.isNewUser,
      invitedMember: result.data // Assuming the edge function returns data under a 'data' key
    };

  } catch (error: any) {
    console.error('Error inviting member in action:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
} 