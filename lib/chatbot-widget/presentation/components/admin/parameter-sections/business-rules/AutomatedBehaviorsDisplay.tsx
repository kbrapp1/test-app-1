/**
 * Automated Behaviors Display
 * 
 * Component for displaying automated system behaviors.
 * Single responsibility: Display self-executing rules and response logic.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Zap, MessageCircle, Heart, User } from 'lucide-react';
import { DomainConstants } from '../../../../../domain/value-objects/ai-configuration/DomainConstants';

export function AutomatedBehaviorsDisplay() {
  // Default response behaviors from domain
  const defaultBehaviors = {
    useEmojis: false,
    askFollowUpQuestions: true,
    proactiveOffering: true,
    personalizeResponses: true,
    acknowledgePreviousInteractions: true
  };

  // Lead scoring rules from domain constants
  const leadScoringRules = DomainConstants.getLeadScoringRules();
  const thresholds = DomainConstants.getDefaultThresholds();

  const getBehaviorIcon = (behavior: string) => {
    switch (behavior) {
      case 'useEmojis': return <Heart className="h-4 w-4" />;
      case 'askFollowUpQuestions': return <MessageCircle className="h-4 w-4" />;
      case 'proactiveOffering': return <Zap className="h-4 w-4" />;
      case 'personalizeResponses': return <User className="h-4 w-4" />;
      case 'acknowledgePreviousInteractions': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getBehaviorDescription = (behavior: string) => {
    switch (behavior) {
      case 'useEmojis': return 'Include emojis in responses for friendlier tone';
      case 'askFollowUpQuestions': return 'Automatically ask follow-up questions to continue conversation';
      case 'proactiveOffering': return 'Proactively offer help and resources based on context';
      case 'personalizeResponses': return 'Use visitor names and reference previous interactions';
      case 'acknowledgePreviousInteractions': return 'Reference and build upon earlier conversation points';
      default: return behavior;
    }
  };

  const formatBehaviorName = (behavior: string) => {
    return behavior
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl">Automated System Behaviors</CardTitle>
        <CardDescription>Self-executing rules and response logic</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Response Behaviors */}
        <div className="space-y-3">
          <h4 className="font-medium">Response Behaviors</h4>
          <div className="space-y-3">
            {Object.entries(defaultBehaviors).map(([behavior, enabled]) => (
              <div key={behavior} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getBehaviorIcon(behavior)}
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{formatBehaviorName(behavior)}</div>
                    <div className="text-xs text-muted-foreground">
                      {getBehaviorDescription(behavior)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
                    {enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Automated Rules */}
        <div className="space-y-3">
          <h4 className="font-medium">Automated Rules</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lead Capture Trigger</span>
                <Badge variant="default" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically triggers lead capture when engagement score ≥ {thresholds.leadQualification}%
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Intent Classification</span>
                <Badge variant="default" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically classifies user intent when confidence ≥ {(thresholds.intentConfidence * 100)}%
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conversation Stage Transition</span>
                <Badge variant="default" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically advances conversation stage when threshold ≥ {(thresholds.stageTransition * 100)}%
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inactivity Timeout</span>
                <Badge variant="default" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically ends session after {thresholds.inactivityTimeout} seconds of inactivity
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Lead Scoring Automation */}
        <div className="space-y-3">
          <h4 className="font-medium">Lead Scoring Automation</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(leadScoringRules).map(([factor, points]) => (
              <div key={factor} className="flex justify-between">
                <span className="text-muted-foreground capitalize">
                  {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <span className="font-mono">{points}pts</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Automatically calculates lead scores based on conversation analysis
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 