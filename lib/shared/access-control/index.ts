/**
 * Shared Access Control System
 * 
 * AI INSTRUCTIONS:
 * - Export universal access control components and hooks
 * - Provide consistent access control across all features
 * - Follow fail-secure principles
 * - Support app-wide organization ID non-null pattern
 */

// Client-side hooks
export { useFeatureAccess } from './hooks/useFeatureAccess';
export type { UseFeatureAccessOptions } from './hooks/useFeatureAccess';

// Higher-order components
export { withFeatureGuard, createFeatureGuard } from './components/withFeatureGuard';

// Server-side access control
export { 
  checkFeatureAccess, 
  checkDamAccess, 
  checkChatbotAccess, 
  checkTtsAccess,
  checkImageGenAccess,
  checkNotesAccess
} from './server/checkFeatureAccess';
export type { 
  FeatureAccessOptions, 
  FeatureAccessResult 
} from './server/checkFeatureAccess';

// Guard components (re-export from shared location)
export { NoOrganizationAccess } from '@/components/access-guards/NoOrganizationAccess';
export { FeatureNotAvailable } from '@/components/access-guards/FeatureNotAvailable';
export { InsufficientPermissions } from '@/components/access-guards/InsufficientPermissions'; 