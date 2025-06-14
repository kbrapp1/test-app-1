/**
 * Conversation Flow Section
 * 
 * Component for configuring conversation flow and journey tracking.
 * Single responsibility: Handle conversation flow configuration settings.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Clock } from 'lucide-react';
import { ParameterSectionProps } from '../../../types/AdvancedParametersTypes';

export function ConversationFlowSection({ parameters, updateParameter, isEditing }: ParameterSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Conversation Flow & Journey Tracking
        </CardTitle>
        <CardDescription>
          Configure conversation limits, timeouts, and journey tracking behavior.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Flow Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Flow Control</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-turns">Max Conversation Turns</Label>
              <Input
                id="max-turns"
                type="number"
                min="5"
                max="100"
                value={parameters.maxConversationTurns}
                onChange={(e) => updateParameter('maxConversationTurns', parseInt(e.target.value))}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inactivity-timeout">Inactivity Timeout (seconds)</Label>
              <Input
                id="inactivity-timeout"
                type="number"
                min="60"
                max="3600"
                value={parameters.inactivityTimeoutSeconds}
                onChange={(e) => updateParameter('inactivityTimeoutSeconds', parseInt(e.target.value))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Journey Tracking */}
        <div className="space-y-4">
          <h4 className="font-medium">Journey Tracking</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Journey Regression Detection</Label>
                <p className="text-sm text-muted-foreground">
                  Track when users move backward in the sales funnel
                </p>
              </div>
              <Switch
                checked={parameters.enableJourneyRegression}
                onCheckedChange={(checked) => updateParameter('enableJourneyRegression', checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Context Switch Detection</Label>
                <p className="text-sm text-muted-foreground">
                  Detect when conversation topic changes significantly
                </p>
              </div>
              <Switch
                checked={parameters.enableContextSwitchDetection}
                onCheckedChange={(checked) => updateParameter('enableContextSwitchDetection', checked)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Lead Scoring */}
        <div className="space-y-4">
          <h4 className="font-medium">Lead Scoring Weights</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Advanced Lead Scoring</Label>
                <p className="text-sm text-muted-foreground">
                  Use comprehensive entity and persona data for scoring
                </p>
              </div>
              <Switch
                checked={parameters.enableAdvancedScoring}
                onCheckedChange={(checked) => updateParameter('enableAdvancedScoring', checked)}
                disabled={!isEditing}
              />
            </div>

            {parameters.enableAdvancedScoring && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity-weight">
                    Entity Completeness ({parameters.entityCompletenessWeight})
                  </Label>
                  <Input
                    id="entity-weight"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.entityCompletenessWeight}
                    onChange={(e) => updateParameter('entityCompletenessWeight', parseFloat(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persona-weight">
                    Persona Confidence ({parameters.personaConfidenceWeight})
                  </Label>
                  <Input
                    id="persona-weight"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.personaConfidenceWeight}
                    onChange={(e) => updateParameter('personaConfidenceWeight', parseFloat(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="journey-weight">
                    Journey Progression ({parameters.journeyProgressionWeight})
                  </Label>
                  <Input
                    id="journey-weight"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.journeyProgressionWeight}
                    onChange={(e) => updateParameter('journeyProgressionWeight', parseFloat(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 