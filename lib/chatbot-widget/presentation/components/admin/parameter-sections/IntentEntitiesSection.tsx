/**
 * Intent & Entities Section
 * 
 * Component for configuring intent classification and entity extraction.
 * Single responsibility: Handle intent and entity configuration settings.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Target } from 'lucide-react';
import { ParameterSectionProps } from '../../../types/AdvancedParametersTypes';

export function IntentEntitiesSection({ parameters, updateParameter, isEditing }: ParameterSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Intent Classification & Entity Extraction
        </CardTitle>
        <CardDescription>
          Configure how the AI understands user intent and extracts information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Intent Classification */}
        <div className="space-y-4">
          <h4 className="font-medium">Intent Classification</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="intent-confidence">
                Confidence Threshold ({parameters.intentConfidenceThreshold})
              </Label>
              <Input
                id="intent-confidence"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={parameters.intentConfidenceThreshold}
                onChange={(e) => updateParameter('intentConfidenceThreshold', parseFloat(e.target.value))}
                disabled={!isEditing}
              />
              <p className="text-xs text-muted-foreground">
                Minimum confidence to accept intent classification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intent-ambiguity">
                Ambiguity Threshold ({parameters.intentAmbiguityThreshold})
              </Label>
              <Input
                id="intent-ambiguity"
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={parameters.intentAmbiguityThreshold}
                onChange={(e) => updateParameter('intentAmbiguityThreshold', parseFloat(e.target.value))}
                disabled={!isEditing}
              />
              <p className="text-xs text-muted-foreground">
                Difference threshold to trigger disambiguation
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Multi-Intent Detection</Label>
                <p className="text-sm text-muted-foreground">
                  Detect multiple possible intents for disambiguation
                </p>
              </div>
              <Switch
                checked={parameters.enableMultiIntentDetection}
                onCheckedChange={(checked) => updateParameter('enableMultiIntentDetection', checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Persona Inference</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically infer user role, industry, and company size
                </p>
              </div>
              <Switch
                checked={parameters.enablePersonaInference}
                onCheckedChange={(checked) => updateParameter('enablePersonaInference', checked)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Entity Extraction */}
        <div className="space-y-4">
          <h4 className="font-medium">Entity Extraction</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Advanced Entity Extraction</Label>
                <p className="text-sm text-muted-foreground">
                  Extract 25+ entity types including scheduling, support, and qualification data
                </p>
              </div>
              <Switch
                checked={parameters.enableAdvancedEntities}
                onCheckedChange={(checked) => updateParameter('enableAdvancedEntities', checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-mode">Extraction Mode</Label>
              <select
                id="entity-mode"
                value={parameters.entityExtractionMode}
                onChange={(e) => updateParameter('entityExtractionMode', e.target.value as 'basic' | 'comprehensive' | 'custom')}
                disabled={!isEditing}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="basic">Basic (Core business entities only)</option>
                <option value="comprehensive">Comprehensive (All 25+ entity types)</option>
                <option value="custom">Custom (Specify entity types)</option>
              </select>
            </div>

            {parameters.entityExtractionMode === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-entities">Custom Entity Types</Label>
                <Textarea
                  id="custom-entities"
                  placeholder="Enter entity types, one per line (e.g., budget, timeline, industry)"
                  value={parameters.customEntityTypes.join('\n')}
                  onChange={(e) => updateParameter('customEntityTypes', e.target.value.split('\n').filter(Boolean))}
                  disabled={!isEditing}
                  rows={4}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 