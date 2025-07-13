"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Organization } from '@/lib/auth/domain/value-objects/Organization';
import { OrganizationApplicationService } from '@/lib/auth/application/services/OrganizationApplicationService';
import type { Profile } from '@/lib/auth';

export interface UseOrganizationSelectorState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  isSwitching: boolean;
  isAllOrgsMode: boolean;
  isSuperAdmin: boolean;
}

export interface UseOrganizationSelectorActions {
  switchToOrganization: (organizationId: string | null) => Promise<void>;
  switchToAllOrganizations: () => void;
}

/**
 * Organization Selector Hook - Application Layer
 * 
 * Single Responsibility: Coordinate organization state and business logic
 * Separates state management from UI concerns
 */
export function useOrganizationSelector(
  profile: Profile | null,
  activeOrganizationId: string | null,
  onOrganizationChange?: (organizationId: string | null) => void
): UseOrganizationSelectorState & UseOrganizationSelectorActions {
  const router = useRouter();
  const { toast } = useToast();
  const organizationService = new OrganizationApplicationService();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isAllOrgsMode, setIsAllOrgsMode] = useState(false);

  const isSuperAdmin = profile?.is_super_admin ?? false;

  // Find current organization
  const currentOrganization = useMemo(() => {
    if (!activeOrganizationId) return null;
    return organizations.find(org => org.id === activeOrganizationId) || null;
  }, [organizations, activeOrganizationId]);

  // Load organizations on profile change
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!profile) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const orgs = await organizationService.getUserOrganizations(profile as any);
        setOrganizations(orgs);
      } catch (error) {
        console.error('Error loading organizations:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load organizations'
        });
        setOrganizations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganizations();
  }, [profile, toast]);

  // Handle organization switching
  const switchToOrganization = async (organizationId: string | null) => {
    if (isSwitching || !organizationId) {
      return;
    }
    
    try {
      setIsSwitching(true);
      setIsAllOrgsMode(false);
      
      // Call organization service - it handles progress notifications and page refresh
      await organizationService.switchToOrganization(organizationId);
      
      // The organization service handles the page refresh, so we shouldn't reach here
    } catch (error) {
      console.error('Error switching organization:', error);
      
      // Clean up any existing progress notifications
      if (typeof window !== 'undefined') {
        const progressToast = document.getElementById('org-switch-progress');
        if (progressToast) progressToast.remove();
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to switch organization. Please try again.'
      });
    } finally {
      setIsSwitching(false);
    }
  };

  // Check for successful organization switch after page refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const successInfo = localStorage.getItem('org_switch_success');
      if (successInfo) {
        try {
          const { organizationName, timestamp } = JSON.parse(successInfo);
          
          // Only show if the success is recent (within last 10 seconds)
          if (Date.now() - timestamp < 10000) {
            toast({
              title: 'Organization Switched',
              description: `Now viewing ${organizationName}`,
              duration: 4000,
            });
          }
          
          // Clean up the flag
          localStorage.removeItem('org_switch_success');
        } catch (error) {
          console.error('Error parsing org switch success info:', error);
          localStorage.removeItem('org_switch_success');
        }
      }
    }
  }, [toast]); // Run on mount to check for recent switches

  // Handle super admin "All Organizations" mode
  const switchToAllOrganizations = () => {
    if (!isSuperAdmin) return;
    
    setIsAllOrgsMode(true);
    toast({
      title: 'Super Admin Mode',
      description: 'Viewing all organizations'
    });

    // Notify parent component immediately
    onOrganizationChange?.(null);

    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('organizationChanged', {
        detail: { organizationId: null, allOrgsMode: true }
      }));
    }
  };

  return {
    // State
    organizations,
    currentOrganization,
    isLoading,
    isSwitching,
    isAllOrgsMode,
    isSuperAdmin,
    
    // Actions
    switchToOrganization,
    switchToAllOrganizations
  };
} 