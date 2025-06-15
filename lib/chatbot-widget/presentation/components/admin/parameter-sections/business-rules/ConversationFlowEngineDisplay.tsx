/**
 * Conversation Flow Engine Display
 * 
 * Component for displaying conversation flow engine information.
 * Single responsibility: Display journey progression logic and decision thresholds.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, MessageSquare, UserCheck, Phone } from 'lucide-react';
import { DomainConstants } from '../../../../../domain/value-objects/ai-configuration/DomainConstants';

export function ConversationFlowEngineDisplay() {
  const thresholds = DomainConstants.getDefaultThresholds();
  const defaultFlow = {
    maxMessagesBeforeLeadCapture: 5,
    leadCaptureStrategy: 'contextual' as const,
    qualificationQuestionTiming: 'mid' as const,
    escalationPreference: 'human' as const
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'progressive': return 'Gradually collect information over multiple interactions';
      case 'upfront': return 'Collect lead information early in conversation';
      case 'contextual': return 'Capture leads based on conversation context and intent';
      default: return strategy;
    }
  };

  const getTimingDescription = (timing: string) => {
    switch (timing) {
      case 'early': return 'Ask qualification questions at conversation start';
      case 'mid': return 'Ask qualification questions mid-conversation';
      case 'late': return 'Ask qualification questions towards end';
      case 'contextual': return 'Ask when contextually relevant';
      default: return timing;
    }
  };

  const getEscalationDescription = (preference: string) => {
    switch (preference) {
      case 'human': return 'Transfer to human agent';
      case 'email': return 'Collect email for follow-up';
      case 'phone': return 'Schedule phone call';
      case 'form': return 'Direct to contact form';
      default: return preference;
    }
  };

  const getEscalationIcon = (preference: string) => {
    switch (preference) {
      case 'human': return <UserCheck className="h-4 w-4" />;
      case 'email': return <MessageSquare className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'form': return <MessageSquare className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl">Conversation Flow Engine</CardTitle>
        <CardDescription>Journey progression logic and decision thresholds</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Lead Capture Strategy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Lead Capture Strategy</h4>
            <Badge variant="outline" className="capitalize">
              {defaultFlow.leadCaptureStrategy}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {getStrategyDescription(defaultFlow.leadCaptureStrategy)}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>Trigger after {defaultFlow.maxMessagesBeforeLeadCapture} messages</span>
          </div>
        </div>

        <Separator />

        {/* Qualification Timing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Qualification Timing</h4>
            <Badge variant="outline" className="capitalize">
              {defaultFlow.qualificationQuestionTiming}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {getTimingDescription(defaultFlow.qualificationQuestionTiming)}
          </p>
        </div>

        <Separator />

        {/* Escalation Preference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Escalation Preference</h4>
            <Badge variant="outline" className="capitalize flex items-center gap-1">
              {getEscalationIcon(defaultFlow.escalationPreference)}
              {defaultFlow.escalationPreference}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {getEscalationDescription(defaultFlow.escalationPreference)}
          </p>
        </div>

        <Separator />

        {/* Decision Thresholds */}
        <div className="space-y-3">
          <h4 className="font-medium">Decision Thresholds</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Intent Confidence</span>
                <span className="font-mono">{(thresholds.intentConfidence * 100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stage Transition</span>
                <span className="font-mono">{(thresholds.stageTransition * 100)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Persona Inference</span>
                <span className="font-mono">{(thresholds.personaInference * 100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lead Qualification</span>
                <span className="font-mono">{thresholds.leadQualification}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 