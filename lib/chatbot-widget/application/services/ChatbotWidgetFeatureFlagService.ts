/**
 * Chatbot Widget Feature Flag Service
 * 
 * AI INSTRUCTIONS:
 * - Follow the same pattern as DAM and TTS feature flag services
 * - Provide both throwing and non-throwing versions
 * - Use descriptive error messages
 * - Support conditional cache warming based on feature availability
 */

import { checkFeatureFlag, isFeatureEnabled } from '../../../organization/application/services/FeatureFlagService';

/**
 * Check if chatbot widget feature is enabled (throws if disabled)
 * @throws {Error} If chatbot widget feature is not enabled
 */
export async function checkChatbotWidgetFeatureFlag(): Promise<void> {
  await checkFeatureFlag('chatbot_widget', 'Chatbot Widget');
}

/**
 * Check if chatbot widget feature is enabled (non-throwing)
 * @returns {Promise<boolean>} True if chatbot widget is enabled, false otherwise
 */
export async function isChatbotWidgetEnabled(): Promise<boolean> {
  return await isFeatureEnabled('chatbot_widget');
} 