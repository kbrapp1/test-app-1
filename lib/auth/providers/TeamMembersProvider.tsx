'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { createClient } from '@/lib/supabase/client';

/**
 * Team Members Context Provider - Application Layer
 * 
 * Single Responsibility: Centralize team members data management
 * Eliminates redundant /api/team/members calls across components
 * Provides caching and organization-scoped member data
 */

interface Member {
  id: string;
  name: string;
  email?: string;
}

interface TeamMembersContextType {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  refreshMembers: () => Promise<void>;
}

const TeamMembersContext = createContext<TeamMembersContextType | undefined>(undefined);

// Cache with organization scoping
const membersCache = new Map<string, { members: Member[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout
const MAX_RETRIES = 2;

interface TeamMembersProviderProps {
  children: React.ReactNode;
}

export function TeamMembersProvider({ children }: TeamMembersProviderProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeOrganizationId } = useOrganization();
  const supabase = createClient();

  // Helper function to add timeout to fetch requests
  const withTimeout = useCallback((promise: Promise<Response>, timeoutMs: number): Promise<Response> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }, []);

  // Helper function to refresh session and retry fetch
  const withSessionRefresh = useCallback(async (organizationId: string, retryCount = 0): Promise<Member[]> => {
    try {
      const response = await withTimeout(
        fetch('/api/team/members'), 
        REQUEST_TIMEOUT
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedMembers = data.members || [];
      
      // Cache the results
      const cacheKey = organizationId;
      const now = Date.now();
      membersCache.set(cacheKey, { members: fetchedMembers, timestamp: now });
      
      return fetchedMembers;
    } catch (error: any) {
      // Check if this looks like a session/auth error and we haven't retried too many times
      if (retryCount < MAX_RETRIES && (
        error.message?.includes('401') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('JWT')
      )) {
        console.log(`Retrying team members fetch after session refresh (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        try {
          // Attempt to refresh the session
          await supabase.auth.refreshSession();
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
          // Retry the fetch
          return await withSessionRefresh(organizationId, retryCount + 1);
        } catch (refreshError) {
          console.warn('Session refresh failed:', refreshError);
          throw error; // Throw original error if refresh fails
        }
      }
      throw error;
    }
  }, [withTimeout, supabase]);

  const fetchMembers = async (organizationId: string): Promise<Member[]> => {
    // Check cache first
    const cacheKey = organizationId;
    const cached = membersCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.members;
    }

    return await withSessionRefresh(organizationId);
  };

  const refreshMembers = async (): Promise<void> => {
    if (!activeOrganizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedMembers = await fetchMembers(activeOrganizationId);
      setMembers(fetchedMembers);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? (error.message === 'Request timeout' 
          ? 'Request timed out. Please try refreshing the page.' 
          : error.message)
        : 'Failed to fetch team members';
      setError(errorMessage);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!activeOrganizationId) {
      setMembers([]);
      setError(null);
      return;
    }

    refreshMembers();
  }, [activeOrganizationId]);

  const contextValue: TeamMembersContextType = {
    members,
    isLoading,
    error,
    refreshMembers,
  };

  return (
    <TeamMembersContext.Provider value={contextValue}>
      {children}
    </TeamMembersContext.Provider>
  );
}

export function useTeamMembers(): TeamMembersContextType {
  const context = useContext(TeamMembersContext);
  if (context === undefined) {
    throw new Error('useTeamMembers must be used within a TeamMembersProvider');
  }
  return context;
} 