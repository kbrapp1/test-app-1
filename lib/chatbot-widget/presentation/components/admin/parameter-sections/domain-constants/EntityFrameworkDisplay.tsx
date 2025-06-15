/**
 * Entity Framework Display
 * 
 * Component for displaying entity extraction framework information.
 * Single responsibility: Display entity types and extraction categories.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainConstants } from '../../../../../domain/value-objects/ai-configuration/DomainConstants';

export function EntityFrameworkDisplay() {
  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl">Entity Extraction Framework</CardTitle>
        <CardDescription>Information types extracted from user messages</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-900">Core Business Entities</CardTitle>
                <CardDescription className="text-orange-700">
                  Essential business information ({DomainConstants.getCoreBusinessEntities().length} types)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {DomainConstants.getCoreBusinessEntities().map((entity) => (
                    <div key={entity} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-orange-200">
                      {entity}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-50 to-violet-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-violet-900">Advanced Entities</CardTitle>
                <CardDescription className="text-violet-700">
                  Specialized information types ({DomainConstants.getAdvancedEntities().length} types)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {DomainConstants.getAdvancedEntities().map((entity) => (
                    <div key={entity} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-violet-200">
                      {entity}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 