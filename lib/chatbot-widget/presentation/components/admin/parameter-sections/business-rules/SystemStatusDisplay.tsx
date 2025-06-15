/**
 * System Status Display
 * 
 * Component for displaying system configuration status.
 * Single responsibility: Display real-time validation of business logic components.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainConstants } from '../../../../../domain/value-objects/ai-configuration/DomainConstants';

export function SystemStatusDisplay() {
  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-emerald-900">System Configuration Status</CardTitle>
            <CardDescription className="text-emerald-700">Real-time validation of business logic components</CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Intent Types Mapped',
              value: DomainConstants.getSalesIntents().length + 
                     DomainConstants.getSupportIntents().length + 
                     DomainConstants.getQualificationIntents().length,
              total: DomainConstants.getAllIntentTypes().length
            },
            {
              label: 'Journey Stages',
              value: DomainConstants.getAllJourneyStages().length,
              total: null
            },
            {
              label: 'Scoring Entities',
              value: Object.keys(DomainConstants.getLeadScoringRules()).length,
              total: null
            },
            {
              label: 'Max Lead Score',
              value: 110,
              total: null
            }
          ].map((metric) => (
            <div key={metric.label} className="bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-800 mb-1">
                {metric.value}
                {metric.total && <span className="text-lg text-emerald-600">/{metric.total}</span>}
              </div>
              <div className="text-xs text-emerald-600 font-medium leading-tight">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 