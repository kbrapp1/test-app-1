'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/auth';

/**
 * User Profile Context Provider - Application Layer
 * 
 * Single Responsibility: Centralize user profile data management
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const previousUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
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
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user?.id) return;
    
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    let isMounted = true;

    // Check initial session and fetch profile once
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.warn('Error getting initial session:', error);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        const initialUser = session?.user ?? null;
        setUser(initialUser);
        previousUserIdRef.current = initialUser?.id ?? null;

        if (initialUser) {
          // Only fetch profile on initial load
          const profileData = await fetchProfile(initialUser.id);
          if (isMounted) {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    };

    // Listen for auth changes but be selective about when to refetch profile
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const newUser = session?.user ?? null;
      const previousUserId = previousUserIdRef.current;
      

      
      // Update user immediately
      setUser(newUser);
      previousUserIdRef.current = newUser?.id ?? null;

      if (event === 'SIGNED_OUT') {
        // Clear everything on logout
        setProfile(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' && (!previousUserId || previousUserId !== newUser?.id)) {
        // Only fetch profile on actual sign-in with new user (not session refresh)

        if (newUser) {
          setIsLoading(true);
          try {
            const profileData = await fetchProfile(newUser.id);
            if (isMounted) {
              setProfile(profileData);
            }
          } catch (error) {
            console.error('Failed to fetch profile on sign-in:', error);
            if (isMounted) {
              setProfile(null);
            }
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
        }
      } else {
        // For token refresh, same user, or other events - don't refetch profile

        setIsLoading(false);
      }
    });

    // Initialize on mount
    initializeAuth();

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [supabase]);

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