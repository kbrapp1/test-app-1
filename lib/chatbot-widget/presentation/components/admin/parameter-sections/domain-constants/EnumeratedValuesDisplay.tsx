/**
 * Enumerated Values Display
 * 
 * Component for displaying enumerated value sets.
 * Single responsibility: Display predefined value collections for structured data extraction.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainConstants } from '../../../../../domain/value-objects/ai-configuration/DomainConstants';

export function EnumeratedValuesDisplay() {
  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl">Enumerated Value Sets</CardTitle>
        <CardDescription>Predefined value collections for structured data extraction</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Priority & Urgency */}
          <div className="space-y-4">
            <Card className="border border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-red-900">Urgency Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DomainConstants.getUrgencyLevels().map((level) => (
                  <div key={level} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-red-100">
                    {level}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-amber-900">Severity Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DomainConstants.getSeverityLevels().map((level) => (
                  <div key={level} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-amber-100">
                    {level}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Communication & Contact */}
          <div className="space-y-4">
            <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-blue-900">Contact Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DomainConstants.getContactMethods().map((method) => (
                  <div key={method} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-blue-100">
                    {method}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-emerald-900">Event Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DomainConstants.getEventTypes().map((type) => (
                  <div key={type} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-emerald-100">
                    {type}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Support & Issues */}
          <div className="space-y-4">
            <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-purple-900">Issue Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DomainConstants.getIssueTypes().map((type) => (
                  <div key={type} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-purple-100">
                    {type}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 