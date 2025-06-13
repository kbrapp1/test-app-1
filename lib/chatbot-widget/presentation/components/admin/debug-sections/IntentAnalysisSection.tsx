import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IntentClassification {
  detectedIntent: string;
  confidence: number;
  alternativeIntents: Array<{ intent: string; confidence: number }>;
  category: 'sales' | 'support' | 'qualification' | 'general';
  threshold: number;
  isAmbiguous: boolean;
  rawClassificationResult?: any;
  processingTime?: number;
  modelUsed?: string;
}

interface EntityExtraction {
  extractedEntities: Array<{
    type: string;
    value: string;
    confidence: number;
    category: 'core_business' | 'advanced' | 'contact';
    sourceText?: string;
    position?: { start: number; end: number };
    normalizedValue?: string;
  }>;
  totalEntitiesFound: number;
  extractionMode: 'basic' | 'comprehensive' | 'custom';
  rawExtractionResult?: any;
  processingTime?: number;
  patternsMatched?: string[];
}

interface LeadScoring {
  currentScore: number;
  maxPossibleScore: number;
  qualificationThreshold: number;
  isQualified: boolean;
  scoreBreakdown: Array<{
    entityType: string;
    points: number;
    reason: string;
    weight: number;
    category: string;
    ruleId: string;
  }>;
  previousScore: number;
  scoreChange: number;
  scoringRules?: Array<{
    ruleId: string;
    condition: string;
    points: number;
    triggered: boolean;
  }>;
  processingTime?: number;
}

interface JourneyProgression {
  currentStage: string;
  previousStage: string;
  stageConfidence: number;
  transitionReason: string;
  engagementCategory: 'actively_engaged' | 'sales_ready' | 'general';
  progressionPath: string[];
  stageAnalysis?: {
    indicators: string[];
    signals: Array<{
      type: string;
      strength: number;
      description: string;
    }>;
    nextPossibleStages: Array<{
      stage: string;
      probability: number;
      requirements: string[];
    }>;
  };
  processingTime?: number;
}

interface FunctionCalls {
  firstApiCall?: {
    functions: Array<{
      name: string;
      description: string;
      parameters: any;
    }>;
    functionCallsMade: Array<{
      name: string;
      arguments: any;
      result: any;
      executionTime: number;
      success: boolean;
      error?: string;
    }>;
    totalFunctionExecutionTime: number;
  };
}

interface IntentAnalysisSectionProps {
  intentClassification?: IntentClassification;
  entityExtraction?: EntityExtraction;
  leadScoring?: LeadScoring;
  journeyProgression?: JourneyProgression;
  functionCalls?: FunctionCalls;
}

