'use client';

import { PlatformType } from './PlatformSelector';

/**
 * PlatformNotes Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display platform-specific implementation notes
 * - Presentation layer component for contextual information
 * - Keep under 120 lines, focused on note display only
 * - Use minimal color usage with clean typography
 */

interface PlatformNotesProps {
  platform: PlatformType;
}

export function PlatformNotes({ platform }: PlatformNotesProps) {
  const renderWordPressNotes = () => (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h5 className="text-sm font-medium text-amber-900 mb-2">WordPress Notes</h5>
      <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
        <li>Make sure your theme supports wp_footer hooks</li>
        <li>Test in a staging environment first</li>
        <li>The widget will appear on all pages by default</li>
        <li>Consider creating a child theme for custom modifications</li>
      </ul>
    </div>
  );

  const renderReactNotes = () => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h5 className="text-sm font-medium text-green-900 mb-2">React Integration Notes</h5>
      <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
        <li>Component automatically handles cleanup on unmount</li>
        <li>Widget state persists across route changes</li>
        <li>Place in your main layout for site-wide availability</li>
        <li>Compatible with Next.js, Create React App, and other frameworks</li>
      </ul>
    </div>
  );

  const renderHtmlNotes = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h5 className="text-sm font-medium text-gray-900 mb-2">General Notes</h5>
      <ul className="text-sm text-gray-800 space-y-1 list-disc list-inside">
        <li>Works with any HTML website or CMS</li>
        <li>Loads asynchronously for optimal performance</li>
        <li>No jQuery or other dependencies required</li>
        <li>Mobile responsive and cross-browser compatible</li>
      </ul>
    </div>
  );

  switch (platform) {
    case 'wordpress':
      return renderWordPressNotes();
    case 'react':
      return renderReactNotes();
    default:
      return renderHtmlNotes();
  }
} 