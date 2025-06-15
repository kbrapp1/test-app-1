import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square } from 'lucide-react';

interface SimulatedUserProfile {
  name: string;
  intent: 'browsing' | 'shopping' | 'support' | 'lead_qualification';
  engagementLevel: 'low' | 'medium' | 'high';
  previousKnowledge: 'none' | 'basic' | 'advanced';
  leadReadiness: 'cold' | 'warm' | 'hot';
}

interface ChatConfigurationPanelProps {
  userProfile: SimulatedUserProfile;
  isActive: boolean;
  isLoading: boolean;
  onUserProfileChange: (profile: SimulatedUserProfile) => void;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
}

export function ChatConfigurationPanel({
  userProfile,
  isActive,
  isLoading,
  onUserProfileChange,
  onStartSimulation,
  onStopSimulation,
}: ChatConfigurationPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">User Profile</label>
          <Select 
            value={userProfile.intent} 
            onValueChange={(value) => onUserProfileChange({ ...userProfile, intent: value as any })}
            disabled={isActive}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="browsing">Browsing</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="lead_qualification">Lead Qualification</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Response Mode</label>
          <div className="px-3 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300">
            ✅ Live AI (Mock mode disabled)
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {!isActive ? (
          <Button onClick={onStartSimulation} disabled={isLoading}>
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? 'Starting...' : 'Start Simulation'}
          </Button>
        ) : (
          <Button onClick={onStopSimulation} variant="destructive" disabled={isLoading}>
            <Square className="h-4 w-4 mr-2" />
            {isLoading ? 'Stopping...' : 'Stop Simulation'}
          </Button>
        )}
      </div>
    </div>
  );
} 