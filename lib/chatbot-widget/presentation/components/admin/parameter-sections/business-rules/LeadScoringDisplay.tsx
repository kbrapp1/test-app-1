/**
 * Lead Scoring Display
 * 
 * Component for displaying lead scoring matrix and rules.
 * Single responsibility: Display lead scoring system information.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainConstants as _DomainConstants } from '../../../../../domain/value-objects/ai-configuration/DomainConstants';

export function LeadScoringDisplay() {
  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Lead Scoring Matrix</CardTitle>
            <CardDescription className="mt-1">
              Weighted point system for automated lead qualification
            </CardDescription>
          </div>
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-center">
            <div className="text-sm font-medium">Qualification</div>
            <div className="text-lg font-bold">70+ Points</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        
        {/* Scoring Formula */}
        <div className="mb-8">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Formula</div>
          <div className="relative">
            <div className="bg-muted text-slate-800 p-6 rounded-lg border font-mono text-sm leading-relaxed">
              <div className="text-slate-600 text-xs mb-2">{/* Automated Lead Scoring Algorithm */}</div>
              <div>
                <span className="text-emerald-700 font-semibold">leadScore</span> = 
                <span className="text-blue-700"> budget</span><span className="text-slate-500">(25)</span> + 
                <span className="text-blue-700"> timeline</span><span className="text-slate-500">(20)</span> + 
                <span className="text-blue-700"> company</span><span className="text-slate-500">(15)</span> + 
                <span className="text-blue-700"> teamSize</span><span className="text-slate-500">(15)</span>
              </div>
              <div className="ml-20">
                + <span className="text-blue-700">industry</span><span className="text-slate-500">(10)</span> + 
                <span className="text-blue-700"> urgency</span><span className="text-slate-500">(10)</span> + 
                <span className="text-blue-700"> role</span><span className="text-slate-500">(10)</span> + 
                <span className="text-blue-700"> contact</span><span className="text-slate-500">(5)</span>
              </div>
            </div>
            <div className="absolute top-2 right-2 text-xs text-slate-600 bg-background px-2 py-1 rounded border">
              Max: 110 points
            </div>
          </div>
        </div>
        
        {/* Entity Values */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Critical Value Entities
                <span className="text-sm font-normal text-muted-foreground">15-25 pts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Budget Information', points: 25 },
                { label: 'Project Timeline', points: 20 },
                { label: 'Company Details', points: 15 },
                { label: 'Team Size', points: 15 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 px-3 bg-white/70 rounded-lg">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {item.points}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Standard Value Entities
                <span className="text-sm font-normal text-muted-foreground">10 pts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Industry Type', points: 10 },
                { label: 'Urgency Level', points: 10 },
                { label: 'User Role', points: 10 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 px-3 bg-white/70 rounded-lg">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="bg-amber-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {item.points}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Basic Information
                <span className="text-sm font-normal text-muted-foreground">5 pts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-white/70 rounded-lg">
                <span className="text-sm font-medium">Contact Method</span>
                <div className="bg-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  5
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-white border-2 border-emerald-200 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-700 mb-1">70+</div>
                  <div className="text-sm text-emerald-600 font-medium">Qualification Threshold</div>
                  <div className="text-xs text-emerald-500 mt-1">Triggers sales handoff</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
} 