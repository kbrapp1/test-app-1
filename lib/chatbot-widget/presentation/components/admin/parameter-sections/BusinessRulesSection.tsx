/**
 * Business Rules Section
 * 
 * Component for displaying business rules and automated behaviors.
 * Single responsibility: Display business logic and system behaviors.
 */

import { GitBranch } from 'lucide-react';
import { LeadScoringDisplay } from './business-rules/LeadScoringDisplay';
import { ConversationFlowEngineDisplay } from './business-rules/ConversationFlowEngineDisplay';
import { AutomatedBehaviorsDisplay } from './business-rules/AutomatedBehaviorsDisplay';
import { SystemStatusDisplay } from './business-rules/SystemStatusDisplay';

export function BusinessRulesSection() {
  return (
    <div className="space-y-8">
      <LeadScoringDisplay />
      <ConversationFlowEngineDisplay />
      <AutomatedBehaviorsDisplay />
      <SystemStatusDisplay />
    </div>
  );
} 