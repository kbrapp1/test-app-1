import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DebugInfoDto } from '../../../../application/dto/DebugInfoDto';

interface FirstApiCallStepProps {
  apiDebugInfo: DebugInfoDto | null;
}

export function FirstApiCallStep({ apiDebugInfo }: FirstApiCallStepProps) {
  const firstApiCallData = apiDebugInfo?.firstApiCall;
  
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
          2
        </span>
        First OpenAI API Call - Function Calling Setup
      </h4>
      
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-3">
          <div className="text-sm">
            <strong>Business Logic:</strong> The system makes its first OpenAI API call using function calling to analyze the user's message. This call produces intent classification, entity extraction, lead scoring, and journey progression analysis. This is the 'intelligence gathering' API call.
          </div>

          {firstApiCallData ? (
            <>
              <div className="space-y-2">
                <h5 className="font-medium text-blue-700 dark:text-blue-300">API Request Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Model:</span> {firstApiCallData.requestData.model}
                  </div>
                  <div>
                    <span className="font-medium">Temperature:</span> {firstApiCallData.requestData.temperature}
                  </div>
                  <div>
                    <span className="font-medium">Max Tokens:</span> {firstApiCallData.requestData.maxTokens}
                  </div>
                  <div>
                    <span className="font-medium">Functions Provided:</span> {firstApiCallData.requestData.functionsProvided?.length || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-blue-700 dark:text-blue-300">API Response Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Response ID:</span> {firstApiCallData.responseData.id}
                  </div>
                  <div>
                    <span className="font-medium">Processing Time:</span> {firstApiCallData.responseData.processingTime}ms
                  </div>
                  <div>
                    <span className="font-medium">Function Calls:</span> {firstApiCallData.responseData.functionCallsExecuted?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {firstApiCallData.responseData.statusCode || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-blue-700 dark:text-blue-300">Token Usage & Cost</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Input Tokens:</span> {firstApiCallData.costData.inputTokens}
                  </div>
                  <div>
                    <span className="font-medium">Output Tokens:</span> {firstApiCallData.costData.outputTokens}
                  </div>
                  <div>
                    <span className="font-medium">Estimated Cost:</span> {firstApiCallData.costData.estimatedCost}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-blue-700 dark:text-blue-300">Full API Request Data</h5>
                <div className="max-w-full overflow-hidden">
                  <ScrollArea className="h-64 w-full rounded border bg-gray-50 dark:bg-gray-800 p-2">
                    <pre className="text-xs whitespace-pre-wrap break-all max-w-full overflow-wrap-anywhere">
                      {JSON.stringify(firstApiCallData.requestData.fullRequestPayload, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-green-700 dark:text-green-300">Human-Readable Explanation</h5>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 space-y-4 text-sm">
                  {(() => {
                    try {
                      const requestData = firstApiCallData.requestData.fullRequestPayload;
                      const systemMessage = requestData.messages?.find((msg: any) => msg.role === 'system');
                      const classifyFunction = requestData.functions?.find((func: any) => func.name === 'classify_intent_and_persona');
                      
                      return (
                        <div className="space-y-4">
                          <div>
                            <span className="font-medium text-green-800 dark:text-green-200">🤖 AI Model Configuration:</span>
                            <div className="ml-4 mt-1 text-gray-700 dark:text-gray-300">
                              <strong>Model:</strong> {requestData.model}<br/>
                              <strong>Temperature:</strong> {requestData.temperature} (0=deterministic, 1=creative)<br/>
                              <strong>Max Tokens:</strong> {requestData.max_tokens}<br/>
                              <strong>Function Call Mode:</strong> {requestData.function_call ? `Forced (${requestData.function_call.name})` : 'Auto-select'}
                            </div>
                          </div>
                          
                                                      <div>
                             <span className="font-medium text-green-800 dark:text-green-200">📋 Full System Prompt:</span>
                             <div className="ml-4 mt-1">
                               {systemMessage ? (
                                 <ScrollArea className="h-64 w-full rounded border bg-white dark:bg-gray-800 p-2">
                                   <pre className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                     {systemMessage.content}
                                   </pre>
                                 </ScrollArea>
                               ) : (
                                 <span className="text-gray-500">No system prompt found</span>
                               )}
                             </div>
                           </div>

                          <div>
                            <span className="font-medium text-green-800 dark:text-green-200">💬 Conversation History:</span>
                            <div className="ml-4 mt-1 space-y-2">
                              {requestData.messages?.filter((msg: any) => msg.role === 'user').map((msg: any, index: number) => (
                                <div key={index} className="bg-white dark:bg-gray-800 rounded border p-2">
                                  <span className="text-xs text-gray-500">Message {index + 1}:</span>
                                  <div className="font-mono text-xs text-gray-700 dark:text-gray-300 mt-1">
                                    "{msg.content}"
                                  </div>
                                </div>
                              )) || <span className="text-gray-500">No user messages found</span>}
                            </div>
                          </div>

                          {classifyFunction && (
                            <>
                              <div>
                                <span className="font-medium text-green-800 dark:text-green-200">🎯 Available Intent Classifications:</span>
                                <div className="ml-4 mt-1">
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    {classifyFunction.parameters?.properties?.primaryIntent?.enum?.map((intent: string) => (
                                      <div key={intent} className="bg-white dark:bg-gray-800 rounded px-2 py-1 border">
                                        {intent}
                                      </div>
                                    )) || <span className="text-gray-500">No intent options found</span>}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="font-medium text-green-800 dark:text-green-200">👤 Available Role Classifications:</span>
                                <div className="ml-4 mt-1">
                                  <div className="grid grid-cols-4 gap-1 text-xs">
                                    {classifyFunction.parameters?.properties?.personaInference?.properties?.role?.enum?.map((role: string) => (
                                      <div key={role} className="bg-white dark:bg-gray-800 rounded px-2 py-1 border">
                                        {role.replace(/_/g, ' ')}
                                      </div>
                                    )) || <span className="text-gray-500">No role options found</span>}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="font-medium text-green-800 dark:text-green-200">🏢 Available Industry Classifications:</span>
                                <div className="ml-4 mt-1">
                                  <div className="grid grid-cols-4 gap-1 text-xs">
                                    {classifyFunction.parameters?.properties?.personaInference?.properties?.industry?.enum?.map((industry: string) => (
                                      <div key={industry} className="bg-white dark:bg-gray-800 rounded px-2 py-1 border">
                                        {industry.replace(/_/g, ' ')}
                                      </div>
                                    )) || <span className="text-gray-500">No industry options found</span>}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="font-medium text-green-800 dark:text-green-200">📊 Company Size Options:</span>
                                <div className="ml-4 mt-1">
                                  <div className="flex gap-2 text-xs">
                                    {classifyFunction.parameters?.properties?.personaInference?.properties?.companySize?.enum?.map((size: string) => (
                                      <div key={size} className="bg-white dark:bg-gray-800 rounded px-2 py-1 border">
                                        {size}
                                      </div>
                                    )) || <span className="text-gray-500">No size options found</span>}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="font-medium text-green-800 dark:text-green-200">🔍 Entity Extraction Fields:</span>
                                <div className="ml-4 mt-1">
                                  <div className="grid grid-cols-3 gap-1 text-xs">
                                    {Object.keys(classifyFunction.parameters?.properties?.entities?.properties || {}).map((entity: string) => (
                                      <div key={entity} className="bg-blue-50 dark:bg-blue-900/30 rounded px-2 py-1 border border-blue-200 dark:border-blue-700">
                                        {entity.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="font-medium text-green-800 dark:text-green-200">⚙️ Special Parameters:</span>
                                <div className="ml-4 mt-1 text-gray-700 dark:text-gray-300 space-y-1 text-xs">
                                  <div><strong>Urgency Levels:</strong> {classifyFunction.parameters?.properties?.entities?.properties?.urgency?.enum?.join(', ') || 'None defined'}</div>
                                  <div><strong>Contact Methods:</strong> {classifyFunction.parameters?.properties?.entities?.properties?.contactMethod?.enum?.join(', ') || 'None defined'}</div>
                                  <div><strong>Issue Types:</strong> {classifyFunction.parameters?.properties?.entities?.properties?.issueType?.enum?.join(', ') || 'None defined'}</div>
                                  <div><strong>Event Types:</strong> {classifyFunction.parameters?.properties?.entities?.properties?.eventType?.enum?.join(', ') || 'None defined'}</div>
                                  <div><strong>Issue Severity:</strong> {classifyFunction.parameters?.properties?.entities?.properties?.severity?.enum?.join(', ') || 'None defined'}</div>
                                </div>
                              </div>
                            </>
                          )}

                          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded p-3">
                            <span className="font-medium text-purple-800 dark:text-purple-200">🔬 QA Pipeline Summary:</span>
                            <div className="mt-1 text-purple-700 dark:text-purple-300 text-xs space-y-1">
                              <div>• The AI can classify into <strong>{classifyFunction?.parameters?.properties?.primaryIntent?.enum?.length || 'unknown'}</strong> different intent types</div>
                              <div>• It can identify <strong>{classifyFunction?.parameters?.properties?.personaInference?.properties?.role?.enum?.length || 'unknown'}</strong> different professional roles</div>
                              <div>• It tracks <strong>{Object.keys(classifyFunction?.parameters?.properties?.entities?.properties || {}).length}</strong> different entity types</div>
                              <div>• It can classify into <strong>{classifyFunction?.parameters?.properties?.personaInference?.properties?.industry?.enum?.length || 'unknown'}</strong> industry categories</div>
                              <div>• All responses are validated against this exact schema before processing</div>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (error) {
                      return (
                        <div className="text-red-600 dark:text-red-400">
                          Error parsing request data for human-readable display: {error instanceof Error ? error.message : 'Unknown error'}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No first API call data available. This data will be populated when using Live AI mode.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 