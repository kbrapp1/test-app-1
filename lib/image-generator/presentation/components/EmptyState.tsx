'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Wand2, Image, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No images generated yet",
  description = "Create your first AI-generated image to get started",
  showCreateButton = true,
  onCreateClick,
  className = ''
}) => {
  return (
    <Card className={`border-dashed border-2 border-gray-300 bg-gray-50/50 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Image className="w-8 h-8 text-purple-600" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 max-w-sm">{description}</p>
        </div>

        {/* Action Button */}
        {showCreateButton && (
          <Button
            onClick={onCreateClick}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Your First Image
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {/* Pro Tips */}
        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 max-w-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Pro Tips</h4>
          <ul className="text-xs text-gray-600 space-y-1 text-left">
            <li>• Be descriptive with your prompts</li>
            <li>• Include style, mood, and lighting details</li>
            <li>• Try different aspect ratios for variety</li>
            <li>• Save your favorites to the DAM library</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 