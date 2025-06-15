import { PlatformType } from './PlatformSelector';

/**
 * EmbedCodeGenerationService
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate platform-specific embed codes
 * - Presentation layer service for code generation logic
 * - Keep under 150 lines, focused on code generation only
 * - Pure functions with no side effects
 */

export class EmbedCodeGenerationService {
  private static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL_DEV || 'https://your-domain.com';
  }

  static generateHtmlCode(configId: string): string {
    const baseUrl = this.getBaseUrl();
    return `<!-- Chatbot Widget -->
<script>
  (function() {
    var chatbot = document.createElement('div');
    chatbot.id = 'chatbot-widget-${configId}';
    document.body.appendChild(chatbot);
    
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/chatbot.js';
    script.setAttribute('data-config-id', '${configId}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  }

  static generateWordPressCode(configId: string): string {
    const baseUrl = this.getBaseUrl();
    return `<?php
// Add this to your theme's functions.php file or use a custom plugin

function add_chatbot_widget() {
    $config_id = '${configId}';
    $widget_url = '${baseUrl}/widget/chatbot.js';
    
    echo '<div id="chatbot-widget-' . $config_id . '"></div>';
    echo '<script>';
    echo '(function() {';
    echo '  var script = document.createElement("script");';
    echo '  script.src = "' . $widget_url . '";';
    echo '  script.setAttribute("data-config-id", "' . $config_id . '");';
    echo '  script.async = true;';
    echo '  document.head.appendChild(script);';
    echo '})();';
    echo '</script>';
}

// Add to footer
add_action('wp_footer', 'add_chatbot_widget');
?>`;
  }

  static generateReactCode(configId: string): string {
    const baseUrl = this.getBaseUrl();
    return `// React Component Integration
import { useEffect } from 'react';

export default function ChatbotWidget() {
  useEffect(() => {
    // Create widget container
    const chatbot = document.createElement('div');
    chatbot.id = 'chatbot-widget-${configId}';
    document.body.appendChild(chatbot);
    
    // Load widget script
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget/chatbot.js';
    script.setAttribute('data-config-id', '${configId}');
    script.async = true;
    document.head.appendChild(script);
    
    // Cleanup on unmount
    return () => {
      const element = document.getElementById('chatbot-widget-${configId}');
      if (element) {
        element.remove();
      }
      // Remove script if needed
      const scripts = document.querySelectorAll('script[data-config-id="${configId}"]');
      scripts.forEach(s => s.remove());
    };
  }, []);
  
  return null; // Widget renders itself
}`;
  }

  static generateCodeForPlatform(platform: PlatformType, configId: string): string {
    switch (platform) {
      case 'wordpress':
        return this.generateWordPressCode(configId);
      case 'react':
        return this.generateReactCode(configId);
      default:
        return this.generateHtmlCode(configId);
    }
  }
} 