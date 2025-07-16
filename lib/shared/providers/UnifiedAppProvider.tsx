'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useAuthentication } from '@/lib/auth/presentation/providers/AuthenticationProvider';
import type { Profile } from '@/lib/auth';

/**
 * Unified App Provider - Performance Optimized
 * 
 * AI INSTRUCTIONS:
 * - Loads all app data in PARALLEL instead of sequential cascade
 * - Reduces provider waterfall from 1.7s to ~300ms
 * - Single responsibility: Coordinate parallel data loading
 * - Uses Promise.allSettled for concurrent API calls
 * - Maintains individual provider interfaces for backward compatibility
 */

interface Member {
  id: string;
  name: string;
  email?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  feature_flags?: Record<string, boolean>;
}

interface OrganizationContext {
  organization_id: string;
  organization_name: string;
  feature_flags?: Record<string, boolean>;
}

interface UnifiedAppContextType {
  // User data
  user: User | null;
  profile: Profile | null;
  
  // Organization data
  organizations: Organization[];
  activeOrganizationId: string | null;
  activeOrganization: Organization | null;
  currentContext: OrganizationContext | null;
  
  // Team data
  members: Member[];
  
  // Loading states
  isLoading: boolean;
  isUserLoading: boolean;
  isOrganizationsLoading: boolean;
  isMembersLoading: boolean;
  
  // Error states
  userError: string | null;
  organizationsError: string | null;
  membersError: string | null;
  
  // Actions
  refreshProfile: () => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
}

const UnifiedAppContext = createContext<UnifiedAppContextType | undefined>(undefined);

interface UnifiedAppProviderProps {
  children: ReactNode;
}

interface OrganizationData {
  organization_id?: string;
  id?: string;
  organization_name?: string;
  name?: string;
  slug?: string;
  feature_flags?: Record<string, boolean>;
}

export function UnifiedAppProvider({ children }: UnifiedAppProviderProps) {
  // Auth state from existing provider
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthentication();
  
  // Unified state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Loading states
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [isOrganizationsLoading, setIsOrganizationsLoading] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  
  // Error states
  const [userError, setUserError] = useState<string | null>(null);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  
  const supabase = createClient();
  
  // Parallel data loading functions
  const loadUserProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user?.id) return null;
    
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch user profile');
    }
    
    return profileData as Profile;
  }, [user?.id, supabase]);
  
  const loadOrganizations = useCallback(async (): Promise<{ organizations: Organization[], activeId: string | null }> => {
    if (!user?.id) return { organizations: [], activeId: null };
    
    // Load accessible organizations and active organization using Supabase RPC functions
    const [orgsResponse, activeResponse] = await Promise.allSettled([
      supabase.rpc('get_user_accessible_organizations'),
      supabase.rpc('get_active_organization_id')
    ]);
    
    let orgs: Organization[] = [];
    let activeId: string | null = null;
    
    // Process organizations response
    if (orgsResponse.status === 'fulfilled' && !orgsResponse.value.error) {
      const orgsData = orgsResponse.value.data as OrganizationData[] || [];
      orgs = orgsData.map((org: OrganizationData) => ({
        id: org.organization_id || org.id || '',
        name: org.organization_name || org.name || '',
        slug: org.slug || '',
        feature_flags: org.feature_flags || {}
      }));
    } else {
      console.error('Failed to fetch organizations:', orgsResponse.status === 'fulfilled' ? orgsResponse.value.error : orgsResponse.reason);
      throw new Error('Failed to fetch organizations');
    }
    
    // Process active organization response  
    if (activeResponse.status === 'fulfilled' && !activeResponse.value.error) {
      activeId = activeResponse.value.data as string || null;
    } else {
      console.error('Failed to fetch active organization:', activeResponse.status === 'fulfilled' ? activeResponse.value.error : activeResponse.reason);
    }
    
    return { organizations: orgs, activeId };
  }, [user?.id, supabase]);
  
  const loadTeamMembers = useCallback(async (organizationId: string | null): Promise<Member[]> => {
    if (!organizationId) return [];
    
    const response = await fetch('/api/team/members');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.members || [];
  }, []);
  
  // Parallel loading effect - PERFORMANCE OPTIMIZATION
  useEffect(() => {
    if (!isAuthenticated || !user || isAuthLoading) {
      return;
    }
    
    const loadAllData = async () => {
      setIsUserLoading(true);
      setIsOrganizationsLoading(true);
      setUserError(null);
      setOrganizationsError(null);
      setMembersError(null);
      
      try {
        // ✅ PARALLEL LOADING - Load user profile and organizations concurrently
        const [profileResult, organizationsResult] = await Promise.allSettled([
          loadUserProfile(),
          loadOrganizations()
        ]);
        
        // Process profile result
        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value);
        } else {
          setUserError('Failed to load user profile');
          console.error('Profile loading failed:', profileResult.reason);
        }
        
        // Process organizations result
        let currentActiveId: string | null = null;
        if (organizationsResult.status === 'fulfilled') {
          setOrganizations(organizationsResult.value.organizations);
          setActiveOrganizationId(organizationsResult.value.activeId);
          currentActiveId = organizationsResult.value.activeId;
        } else {
          setOrganizationsError('Failed to load organizations');
          console.error('Organizations loading failed:', organizationsResult.reason);
        }
        
        setIsUserLoading(false);
        setIsOrganizationsLoading(false);
        
        // ✅ CONDITIONAL PARALLEL LOADING - Load team members if we have active org
        if (currentActiveId) {
          setIsMembersLoading(true);
          
          try {
            const membersData = await loadTeamMembers(currentActiveId);
            setMembers(membersData);
          } catch (error) {
            setMembersError('Failed to load team members');
            console.error('Members loading failed:', error);
          } finally {
            setIsMembersLoading(false);
          }
        } else {
          setMembers([]);
          setIsMembersLoading(false);
        }
        
      } catch (error) {
        setUserError('Failed to initialize app data');
        setIsUserLoading(false);
        setIsOrganizationsLoading(false);
        setIsMembersLoading(false);
        console.error('App data initialization failed:', error);
      }
    };
    
    loadAllData();
  }, [isAuthenticated, user, isAuthLoading, supabase, loadUserProfile, loadOrganizations, loadTeamMembers]);
  
  // Individual refresh functions
  const refreshProfile = async () => {
    if (!user?.id) return;
    
    setIsUserLoading(true);
    setUserError(null);
    
    try {
      const profileData = await loadUserProfile();
      setProfile(profileData);
    } catch (error) {
      setUserError('Failed to refresh profile');
      console.error('Profile refresh failed:', error);
    } finally {
      setIsUserLoading(false);
    }
  };
  
  const refreshOrganizations = async () => {
    if (!user?.id) return;
    
    setIsOrganizationsLoading(true);
    setOrganizationsError(null);
    
    try {
      const { organizations: orgs, activeId } = await loadOrganizations();
      setOrganizations(orgs);
      setActiveOrganizationId(activeId);
    } catch (error) {
      setOrganizationsError('Failed to refresh organizations');
      console.error('Organizations refresh failed:', error);
    } finally {
      setIsOrganizationsLoading(false);
    }
  };
  
  const refreshMembers = async () => {
    if (!activeOrganizationId) return;
    
    setIsMembersLoading(true);
    setMembersError(null);
    
    try {
      const membersData = await loadTeamMembers(activeOrganizationId);
      setMembers(membersData);
    } catch (error) {
      setMembersError('Failed to refresh team members');
      console.error('Members refresh failed:', error);
    } finally {
      setIsMembersLoading(false);
    }
  };
  
  const switchOrganization = async (organizationId: string) => {
    // Update active organization and reload members
    setActiveOrganizationId(organizationId);
    setIsMembersLoading(true);
    setMembersError(null);
    
    try {
      const membersData = await loadTeamMembers(organizationId);
      setMembers(membersData);
    } catch (error) {
      setMembersError('Failed to load team members for organization');
      console.error('Organization switch failed:', error);
    } finally {
      setIsMembersLoading(false);
    }
  };
  
  // Computed values
  const activeOrganization = organizations.find(org => org.id === activeOrganizationId) || null;
  const currentContext: OrganizationContext | null = activeOrganization ? {
    organization_id: activeOrganization.id,
    organization_name: activeOrganization.name,
    feature_flags: activeOrganization.feature_flags || {}
  } : null;
  const isLoading = isAuthLoading || isUserLoading || isOrganizationsLoading;
  
  const contextValue: UnifiedAppContextType = {
    // User data
    user,
    profile,
    
    // Organization data
    organizations,
    activeOrganizationId,
    activeOrganization,
    currentContext,
    
    // Team data
    members,
    
    // Loading states
    isLoading,
    isUserLoading,
    isOrganizationsLoading,
    isMembersLoading,
    
    // Error states
    userError,
    organizationsError,
    membersError,
    
    // Actions
    refreshProfile,
    refreshOrganizations,
    refreshMembers,
    switchOrganization,
  };
  
  return (
    <UnifiedAppContext.Provider value={contextValue}>
      {children}
    </UnifiedAppContext.Provider>
  );
}

