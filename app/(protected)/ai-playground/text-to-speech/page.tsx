/**
 * Text-to-Speech Page - Optimized with Client-Side Validation
 * 
 * AI INSTRUCTIONS:
 * - Server actions handle all validation with security-aware caching
 * - No redundant server-side validation needed
 * - TTS components handle access control gracefully
 * - Single responsibility: render TTS interface
 * - Follows DDD optimization patterns
 */

import { TtsPageClient } from '@/lib/tts/presentation/components/TtsPageClient';

// Force dynamic rendering since we use cookies in server actions
export const dynamic = 'force-dynamic';

export default async function TextToSpeechPage() {
  // AI: No server-side validation needed - TTS server actions handle all validation
  // with security-aware caching, eliminating redundant validation calls
  return <TtsPageClient />;
} 