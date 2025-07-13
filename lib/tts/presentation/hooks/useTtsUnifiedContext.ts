/**
 * TTS Unified Context Hook - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Replaces useOrganizationContext() for TTS pages
 * - Reduces 3 API calls to 1 API call on page load
 * - Maintains compatibility with existing TTS components
 * - Provides all context needed: user, organization, feature flags
 * - Follow @golden-rule patterns exactly
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { getTtsUnifiedContext } from '../actions/ttsUnifiedActions';

export interface TtsUnifiedContextData {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role: string;
  }>;
  featureFlags: Record<string, boolean>;
  isTtsEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  fromCache: boolean;
  refreshContext: () => Promise<void>;
}

/**
 * OPTIMIZATION: Unified context hook for TTS pages
 * Replaces multiple hooks with single optimized call
 */
export function useTtsUnifiedContext(): TtsUnifiedContextData {
  const [state, setState] = useState<{
    user: User | null;
    organizationId: string | null;
    organizations: Array<{ organization_id: string; organization_name: string; role: string }>;
    featureFlags: Record<string, boolean>;
    isTtsEnabled: boolean;
    isLoading: boolean;
    error: string | null;
    fromCache: boolean;
  }>({
    user: null,
    organizationId: null,
    organizations: [],
    featureFlags: {},
    isTtsEnabled: true,
    isLoading: true,
    error: null,
    fromCache: false
  });

  const loadUnifiedContext = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // OPTIMIZATION: Single server action call gets everything
      // Server action handles all authentication validation
      const result = await getTtsUnifiedContext();
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          user: result.data!.user,
          organizationId: result.data!.organizationId,
          organizations: result.data!.organizations,
          featureFlags: result.data!.featureFlags,
          isTtsEnabled: result.data!.isTtsEnabled,
          isLoading: false,
          error: null,
          fromCache: result.data!.fromCache
        }));
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          organizationId: null,
          organizations: [],
          featureFlags: {},
          isTtsEnabled: false,
          isLoading: false,
          error: result.error || 'Failed to load TTS context',
          fromCache: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        user: null,
        organizationId: null,
        organizations: [],
        featureFlags: {},
        isTtsEnabled: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load TTS context',
        fromCache: false
      }));
    }
  }, []);

  const refreshContext = useCallback(async () => {
    await loadUnifiedContext();
  }, [loadUnifiedContext]);

  // Load context immediately - server action handles auth validation
  useEffect(() => {
    loadUnifiedContext();
  }, [loadUnifiedContext]);

  return {
    user: state.user,
    organizationId: state.organizationId,
    organizations: state.organizations,
    featureFlags: state.featureFlags,
    isTtsEnabled: state.isTtsEnabled,
    isLoading: state.isLoading,
    error: state.error,
    fromCache: state.fromCache,
    refreshContext
  };
} 