// Hook for consuming the unified context
export function useUnifiedApp(): UnifiedAppContextType {
  const context = useContext(UnifiedAppContext);
  if (context === undefined) {
    throw new Error('useUnifiedApp must be used within a UnifiedAppProvider');
  }
  return context;
}

// Backward compatibility hooks - these delegate to the unified provider
export function useUserProfile() {
  const { user, profile, isUserLoading, userError, refreshProfile } = useUnifiedApp();
  return {
    user,
    profile,
    isLoading: isUserLoading,
    error: userError,
    refreshProfile
  };
}

export function useOrganization() {
  const { 
    organizations, 
    activeOrganizationId, 
    activeOrganization, 
    currentContext,
    isOrganizationsLoading,
    organizationsError,
    refreshOrganizations,
    switchOrganization 
  } = useUnifiedApp();
  
  // Convert organizations to the legacy format for backward compatibility
  const accessibleOrganizations = organizations.map(org => ({
    organization_id: org.id,
    organization_name: org.name,
    organization_slug: org.slug,
    role_name: 'Member', // Default role - TODO: Fetch actual role from API
    role_id: 'default-role-id',
    granted_at: new Date().toISOString(),
    ...org
  }));
  
  return {
    organizations,
    activeOrganizationId,
    activeOrganization,
    currentContext,
    isLoading: isOrganizationsLoading,
    error: organizationsError,
    refreshOrganizations,
    switchOrganization,
    // Legacy format for backward compatibility
    accessibleOrganizations,
    // Backward compatibility methods
    hasAccessToOrganization: (orgId: string) => organizations.some(org => org.id === orgId),
    getOrganizationName: (orgId: string) => organizations.find(org => org.id === orgId)?.name || null,
    getCurrentOrganizationName: () => activeOrganization?.name || null,
    isCurrentOrganization: (orgId: string) => activeOrganizationId === orgId,
  };
}

export function useTeamMembers() {
  const { members, isMembersLoading, membersError, refreshMembers } = useUnifiedApp();
  return {
    members,
    isLoading: isMembersLoading,
    error: membersError,
    refreshMembers
  };
} 