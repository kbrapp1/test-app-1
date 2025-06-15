/**
 * Domain Statistics Display
 * 
 * Component for displaying domain model statistics.
 * Single responsibility: Display comprehensive overview of domain coverage and complexity.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainConstants } from '../../../../../domain/value-objects/ai-configuration/DomainConstants';

export function DomainStatisticsDisplay() {
  return (
    <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">Domain Model Statistics</CardTitle>
        <CardDescription className="text-slate-700">Comprehensive overview of domain coverage and complexity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Intent Types', value: DomainConstants.getAllIntentTypes().length, icon: '🎯' },
            { label: 'Journey Stages', value: DomainConstants.getAllJourneyStages().length, icon: '🗺️' },
            { label: 'Core Entities', value: DomainConstants.getCoreBusinessEntities().length, icon: '💼' },
            { label: 'Advanced Entities', value: DomainConstants.getAdvancedEntities().length, icon: '⚡' },
            { label: 'Value Sets', value: 5, icon: '📋' },
            { 
              label: 'Total Values', 
              value: DomainConstants.getUrgencyLevels().length + 
                     DomainConstants.getSeverityLevels().length + 
                     DomainConstants.getContactMethods().length + 
                     DomainConstants.getEventTypes().length + 
                     DomainConstants.getIssueTypes().length, 
              icon: '📊' 
            }
          ].map((stat) => (
            <div key={stat.label} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-600 font-medium leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 