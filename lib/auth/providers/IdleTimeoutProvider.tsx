'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface IdleTimeoutContextType {
  isIdle: boolean;
  timeUntilLogout: number;
  resetIdleTimer: () => void;
  showWarning: boolean;
  extendSession: () => void;
}

const IdleTimeoutContext = createContext<IdleTimeoutContextType | undefined>(undefined);

export function useIdleTimeout() {
  const context = useContext(IdleTimeoutContext);
  if (context === undefined) {
    throw new Error('useIdleTimeout must be used within an IdleTimeoutProvider');
  }
  return context;
}

interface IdleTimeoutProviderProps {
  children: React.ReactNode;
  // Configurable timeouts in minutes
  idleTimeoutMinutes?: number;
  warningTimeoutMinutes?: number;
}

/**
 * IdleTimeoutProvider - Proactive Session Management
 * 
 * Single Responsibility: Monitor user activity and manage session timeouts
 * 
 * Features:
 * - Tracks mouse, keyboard, and touch activity
 * - Shows warning before logout
 * - Automatically logs out on inactivity
 * - Prevents spinner states by proactive logout
 */
export function IdleTimeoutProvider({ 
  children, 
  idleTimeoutMinutes = 30,  // 30 minutes of inactivity
  warningTimeoutMinutes = 5  // Show warning 5 minutes before logout
}: IdleTimeoutProviderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [timeUntilLogout, setTimeUntilLogout] = useState(0);
  
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showWarningRef = useRef<boolean>(false);
  
  const IDLE_TIMEOUT_MS = idleTimeoutMinutes * 60 * 1000;
  const WARNING_TIMEOUT_MS = (idleTimeoutMinutes - warningTimeoutMinutes) * 60 * 1000;

  // Activity events to monitor
  const ACTIVITY_EVENTS = [
    'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
  ] as const;

  const resetIdleTimer = () => {
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    setShowWarning(false);
    showWarningRef.current = false;
    
    // Clear existing timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      showWarningRef.current = true;
      
      // Start countdown timer
      let seconds = warningTimeoutMinutes * 60;
      setTimeUntilLogout(seconds);
      
      countdownTimerRef.current = setInterval(() => {
        seconds -= 1;
        setTimeUntilLogout(seconds);
        
        if (seconds <= 0) {
          handleLogout('automatic');
        }
      }, 1000);
      
    }, WARNING_TIMEOUT_MS);

    // Set idle logout timer
    idleTimerRef.current = setTimeout(() => {
      handleLogout('automatic');
    }, IDLE_TIMEOUT_MS);
  };

  const handleLogout = async (reason: 'automatic' | 'manual') => {
    setIsIdle(true);
    
    // Clear all timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    // Show appropriate message
    const message = reason === 'automatic' 
      ? 'You were automatically logged out due to inactivity'
      : 'Session extended successfully';

    if (reason === 'automatic') {
      toast({
        title: "Session Expired",
        description: message,
        variant: "destructive",
        duration: 4000,
      });
    }

    try {
      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect even if signOut fails
      router.push('/login');
    }
  };

  const extendSession = () => {
    setShowWarning(false);
    showWarningRef.current = false;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    resetIdleTimer();
    
    toast({
      title: "Session Extended",
      description: "Your session has been extended",
      duration: 2000,
    });
  };

  // Set up activity listeners
  useEffect(() => {
    // Initialize timer
    resetIdleTimer();

    // Add event listeners for user activity
    const handleActivity = () => {
      // Check the current warning state from the ref instead of closure
      if (!showWarningRef.current) {
        resetIdleTimer();
      }
    };

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []); // ← Keep empty dependency array

  // Listen for auth state changes to detect if user is logged out externally
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // User was logged out elsewhere, clean up timers
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setIsIdle(true);
        setShowWarning(false);
      } else if (event === 'SIGNED_IN' && session) {
        // User signed in, restart timers
        setIsIdle(false);
        resetIdleTimer();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const contextValue: IdleTimeoutContextType = {
    isIdle,
    timeUntilLogout,
    resetIdleTimer,
    showWarning,
    extendSession,
  };

  return (
    <IdleTimeoutContext.Provider value={contextValue}>
      {children}
      {showWarning && <IdleWarningDialog />}
    </IdleTimeoutContext.Provider>
  );
}

/**
 * Warning dialog component
 */
function IdleWarningDialog() {
  const { timeUntilLogout, extendSession } = useIdleTimeout();
  
  const minutes = Math.floor(timeUntilLogout / 60);
  const seconds = timeUntilLogout % 60;
  const timeDisplay = minutes > 0 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Due to inactivity
            </p>
          </div>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          You will be automatically logged out in <strong>{timeDisplay}</strong>.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={extendSession}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
} 