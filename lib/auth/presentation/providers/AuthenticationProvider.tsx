/**
 * Authentication Provider - Single Source of Truth - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - Presentation layer component for authentication state management
 * - Uses composition root for dependency injection
 * - Single authentication context for entire application
 * - Eliminates redundant auth calls across all providers
 * - Maintains security while optimizing performance
 * - Follows @golden-rule patterns exactly
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AuthCompositionRoot } from '../../infrastructure/composition/AuthCompositionRoot';

interface AuthenticationContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthenticationContext = createContext<AuthenticationContextType | null>(null);

interface AuthenticationProviderProps {
  children: ReactNode;
}

export function AuthenticationProvider({ children }: AuthenticationProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  const refreshAuth = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error || !currentUser) {
        setUser(null);
        setIsAuthenticated(false);
      } else {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Initial authentication check
    const initializeAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        if (error || !currentUser) {
          setUser(null);
          setIsAuthenticated(false);
        } else {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      const newUser = session?.user ?? null;
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === 'SIGNED_IN' && newUser) {
        setUser(newUser);
        setIsAuthenticated(true);
      } else if (event === 'TOKEN_REFRESHED' && newUser) {
        setUser(newUser);
        setIsAuthenticated(true);
      }
    });

    initializeAuth();

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [supabase]);

  const contextValue: AuthenticationContextType = {
    user,
    isLoading,
    isAuthenticated,
    refreshAuth,
  };

  return (
    <AuthenticationContext.Provider value={contextValue}>
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthentication(): AuthenticationContextType {
  const context = useContext(AuthenticationContext);
  
  if (!context) {
    throw new Error(
      'useAuthentication must be used within an AuthenticationProvider. ' +
      'Make sure to wrap your component tree with <AuthenticationProvider>.'
    );
  }
  
  return context;
} 