import React from 'react';
import { Badge } from '@/components/ui/badge';

interface BusinessRules {
  rulesTriggered: Array<{
    ruleName: string;
    condition: string;
    action: string;
    result: 'success' | 'failed' | 'skipped';
  }>;
  thresholds: {
    intentConfidence: number;
    stageTransition: number;
    personaInference: number;
  };
  automatedBehaviors: Array<{
    behavior: string;
    triggered: boolean;
    reason: string;
  }>;
}

interface BusinessRulesSectionProps {
  businessRules?: BusinessRules;
}

export function BusinessRulesSection({ businessRules }: BusinessRulesSectionProps) {
  if (!businessRules) return null;

  return (
    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-800 dark:text-red-200">
        <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</span>
        Business Rules & Automated Actions
      </h4>
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-2">
          <div className="text-sm">
            <strong>Business Logic:</strong> Apply business rules based on the analysis results from the first API call. Trigger automated behaviors like lead notifications, CRM updates, or email sequences based on intent confidence, lead scoring, and journey progression.
          </div>
          <div className="border-t pt-2">
            <strong className="text-sm">System Thresholds:</strong>
            <div className="mt-1 grid grid-cols-3 gap-4 text-xs">
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <div className="font-medium">Intent Confidence</div>
                <div className="text-muted-foreground">{(businessRules.thresholds.intentConfidence * 100).toFixed(0)}% required</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <div className="font-medium">Stage Transition</div>
                <div className="text-muted-foreground">{(businessRules.thresholds.stageTransition * 100).toFixed(0)}% required</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <div className="font-medium">Persona Inference</div>
                <div className="text-muted-foreground">{(businessRules.thresholds.personaInference * 100).toFixed(0)}% required</div>
              </div>
            </div>
          </div>
          {businessRules.rulesTriggered.length > 0 && (
            <div className="border-t pt-2">
              <strong className="text-sm">Rules Executed This Turn:</strong>
              <div className="mt-2 space-y-2">
                {businessRules.rulesTriggered.map((rule, idx) => (
                  <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{rule.ruleName}</span>
                      <Badge variant={rule.result === 'success' ? 'default' : rule.result === 'failed' ? 'destructive' : 'secondary'}>
                        {rule.result}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      <strong>IF:</strong> {rule.condition}
                    </div>
                    <div className="text-muted-foreground">
                      <strong>THEN:</strong> {rule.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {businessRules.automatedBehaviors.length > 0 && (
            <div className="border-t pt-2">
              <strong className="text-sm">Automated Behaviors:</strong>
              <div className="mt-2 space-y-2">
                {businessRules.automatedBehaviors.map((behavior, idx) => (
                  <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{behavior.behavior}</span>
                      <Badge variant={behavior.triggered ? 'default' : 'secondary'}>
                        {behavior.triggered ? 'Active' : 'Standby'}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">{behavior.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 