'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

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

interface TeamMembersProviderProps {
  children: React.ReactNode;
}

export function TeamMembersProvider({ children }: TeamMembersProviderProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeOrganizationId } = useOrganization();

  const fetchMembers = async (organizationId: string): Promise<Member[]> => {
    // Check cache first
    const cacheKey = organizationId;
    const cached = membersCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.members;
    }

    try {
      const response = await fetch('/api/team/members');
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedMembers = data.members || [];
      
      // Cache the results
      membersCache.set(cacheKey, { members: fetchedMembers, timestamp: now });
      
      return fetchedMembers;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  };

  const refreshMembers = async (): Promise<void> => {
    if (!activeOrganizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedMembers = await fetchMembers(activeOrganizationId);
      setMembers(fetchedMembers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team members';
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