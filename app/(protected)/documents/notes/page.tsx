/**
 * Notes Page - Optimized with Unified Context Pattern
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Uses unified context pattern exclusively - no server-side data fetching
 * - Client component handles all data fetching via unified context to prevent duplicate calls
 * - Maintains proper error handling and loading states
 * - Follow @golden-rule patterns exactly
 */

import { NotesPageClient } from '@/lib/notes/presentation/components/NotesPageClient';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  // OPTIMIZATION: No server-side data fetching - unified context handles everything
  // This prevents duplicate API calls between server and client
  return <NotesPageClient />;
} 