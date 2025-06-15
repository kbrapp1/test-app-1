'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Code } from 'lucide-react';
import { ChatbotConfigDto } from '../../../../application/dto/ChatbotConfigDto';
import {
  EmbedCodeStatusBadge,
  PlatformSelector,
  CodeDisplaySection,
  InstallationInstructions,
  PlatformNotes,
  ConfigurationInfo,
  EmbedCodeGenerationService,
  type PlatformType
} from './embed-code-components';

/**
 * EmbedCodeGenerator Component
 * 
 * AI INSTRUCTIONS:
 * - Main orchestrator for embed code generation functionality
 * - Presentation layer component coordinating focused sub-components
 * - Keep under 150 lines, delegate specific responsibilities to sub-components
 * - Use composition pattern with single-responsibility components
 * - Follow DDD presentation layer patterns with clean separation
 */

interface EmbedCodeGeneratorProps {
  config: ChatbotConfigDto;
  className?: string;
}

export default function EmbedCodeGenerator({ config, className }: EmbedCodeGeneratorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('html');

  const getCurrentCode = (): string => {
    return EmbedCodeGenerationService.generateCodeForPlatform(selectedPlatform, config.id);
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
          <EmbedCodeStatusBadge isActive={config.isActive} />

          <Tabs value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as PlatformType)}>
            <PlatformSelector 
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
            />

            <TabsContent value={selectedPlatform} className="space-y-4">
              <CodeDisplaySection 
                platform={selectedPlatform}
                code={getCurrentCode()}
              />

              <InstallationInstructions platform={selectedPlatform} />

              <PlatformNotes platform={selectedPlatform} />

              <ConfigurationInfo 
                widgetId={config.id}
                lastUpdated={config.updatedAt}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 