'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, Eye, Code } from 'lucide-react';
import { ChatbotConfigDto } from '../../../application/dto/ChatbotConfigDto';

interface WidgetPreviewProps {
  config: ChatbotConfigDto;
  className?: string;
}

export default function WidgetPreview({ config, className }: WidgetPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);

  const getEmbedCode = () => {
    return `<!-- Chatbot Widget -->
<script>
  (function() {
    var chatbot = document.createElement('div');
    chatbot.id = 'chatbot-widget-${config.id}';
    document.body.appendChild(chatbot);
    
    var script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_SITE_URL}/widget/chatbot.js';
    script.setAttribute('data-config-id', '${config.id}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedCode());
      // Could add toast notification here
    } catch (err) {
      // Copy failed - user will need to manually copy
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Widget Preview
              </CardTitle>
              <CardDescription>
                See how your chatbot will appear to visitors
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={showCode ? 'code' : 'preview'} onValueChange={(value) => setShowCode(value === 'code')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Live Preview</TabsTrigger>
              <TabsTrigger value="code">Embed Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="mt-4">
              <div className="space-y-4">
                {/* Status Indicators */}
                <div className="flex items-center gap-2">
                  <Badge variant={config.isActive ? 'default' : 'secondary'}>
                    {config.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    {config.personalitySettings?.tone || 'Professional'}
                  </Badge>
                  {config.operatingHours?.businessHours?.length > 0 && (
                    <Badge variant="outline">
                      Business Hours Enabled
                    </Badge>
                  )}
                </div>

                {/* Preview Container */}
                <div
                  className={`
                    mx-auto rounded-lg border bg-gray-50 relative overflow-hidden
                    ${previewMode === 'desktop' ? 'w-full max-w-4xl h-96' : 'w-80 h-96'}
                  `}
                >
                  {/* Simulated Website Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-sm mb-2">Your Website</div>
                        <div className="text-xs opacity-60">
                          Chatbot widget will appear here
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chatbot Widget Simulation */}
                  <div className="absolute bottom-4 right-4">
                    {config.isActive ? (
                      <div className="bg-white rounded-lg shadow-lg border">
                        {/* Widget Button */}
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer bg-blue-600"
                        >
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-current rounded-full" />
                          </div>
                        </div>

                        {/* Chat Preview (when expanded) */}
                        <div className="mt-2 w-80 bg-white rounded-lg shadow-lg border p-4">
                          <div className="text-sm font-medium mb-2">
                            {config.name || 'Assistant'}
                          </div>
                          <div className="text-xs text-gray-600 mb-3">
                            {config.personalitySettings?.conversationFlow?.greetingMessage || 'Hello! How can I help you today?'}
                          </div>
                          <div className="flex gap-2">
                            <div className="text-xs bg-gray-100 rounded px-2 py-1">
                              Quick reply 1
                            </div>
                            <div className="text-xs bg-gray-100 rounded px-2 py-1">
                              Quick reply 2
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center">
                        <div className="text-gray-500 text-xs">Off</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuration Summary */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Bot Name</div>
                    <div className="text-gray-600">{config.name || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Communication Style</div>
                    <div className="text-gray-600">{config.personalitySettings?.communicationStyle || 'Friendly'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Tone</div>
                    <div className="text-gray-600">{config.personalitySettings?.tone || 'Professional'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Operating Hours</div>
                    <div className="text-gray-600">
                      {config.operatingHours?.businessHours?.length > 0 ? 'Configured' : 'Not configured'}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Embed Code</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2"
                  >
                    <Code className="h-4 w-4" />
                    Copy Code
                  </Button>
                </div>
                
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                  <pre>{getEmbedCode()}</pre>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">
                    Installation Instructions
                  </h5>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Copy the embed code above</li>
                    <li>Paste it into your website's HTML, just before the closing &lt;/body&gt; tag</li>
                    <li>The chatbot will automatically appear on your site</li>
                    <li>Test the chatbot by visiting your website</li>
                  </ol>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 