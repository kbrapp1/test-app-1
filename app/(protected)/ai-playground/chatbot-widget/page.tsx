import { redirect } from 'next/navigation';

// Redirect users to the default chatbot widget sub-page
export default function ChatbotWidgetIndexPage() {
  redirect('/ai-playground/chatbot-widget/config');
} 