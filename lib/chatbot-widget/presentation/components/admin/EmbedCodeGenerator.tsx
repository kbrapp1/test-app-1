'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, ExternalLink, Globe, CheckCircle } from 'lucide-react';
import { ChatbotConfigDto } from '../../../application/dto/ChatbotConfigDto';

interface EmbedCodeGeneratorProps {
  config: ChatbotConfigDto;
  className?: string;
}

export default function EmbedCodeGenerator({ config, className }: EmbedCodeGeneratorProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'html' | 'wordpress' | 'react'>('html');

  const getBaseEmbedCode = () => {
    return `<!-- Chatbot Widget -->
<script>
  (function() {
    var chatbot = document.createElement('div');
    chatbot.id = 'chatbot-widget-${config.id}';
    document.body.appendChild(chatbot);
    
    var script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_APP_URL_DEV || 'https://your-domain.com'}/widget/chatbot.js';
    script.setAttribute('data-config-id', '${config.id}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  };

  const getWordPressCode = () => {
    return `<?php
// Add this to your theme's functions.php file or use a custom plugin

function add_chatbot_widget() {
    $config_id = '${config.id}';
    $widget_url = '${process.env.NEXT_PUBLIC_APP_URL_DEV || 'https://your-domain.com'}/widget/chatbot.js';
    
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
  };

  const getReactCode = () => {
    return `// React Component Integration
import { useEffect } from 'react';

export default function ChatbotWidget() {
  useEffect(() => {
    // Create widget container
    const chatbot = document.createElement('div');
    chatbot.id = 'chatbot-widget-${config.id}';
    document.body.appendChild(chatbot);
    
    // Load widget script
    const script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_APP_URL_DEV || 'https://your-domain.com'}/widget/chatbot.js';
    script.setAttribute('data-config-id', '${config.id}');
    script.async = true;
    document.head.appendChild(script);
    
    // Cleanup on unmount
    return () => {
      const element = document.getElementById('chatbot-widget-${config.id}');
      if (element) {
        element.remove();
      }
      // Remove script if needed
      const scripts = document.querySelectorAll('script[data-config-id="${config.id}"]');
      scripts.forEach(s => s.remove());
    };
  }, []);
  
  return null; // Widget renders itself
}`;
  };

  const getCurrentCode = () => {
    switch (selectedPlatform) {
      case 'wordpress':
        return getWordPressCode();
      case 'react':
        return getReactCode();
      default:
        return getBaseEmbedCode();
    }
  };

  const copyToClipboard = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      // Copy failed - user will need to manually copy
    }
  };

  const getInstallationSteps = () => {
    switch (selectedPlatform) {
      case 'wordpress':
        return [
          'Copy the PHP code above',
          'Add it to your theme\'s functions.php file',
          'Alternatively, create a custom plugin with this code',
          'The chatbot will appear on all pages in the footer',
          'Test by visiting your WordPress site'
        ];
      case 'react':
        return [
          'Copy the React component code above',
          'Import and use the ChatbotWidget component in your app',
          'Place it in your main layout or specific pages',
          'The widget will load when the component mounts',
          'Test in your development environment'
        ];
      default:
        return [
          'Copy the HTML/JavaScript code above',
          'Paste it into your website\'s HTML',
          'Place it just before the closing </body> tag',
          'The chatbot will automatically appear on your site',
          'Test by visiting your website'
        ];
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Embed Code Generator
          </CardTitle>
          <CardDescription>
            Get the code to add this chatbot to your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Check */}
          <div className="flex items-center gap-2">
            {config.isActive ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Ready to Deploy
              </Badge>
            ) : (
              <Badge variant="secondary">
                Inactive - Enable in Configuration
              </Badge>
            )}
          </div>

          {/* Platform Selection */}
          <Tabs value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="html" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                HTML/JS
              </TabsTrigger>
              <TabsTrigger value="wordpress" className="flex items-center gap-2">
                📝
                WordPress
              </TabsTrigger>
              <TabsTrigger value="react" className="flex items-center gap-2">
                ⚛️
                React
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPlatform} className="space-y-4">
              {/* Code Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    {selectedPlatform === 'wordpress' ? 'PHP Code' : 
                     selectedPlatform === 'react' ? 'React Component' : 'JavaScript Code'}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getCurrentCode(), selectedPlatform)}
                    className="flex items-center gap-2"
                  >
                    {copiedCode === selectedPlatform ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedCode === selectedPlatform ? 'Copied!' : 'Copy Code'}
                  </Button>
                </div>
                
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-80">
                  <pre>{getCurrentCode()}</pre>
                </div>
              </div>

              {/* Installation Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Installation Instructions
                </h5>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  {getInstallationSteps().map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Platform-specific Notes */}
              {selectedPlatform === 'wordpress' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-amber-900 mb-2">WordPress Notes</h5>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>Make sure your theme supports wp_footer hooks</li>
                    <li>Test in a staging environment first</li>
                    <li>The widget will appear on all pages by default</li>
                    <li>Consider creating a child theme for custom modifications</li>
                  </ul>
                </div>
              )}

              {selectedPlatform === 'react' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-green-900 mb-2">React Integration Notes</h5>
                  <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                    <li>Component automatically handles cleanup on unmount</li>
                    <li>Widget state persists across route changes</li>
                    <li>Place in your main layout for site-wide availability</li>
                    <li>Compatible with Next.js, Create React App, and other frameworks</li>
                  </ul>
                </div>
              )}

              {selectedPlatform === 'html' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">General Notes</h5>
                  <ul className="text-sm text-gray-800 space-y-1 list-disc list-inside">
                    <li>Works with any HTML website or CMS</li>
                    <li>Loads asynchronously for optimal performance</li>
                    <li>No jQuery or other dependencies required</li>
                    <li>Mobile responsive and cross-browser compatible</li>
                  </ul>
                </div>
              )}

              {/* Configuration Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium">Widget ID</div>
                  <div className="text-xs text-gray-600 font-mono">{config.id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-xs text-gray-600">
                    {new Date(config.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 