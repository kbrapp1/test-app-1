'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useAuthentication } from './AuthenticationProvider';
import type { Profile } from '@/lib/auth';

/**
 * User Profile Context Provider - Application Layer
 * 
 * Single Responsibility: Centralize user profile data management
 * Uses shared AuthenticationProvider (eliminates redundant auth calls)
 * Eliminates redundant profile fetching across components
 * Follows DDD principles with clean separation of concerns
 */

interface UserProfileContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

interface UserProfileProviderProps {
  children: React.ReactNode;
}

export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuthentication(); // Use shared auth context
  const supabase = createClient();
  const previousUserIdRef = useRef<string | null>(null);
  const activeRequestRef = useRef<Promise<Profile | null> | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (activeRequestRef.current && previousUserIdRef.current === userId) {
      return activeRequestRef.current;
    }

    activeRequestRef.current = (async () => {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single<Profile>();

        if (error) {
          console.error('Error fetching profile:', error);
          return null;
        }

        return profileData;
      } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
      } finally {
        activeRequestRef.current = null;
      }
    })();

    return activeRequestRef.current;
  }, [supabase]);

  const refreshProfile = async (): Promise<void> => {
    if (!user?.id) return;
    
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user?.id || !isAuthenticated) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const previousUserId = previousUserIdRef.current;
      
      // Only fetch profile if user changed OR if we don't have a profile yet
      if (previousUserId === user.id && profile !== null) {
        setIsLoading(false);
        return;
      }

      previousUserIdRef.current = user.id;
      setIsLoading(true);

      try {
        const profileData = await fetchProfile(user.id);
        if (isMounted) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthenticated, fetchProfile, profile]);

  const contextValue: UserProfileContextType = {
    user,
    profile,
    isLoading,
    refreshProfile,
  };

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextType {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
} 