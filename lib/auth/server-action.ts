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
  app_metadata?: { // Add app_metadata for JWT tokens
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
  console.log('🔍 getActiveOrganizationId: Starting...');
  
  const supabase = createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.log('❌ getActiveOrganizationId: No session found or error:', sessionError?.message);
    return null;
  }

  console.log('✅ getActiveOrganizationId: Session exists');

  // Strategy 1: Try JWT custom claims first (fast path)
  if (session.access_token) {
    try {
      const decodedToken = jwtDecode<DecodedAccessToken>(session.access_token);
      console.log('🎫 JWT decoded successfully');
      console.log('🎫 JWT custom_claims:', decodedToken.custom_claims);
      console.log('🎫 JWT app_metadata active_organization_id:', decodedToken.app_metadata?.active_organization_id);
      
      const activeOrgId = decodedToken.custom_claims?.active_organization_id;
      
      if (activeOrgId && typeof activeOrgId === 'string' && activeOrgId.length > 0) {
        console.log('✅ getActiveOrganizationId: Found in JWT custom_claims:', activeOrgId);
        return activeOrgId;
      } else {
        console.log('⚠️ getActiveOrganizationId: No active_organization_id in custom_claims');
      }
    } catch (e) {
      console.log('❌ getActiveOrganizationId: JWT decode failed:', e);
      // JWT decode failed, continue to fallback
    }
  }

  // Strategy 2: Fallback to user.app_metadata (reliable path)
  try {
    console.log('🔄 getActiveOrganizationId: Trying user.app_metadata fallback...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ getActiveOrganizationId: No user found or error:', userError?.message);
      return null;
    }

    console.log('👤 getActiveOrganizationId: User found:', user.id);
    console.log('📝 getActiveOrganizationId: user.app_metadata:', user.app_metadata);
    console.log('📝 getActiveOrganizationId: user.user_metadata:', user.user_metadata);

    const activeOrgId = user.app_metadata?.active_organization_id;
    
    if (activeOrgId && typeof activeOrgId === 'string' && activeOrgId.length > 0) {
      console.log('✅ getActiveOrganizationId: Found in user.app_metadata:', activeOrgId);
      return activeOrgId;
    } else {
      console.log('⚠️ getActiveOrganizationId: No active_organization_id in app_metadata');
    }
  } catch (e) {
    // Silent fallback - log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GetActiveOrganizationId: Error accessing user metadata:', e);
    }
  }

  console.log('❌ getActiveOrganizationId: No organization found in any source');
  return null;
} 