'use server';

/**
 * Authorization wrappers for Server Actions
 * 
 * This module provides utilities for adding authentication and authorization
 * checks to server actions, with consistent error handling and logging.
 */

import { createClient } from '@/lib/supabase/server';
import { jwtDecode } from 'jwt-decode';

/**
 * Utility to get the current user in a server action
 * 
 * @returns The current user or null if not authenticated
 */
export async function getSessionUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error };
  }
  
  return { user, error: null };
}

// Keep the existing type definitions if they are used elsewhere, or define locally if specific to this function
interface DecodedAccessToken {
  exp?: number; // Standard claim, optional
  sub?: string; // Standard claim, optional
  // Add other standard claims you might expect, all optional
  custom_claims?: { // This structure comes from your Edge Function
    active_organization_id?: string;
  };
  // Example if active_organization_id was at the root of claims (not your case based on Edge Fn log)
  // active_organization_id?: string; 
}

/**
 * Retrieves the active organization ID from the user's JWT custom claims.
 * This is intended for use in server-side logic (Server Actions, Route Handlers, Server Components).
 * 
 * @returns The active organization ID (UUID string) or null if not found or user is not authenticated.
 */
export async function getActiveOrganizationId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    // console.error('GetActiveOrganizationId: Supabase session error or no session', sessionError);
    // Removed previous console.log for user.app_metadata as we now decode token
    return null;
  }

  if (!session.access_token) {
    // console.warn('GetActiveOrganizationId: No access_token in session.');
    return null;
  }

  try {
    // Decode the access token to get the claims
    const decodedToken = jwtDecode<DecodedAccessToken>(session.access_token);
    
    // console.log('GetActiveOrganizationId: Decoded JWT:', JSON.stringify(decodedToken, null, 2));

    // Access the claim based on your Edge Function's structure from the JWT
    const activeOrgId = decodedToken.custom_claims?.active_organization_id;

    if (!activeOrgId) {
      // console.warn('GetActiveOrganizationId: active_organization_id NOT FOUND in decoded JWT custom_claims.');
      return null;
    }

    if (typeof activeOrgId === 'string' && activeOrgId.length > 0) {
      // console.log('GetActiveOrganizationId: Successfully retrieved active_organization_id from JWT:', activeOrgId);
      return activeOrgId;
    } else {
      // console.warn('GetActiveOrganizationId: Retrieved active_organization_id from JWT was not a valid string:', activeOrgId);
      return null;
    }
  } catch (e) {
    // console.error('GetActiveOrganizationId: Error decoding JWT or accessing claims:', e);
    return null;
  }
} 