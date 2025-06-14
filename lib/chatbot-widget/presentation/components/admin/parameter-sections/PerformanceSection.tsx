/**
 * Performance Section
 * 
 * Component for configuring performance monitoring and analytics.
 * Single responsibility: Handle performance and monitoring configuration settings.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Zap } from 'lucide-react';
import { ParameterSectionProps } from '../../../types/AdvancedParametersTypes';

export function PerformanceSection({ parameters, updateParameter, isEditing }: ParameterSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance & Monitoring
        </CardTitle>
        <CardDescription>
          Configure performance monitoring, analytics, and optimization settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Performance Monitoring</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Performance Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Log response times and performance metrics
                </p>
              </div>
              <Switch
                checked={parameters.enablePerformanceLogging}
                onCheckedChange={(checked) => updateParameter('enablePerformanceLogging', checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="response-threshold">Response Time Threshold (ms)</Label>
              <Input
                id="response-threshold"
                type="number"
                min="500"
                max="10000"
                value={parameters.responseTimeThresholdMs}
                onChange={(e) => updateParameter('responseTimeThresholdMs', parseInt(e.target.value))}
                disabled={!isEditing}
              />
              <p className="text-xs text-muted-foreground">
                Alert when responses take longer than this threshold
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Analytics Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Analytics & Intelligence</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Intent Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Track intent patterns, confidence scores, and disambiguation data
                </p>
              </div>
              <Switch
                checked={parameters.enableIntentAnalytics}
                onCheckedChange={(checked) => updateParameter('enableIntentAnalytics', checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Persona Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Track persona inference accuracy and conversion patterns
                </p>
              </div>
              <Switch
                checked={parameters.enablePersonaAnalytics}
                onCheckedChange={(checked) => updateParameter('enablePersonaAnalytics', checked)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Current Performance Metrics */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3">Current Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-mono text-lg">~1.2s</div>
              <div className="text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg">94%</div>
              <div className="text-muted-foreground">Intent Accuracy</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg">87%</div>
              <div className="text-muted-foreground">Entity Extraction</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg">76%</div>
              <div className="text-muted-foreground">Persona Confidence</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 