/**
 * Intent Classification Display
 * 
 * Component for displaying intent classification system information.
 * Single responsibility: Display intent types and categories.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainConstants } from '../../../../../domain/value-objects/DomainConstants';

export function IntentClassificationDisplay() {
  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Intent Classification System</CardTitle>
            <CardDescription className="mt-1">
              User message classification categories and intent types
            </CardDescription>
          </div>
          <div className="bg-slate-600 text-white px-4 py-2 rounded-lg text-center">
            <div className="text-sm font-medium">Total Intents</div>
            <div className="text-lg font-bold">{DomainConstants.getAllIntentTypes().length}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sales Intents */}
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Sales Intents
                <span className="text-sm font-normal text-muted-foreground">{DomainConstants.getSalesIntents().length} types</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DomainConstants.getSalesIntents().map((intent) => (
                <div key={intent} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-blue-200">
                  {intent}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Support Intents */}
          <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Support Intents
                <span className="text-sm font-normal text-muted-foreground">{DomainConstants.getSupportIntents().length} types</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DomainConstants.getSupportIntents().map((intent) => (
                <div key={intent} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-emerald-200">
                  {intent}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Qualification Intents */}
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Qualification Intents
                <span className="text-sm font-normal text-muted-foreground">{DomainConstants.getQualificationIntents().length} types</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DomainConstants.getQualificationIntents().map((intent) => (
                <div key={intent} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-purple-200">
                  {intent}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* General Intents */}
          <Card className="border-l-4 border-l-gray-500 bg-gradient-to-br from-gray-50 to-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                General Intents
                <span className="text-sm font-normal text-muted-foreground">
                  {DomainConstants.getAllIntentTypes().filter(intent => DomainConstants.getIntentCategory(intent) === 'general').length} types
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DomainConstants.getAllIntentTypes()
                .filter(intent => DomainConstants.getIntentCategory(intent) === 'general')
                .map((intent) => (
                  <div key={intent} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-gray-200">
                    {intent}
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
} 