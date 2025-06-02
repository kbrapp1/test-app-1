'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Upload, 
  Download, 
  Save,
  Eye
} from 'lucide-react';
import { GenerationCard } from './GenerationCard';
import { GenerationStats as StatsComponent } from './';
import { GenerationDto } from '../../application/dto';
import { GenerationStats } from '../hooks';

interface GeneratorSidebarProps {
  activeGeneration?: GenerationDto;
  stats?: GenerationStats;
  className?: string;
}

export const GeneratorSidebar: React.FC<GeneratorSidebarProps> = ({
  activeGeneration,
  stats,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Stats */}
      {stats && (
        <StatsComponent stats={stats} />
      )}
      
      {/* Active Generation (if any) */}
      {activeGeneration && (
        <GenerationCard 
          generation={activeGeneration} 
          showActions={true}
          size="large"
        />
      )}

      {/* Help & Tips */}
      <Card className="shadow-sm border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-blue-900">
            <Image className="w-4 h-4" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800">
          <div className="space-y-2">
            <p className="font-medium">For best results:</p>
            <ul className="space-y-1 text-xs list-disc list-inside opacity-90">
              <li>Be specific about style, lighting, and mood</li>
              <li>Include details about composition and framing</li>
              <li>Mention artistic styles or reference periods</li>
              <li>Avoid contradictory descriptions</li>
            </ul>
          </div>
          
          <div className="pt-2 border-t border-blue-200">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              Model: FLUX.1 Kontext Pro
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Eye className="w-4 h-4 mr-2" />
            View All Generations
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Upload className="w-4 h-4 mr-2" />
            Save to DAM
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Download Images
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 