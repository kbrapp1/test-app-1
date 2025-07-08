import { redirect } from 'next/navigation';

/**
 * Chatbot Widget Index Page
 * 
 * AI INSTRUCTIONS:
 * - Feature flag protection is handled at layout level
 * - Simply redirect to the default sub-page
 */
export default function ChatbotWidgetIndexPage() {
  // Redirect users to the default chatbot widget sub-page
  redirect('/ai-playground/chatbot-widget/config');
} 