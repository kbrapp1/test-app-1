import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code } from 'lucide-react';
import { ChatApiDebugPanelProps } from '../../types/debug-panel';
import { RequestPreprocessingStep } from './debug-steps/RequestPreprocessingStep';
import { FirstApiCallStep } from './debug-steps/FirstApiCallStep';
import { IntentAnalysisSection } from './debug-sections/IntentAnalysisSection';
import { LeadScoringProgressionStep } from './debug-steps/LeadScoringProgressionStep';
import { BusinessRulesSection } from './debug-sections/BusinessRulesSection';
import { ContextEnhancementStep } from './debug-steps/ContextEnhancementStep';
import { ResponseGenerationSection } from './debug-sections/ResponseGenerationSection';

export function ChatApiDebugPanel({ apiDebugInfo }: ChatApiDebugPanelProps) {

  
  if (!apiDebugInfo) return null;

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          API Debug Information
        </CardTitle>
        <CardDescription>
          Real-time API call details and performance metrics (Live Data + Pipeline Visualization)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[80vh] w-full">
          <div className="space-y-6 pr-4 overflow-x-hidden max-w-full">
            {/* Pipeline Header */}
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold text-primary">
                AI Processing Pipeline (7 Detailed Steps)
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Complete step-by-step breakdown of the dual OpenAI API call architecture with granular process tracking
              </p>
            </div>

            {/* Step 1: Request Preprocessing & Validation */}
            <RequestPreprocessingStep requestData={apiDebugInfo.firstApiCall?.requestData} />

            {/* Step 2: First OpenAI API Call - Function Calling Setup */}
            <FirstApiCallStep 
              apiDebugInfo={apiDebugInfo}
            />

            {/* Step 3: Intent Classification & Entity Extraction */}
            <IntentAnalysisSection
              intentClassification={apiDebugInfo.intentClassification}
              entityExtraction={apiDebugInfo.entityExtraction}
              leadScoring={apiDebugInfo.leadScoring}
              journeyProgression={apiDebugInfo.journeyProgression}
              functionCalls={apiDebugInfo.functionCalls}
            />

            {/* Step 4: Lead Scoring & Journey Progression */}
            <LeadScoringProgressionStep
              leadScoring={apiDebugInfo.leadScoring}
              journeyProgression={apiDebugInfo.journeyProgression}
            />

            {/* Step 5: Business Rules & Automated Actions */}
            <BusinessRulesSection businessRules={apiDebugInfo.businessRules} />

            {/* Step 6: Enhanced System Prompt Construction & Second API Call Preparation */}
            <ContextEnhancementStep 
              functionCalls={apiDebugInfo.functionCalls} 
              requestData={apiDebugInfo.firstApiCall?.requestData}
            />

            {/* Step 7: Second OpenAI API Call - Response Generation */}
            <ResponseGenerationSection
              apiDebugInfo={apiDebugInfo}
              sectionNumber={7}
              title="Second OpenAI API Call - Response Generation"
              businessLogic="The system makes its second OpenAI API call to generate the conversational response. This call uses enhanced system instructions, personality settings, knowledge base context, extracted entities from previous steps, and conversation history to create a contextual response for the user."
              bgColor="bg-indigo-50 dark:bg-indigo-950/20"
              borderColor="border-indigo-200 dark:border-indigo-800"
              textColor="text-indigo-800 dark:text-indigo-200"
              badgeColor="bg-indigo-600"
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 