export function IntentAnalysisSection({ 
  intentClassification, 
  entityExtraction, 
  leadScoring, 
  journeyProgression,
  functionCalls
}: IntentAnalysisSectionProps) {
  return (
    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-800 dark:text-green-200">
        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
        Intent Classification & Entity Extraction Results
      </h4>
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-2">
          <div className="text-sm">
            <strong>Business Logic:</strong> The system makes its first OpenAI API call using function calling to analyze the user's message. This call produces intent classification, entity extraction, lead scoring, and journey progression analysis. This is the "intelligence gathering" API call.
          </div>

          {/* Function Call Details */}
          {functionCalls?.firstApiCall && (
            <div className="border-t pt-2">
              <strong className="text-sm text-green-700 dark:text-green-300">Function Call Configuration:</strong>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong>Functions Available:</strong> {functionCalls.firstApiCall.functions.length}
                  </div>
                  <div>
                    <strong>Total Execution Time:</strong> {functionCalls.firstApiCall.totalFunctionExecutionTime}ms
                  </div>
                </div>
                
                {/* Function Schema & Choices */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <strong className="text-xs">Function Schema & Available Choices:</strong>
                  <div className="mt-2 space-y-3">
                    {functionCalls.firstApiCall.functions.map((func, idx) => (
                      <div key={idx} className="border rounded p-2 bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{func.name}</Badge>
                          <span className="text-xs text-muted-foreground">{func.description}</span>
                        </div>
                        
                        {/* Show the choices/enums we're providing to OpenAI */}
                        {func.parameters?.properties && (
                          <div className="space-y-2">
                            {Object.entries(func.parameters.properties).map(([propName, propSchema]: [string, any]) => (
                              <div key={propName} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <strong className="text-blue-600 dark:text-blue-400">{propName}:</strong>
                                  <span className="text-muted-foreground">{propSchema.type}</span>
                                  {func.parameters.required?.includes(propName) && (
                                    <Badge variant="destructive" className="text-xs px-1 py-0">required</Badge>
                                  )}
                                </div>
                                
                                {/* Show enum choices if available */}
                                {propSchema.enum && (
                                  <div className="ml-4 mt-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Choices:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {propSchema.enum.map((choice: string, choiceIdx: number) => (
                                        <Badge key={choiceIdx} variant="secondary" className="text-xs">
                                          {choice}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Show min/max constraints */}
                                {(propSchema.minimum !== undefined || propSchema.maximum !== undefined) && (
                                  <div className="ml-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    Range: {propSchema.minimum ?? '∞'} - {propSchema.maximum ?? '∞'}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Available Functions Summary */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-2">
                  <strong className="text-xs text-blue-700 dark:text-blue-300">Functions Summary:</strong>
                  <div className="mt-1 space-y-1">
                    {functionCalls.firstApiCall.functions.map((func, idx) => (
                      <div key={idx} className="text-xs">
                        <Badge variant="outline" className="mr-2">{func.name}</Badge>
                        <span className="text-muted-foreground">{func.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Function Calls Made */}
                {functionCalls.firstApiCall.functionCallsMade.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                    <strong className="text-xs">Function Calls Executed:</strong>
                    <div className="mt-2 space-y-2">
                      {functionCalls.firstApiCall.functionCallsMade.map((call, idx) => (
                        <div key={idx} className="border rounded p-2 bg-white dark:bg-gray-900">
                          <div className="flex justify-between items-center mb-1">
                            <Badge variant={call.success ? "default" : "destructive"}>
                              {call.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {call.executionTime}ms
                            </span>
                          </div>
                          
                          {/* Function Arguments */}
                          <div className="text-xs mt-1">
                            <strong>Arguments:</strong>
                            <div className="max-w-full overflow-hidden">
                              <ScrollArea className="h-32 w-full mt-1">
                                <pre className="font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all max-w-full overflow-wrap-anywhere">
                                  {JSON.stringify(call.arguments, null, 2)}
                                </pre>
                              </ScrollArea>
                            </div>
                          </div>

                          {/* Function Result */}
                          <div className="text-xs mt-1">
                            <strong>Result:</strong>
                            <div className="max-w-full overflow-hidden">
                              <ScrollArea className="h-32 w-full mt-1">
                                <pre className="font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all max-w-full overflow-wrap-anywhere">
                                  {JSON.stringify(call.result, null, 2)}
                                </pre>
                              </ScrollArea>
                            </div>
                          </div>

                          {call.error && (
                            <div className="text-xs mt-1 text-red-600">
                              <strong>Error:</strong> {call.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Intent Classification Results */}
          {intentClassification && (
            <div className="border-t pt-2">
              <strong className="text-sm text-green-700 dark:text-green-300">Intent Classification Results:</strong>
              <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <strong>Detected Intent:</strong>
                    <Badge variant={intentClassification.confidence >= intentClassification.threshold ? "default" : "secondary"}>
                      {intentClassification.detectedIntent}
                    </Badge>
                  </div>
                </div>
                <div><strong>Confidence:</strong> {(intentClassification.confidence * 100).toFixed(1)}%</div>
                <div><strong>Business Category:</strong> {intentClassification.category}</div>
                <div><strong>Threshold Required:</strong> {(intentClassification.threshold * 100).toFixed(0)}%</div>
                {intentClassification.processingTime && (
                  <div><strong>Processing Time:</strong> {intentClassification.processingTime}ms</div>
                )}
                {intentClassification.modelUsed && (
                  <div><strong>Model Used:</strong> {intentClassification.modelUsed}</div>
                )}
              </div>
              {intentClassification.isAmbiguous && (
                <div className="text-orange-600 text-sm bg-orange-50 dark:bg-orange-950/20 p-2 rounded mt-2">
                  ⚠ <strong>Ambiguous Intent:</strong> Confidence below threshold - may trigger clarification questions
                </div>
              )}

              {/* Raw Classification Result */}
              {intentClassification.rawClassificationResult && (
                <div className="mt-2">
                  <strong className="text-xs">Raw Classification Result:</strong>
                  <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2 max-w-full overflow-hidden">
                    <ScrollArea className="h-40 w-full">
                      <pre className="font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all max-w-full overflow-wrap-anywhere">
                        {JSON.stringify(intentClassification.rawClassificationResult, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Entity Extraction Results */}
          {entityExtraction && (
            <div className="border-t pt-2">
              <strong className="text-sm text-green-700 dark:text-green-300">Entity Extraction Results:</strong>
              <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                <div><strong>Total Entities Found:</strong> {entityExtraction.totalEntitiesFound}</div>
                <div><strong>Extraction Strategy:</strong> {entityExtraction.extractionMode}</div>
                {entityExtraction.processingTime && (
                  <div><strong>Processing Time:</strong> {entityExtraction.processingTime}ms</div>
                )}
                {entityExtraction.patternsMatched && (
                  <div><strong>Patterns Matched:</strong> {entityExtraction.patternsMatched.length}</div>
                )}
              </div>
              {entityExtraction.extractedEntities.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {entityExtraction.extractedEntities.map((entity, idx) => (
                    <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <div className="flex justify-between items-center">
                        <span><strong>{entity.type}:</strong> {entity.value}</span>
                        <span className="text-green-600">{(entity.confidence * 100).toFixed(1)}%</span>
                      </div>
                      {entity.sourceText && (
                        <div className="text-muted-foreground mt-1">
                          <strong>Source:</strong> "{entity.sourceText}"
                        </div>
                      )}
                      {entity.position && (
                        <div className="text-muted-foreground">
                          <strong>Position:</strong> {entity.position.start}-{entity.position.end}
                        </div>
                      )}
                      {entity.normalizedValue && entity.normalizedValue !== entity.value && (
                        <div className="text-muted-foreground">
                          <strong>Normalized:</strong> {entity.normalizedValue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm mt-1">No extractable business data found</div>
              )}

              {/* Raw Extraction Result */}
              {entityExtraction.rawExtractionResult && (
                <div className="mt-2">
                  <strong className="text-xs">Raw Extraction Result:</strong>
                  <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2 max-w-full overflow-hidden">
                    <ScrollArea className="h-40 w-full">
                      <pre className="font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all max-w-full overflow-wrap-anywhere">
                        {JSON.stringify(entityExtraction.rawExtractionResult, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Lead Scoring Results */}
          {leadScoring && (
            <div className="border-t pt-2">
              <strong className="text-sm text-green-700 dark:text-green-300">Lead Scoring Results:</strong>
              <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <strong>Lead Score:</strong>
                  <Badge variant={leadScoring.isQualified ? "default" : "secondary"}>
                    {leadScoring.currentScore}/{leadScoring.maxPossibleScore}
                  </Badge>
                </div>
                <div><strong>Qualification Status:</strong> 
                  <span className={`ml-1 font-medium ${leadScoring.isQualified ? 'text-green-600' : 'text-orange-600'}`}>
                    {leadScoring.isQualified ? '✅ Qualified' : '⏳ Developing'}
                  </span>
                </div>
                {leadScoring.processingTime && (
                  <div><strong>Processing Time:</strong> {leadScoring.processingTime}ms</div>
                )}
              </div>

              {/* Scoring Rules */}
              {leadScoring.scoringRules && leadScoring.scoringRules.length > 0 && (
                <div className="mt-2">
                  <strong className="text-xs">Scoring Rules Applied:</strong>
                  <div className="mt-1 space-y-1">
                    {leadScoring.scoringRules.map((rule, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded flex justify-between">
                        <span>
                          <Badge variant={rule.triggered ? "default" : "secondary"} className="mr-1">
                            {rule.ruleId}
                          </Badge>
                          {rule.condition}
                        </span>
                        <span className={rule.triggered ? "text-green-600" : "text-gray-500"}>
                          {rule.triggered ? `+${rule.points}` : '0'} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Journey Progression Results */}
          {journeyProgression && (
            <div className="border-t pt-2">
              <strong className="text-sm text-green-700 dark:text-green-300">Journey Progression Results:</strong>
              <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                <div><strong>Current Stage:</strong> 
                  <span className="ml-1 font-medium text-teal-700 dark:text-teal-300">{journeyProgression.currentStage}</span>
                </div>
                <div><strong>Stage Confidence:</strong> {(journeyProgression.stageConfidence * 100).toFixed(1)}%</div>
                {journeyProgression.processingTime && (
                  <div><strong>Processing Time:</strong> {journeyProgression.processingTime}ms</div>
                )}
              </div>

              {/* Stage Analysis */}
              {journeyProgression.stageAnalysis && (
                <div className="mt-2">
                  <strong className="text-xs">Stage Analysis:</strong>
                  <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2">
                    {journeyProgression.stageAnalysis.indicators.length > 0 && (
                      <div className="mb-2">
                        <strong className="text-xs">Indicators:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {journeyProgression.stageAnalysis.indicators.map((indicator, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {journeyProgression.stageAnalysis.signals.length > 0 && (
                      <div className="mb-2">
                        <strong className="text-xs">Signals:</strong>
                        <div className="space-y-1 mt-1">
                          {journeyProgression.stageAnalysis.signals.map((signal, idx) => (
                            <div key={idx} className="text-xs flex justify-between">
                              <span>{signal.description}</span>
                              <span className="text-blue-600">{(signal.strength * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 