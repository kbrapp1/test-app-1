/**
 * Customer Journey Display
 * 
 * Component for displaying customer journey framework information.
 * Single responsibility: Display journey stages and engagement classifications.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainConstants } from '../../../../../domain/value-objects/ai-configuration/DomainConstants';

export function CustomerJourneyDisplay() {
  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl">Customer Journey Framework</CardTitle>
        <CardDescription>Progression stages and engagement classifications</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        
        {/* Journey Flow */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Complete Journey Flow</h4>
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {DomainConstants.getAllJourneyStages().map((stage, index, array) => (
                <div key={stage} className="flex items-center gap-3">
                  <div className="group relative">
                    <div className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                      ${index < 4 ? 'bg-blue-600 text-white' : 
                        index < 6 ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'}
                    `}>
                      {stage}
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Stage {index + 1}
                      </div>
                    </div>
                  </div>
                  {index < array.length - 1 && (
                    <div className="w-6 h-0.5 bg-slate-400"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900">Actively Engaged Stages</CardTitle>
              <CardDescription className="text-blue-700">Prospects showing interest and engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DomainConstants.getActivelyEngagedStages()
                .filter(stage => stage !== 'ready_to_buy')
                .map((stage) => (
                  <div key={stage} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-blue-200">
                    {stage}
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-emerald-900">Sales Ready Stages</CardTitle>
              <CardDescription className="text-emerald-700">Qualified prospects ready for sales handoff</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DomainConstants.getSalesReadyStages().map((stage) => (
                <div key={stage} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-emerald-200">
                  {stage}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
} 