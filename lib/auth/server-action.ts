'use server';

/**
 * Authorization wrappers for Server Actions
 * 
 * This module provides utilities for adding authentication and authorization
 * checks to server actions, with consistent error handling and logging.
 */

import { createClient } from '@/lib/supabase/server';
import { apiDeduplicationService } from '@/lib/dam/application/services/ApiDeduplicationService';

/**
 * Utility to get the current user in a server action
 * 
 * @returns The current user or null if not authenticated
 */
export async function getSessionUser() {
  
  return apiDeduplicationService.deduplicateServerAction(
    'getSessionUser',
    [],
    async () => {
      return await executeGetSessionUser();
    },
    1500 // 1.5 second deduplication window
  );
}

async function executeGetSessionUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error };
  }
  
  return { user, error: null };
}

/**
 * Retrieves the active organization ID from the database.
 * 
 * Single Source of Truth: user_organization_context table
 * 
 * @returns The active organization ID (UUID string) or null if not found or user is not authenticated.
 */
export async function getActiveOrganizationId(): Promise<string | null> {
  
  return apiDeduplicationService.deduplicateServerAction(
    'getActiveOrganizationId',
    [],
    async () => {
      return await executeGetActiveOrganizationId();
    },
    1500 // 1.5 second deduplication window
  );
}

async function executeGetActiveOrganizationId(): Promise<string | null> {
  const supabase = createClient();

  try {
    // AI: Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }

    // AI: Direct query instead of RPC to avoid auth.uid() issues
    const { data, error } = await supabase
      .from('user_organization_context')
      .select('active_organization_id')
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) {
      return null;
    }

    return data.active_organization_id;
  } catch (e) {
    return null;
  }
} 