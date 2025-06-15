'use client';

import { ExternalLink } from 'lucide-react';
import { PlatformType } from './PlatformSelector';

/**
 * InstallationInstructions Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display platform-specific installation steps
 * - Presentation layer component for instruction visualization
 * - Keep under 100 lines, focused on instruction display only
 * - Use clean typography and minimal color usage
 */

interface InstallationInstructionsProps {
  platform: PlatformType;
}

export function InstallationInstructions({ platform }: InstallationInstructionsProps) {
  const getInstallationSteps = (platform: PlatformType): string[] => {
    switch (platform) {
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
        <ExternalLink className="h-4 w-4" />
        Installation Instructions
      </h5>
      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
        {getInstallationSteps(platform).map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
} 