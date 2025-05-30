'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const newUser = session?.user ?? null;
      setUser(newUser);

      if (newUser) {
        const profileData = await fetchProfile(newUser.id);
        if (isMounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

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