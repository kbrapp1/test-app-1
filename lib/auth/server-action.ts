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
 * Retrieves the active organization ID with fallback strategy for reliability.
 * 
 * Strategy:
 * 1. Try JWT custom claims (fast, works when Edge Function has run)
 * 2. Fallback to user.app_metadata (reliable, always available)
 * 
 * @returns The active organization ID (UUID string) or null if not found or user is not authenticated.
 */
export async function getActiveOrganizationId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return null;
  }

  // Strategy 1: Try JWT custom claims first (fast path)
  if (session.access_token) {
    try {
      const decodedToken = jwtDecode<DecodedAccessToken>(session.access_token);
      const activeOrgId = decodedToken.custom_claims?.active_organization_id;
      
      if (activeOrgId && typeof activeOrgId === 'string' && activeOrgId.length > 0) {
        return activeOrgId;
      }
    } catch (e) {
      // JWT decode failed, continue to fallback
    }
  }

  // Strategy 2: Fallback to user.app_metadata (reliable path)
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    const activeOrgId = user.app_metadata?.active_organization_id;
    
    if (activeOrgId && typeof activeOrgId === 'string' && activeOrgId.length > 0) {
      return activeOrgId;
    }
  } catch (e) {
    // Silent fallback - log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GetActiveOrganizationId: Error accessing user metadata:', e);
    }
  }

  return null;
} 