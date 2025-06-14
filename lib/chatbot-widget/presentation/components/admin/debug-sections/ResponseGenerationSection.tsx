import React from 'react';
import { ApiRequestDetails } from '../response-generation/ApiRequestDetails';
import { ApiResponseDetails } from '../response-generation/ApiResponseDetails';
import { CostAnalysis } from '../response-generation/CostAnalysis';
import { PerformanceTiming } from '../response-generation/PerformanceTiming';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DebugInfoDto } from '../../../../application/dto/DebugInfoDto';

interface ResponseGenerationSectionProps {
  apiDebugInfo: DebugInfoDto | null;
  sectionNumber: number;
  title: string;
  businessLogic: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
}

export function ResponseGenerationSection({
  apiDebugInfo,
  sectionNumber,
  title,
  businessLogic,
  bgColor,
  borderColor,
  textColor,
  badgeColor
}: ResponseGenerationSectionProps) {
  const secondApiCallData = apiDebugInfo?.secondApiCall;
  
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <h4 className={`font-semibold mb-3 flex items-center gap-2 ${textColor}`}>
        <span className={`${badgeColor} text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold`}>
          {sectionNumber}
        </span>
        {title}
      </h4>
      
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-3">
          <div className="text-sm">
            <strong>Business Logic:</strong> {businessLogic}
          </div>

          {secondApiCallData ? (
            <>
              {/* Raw Request Data Section */}
              <div className="space-y-2">
                <h5 className="font-medium text-indigo-700 dark:text-indigo-300">Full API Request Data</h5>
                <div className="max-w-full overflow-hidden">
                  <ScrollArea className="h-64 w-full rounded border bg-gray-50 dark:bg-gray-800 p-2">
                    <pre className="text-xs whitespace-pre-wrap break-all max-w-full overflow-wrap-anywhere">
                      {JSON.stringify(secondApiCallData.requestData.fullRequestPayload, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>

              {/* Human-Readable Explanation */}
              <div className="space-y-2">
                <h5 className="font-medium text-indigo-700 dark:text-indigo-300">Human-Readable Explanation</h5>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded p-3 space-y-3 text-sm">
                  {(() => {
                    try {
                      const requestData = secondApiCallData.requestData.fullRequestPayload;
                      const messages = requestData.messages || [];
                      const systemMessage = messages.find((msg: any) => msg.role === "system");
                      const userMessages = messages.filter((msg: any) => msg.role === "user");
                      const assistantMessages = messages.filter((msg: any) => msg.role === "assistant");

                      return (
                        <div className="space-y-3">
                          <div>
                            <span className="font-medium text-indigo-800 dark:text-indigo-200">🤖 AI Model Setup:</span>
                            <div className="ml-4 mt-1 text-gray-700 dark:text-gray-300">
                              Using <strong>{requestData.model}</strong> with temperature <strong>{requestData.temperature ?? "default"}</strong> and max tokens <strong>{requestData.max_tokens ?? "default"}</strong>
                            </div>
                          </div>

                          <div>
                            <span className="font-medium text-indigo-800 dark:text-indigo-200">📋 Enhanced System Prompt:</span>
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
                            <span className="font-medium text-indigo-800 dark:text-indigo-200">💬 Conversation History:</span>
                            <div className="ml-4 mt-1 space-y-2">
                              {userMessages.length > 0 ? (
                                <div className="space-y-2">
                                  {userMessages.map((msg: any, index: number) => (
                                    <div key={index} className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded border-l-4 border-blue-500">
                                      <span className="font-medium text-blue-800 dark:text-blue-200">User #{index + 1}:</span>
                                      <div className="text-gray-700 dark:text-gray-300 mt-1">{msg.content}</div>
                                    </div>
                                  ))}
                                  {assistantMessages.length > 0 && (
                                    <div className="space-y-2">
                                      {assistantMessages.map((msg: any, index: number) => (
                                        <div key={index} className="bg-green-100 dark:bg-green-900/30 p-2 rounded border-l-4 border-green-500">
                                          <span className="font-medium text-green-800 dark:text-green-200">Assistant #{index + 1}:</span>
                                          <div className="text-gray-700 dark:text-gray-300 mt-1">{msg.content}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">No conversation history</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="font-medium text-indigo-800 dark:text-indigo-200">🎯 What We're Asking For:</span>
                            <div className="ml-4 mt-1 text-gray-700 dark:text-gray-300">
                              Generate a conversational response using the enhanced context from intent classification, entity extraction, and conversation history
                            </div>
                          </div>

                          <div>
                            <span className="font-medium text-indigo-800 dark:text-indigo-200">💡 In Simple Terms:</span>
                            <div className="ml-4 mt-1 text-gray-700 dark:text-gray-300">
                              This is the second API call that generates the actual response. It uses all the intelligence gathered from the first call (intent, entities, persona) plus conversation context to create a smart, personalized reply for the user.
                            </div>
                          </div>
                        </div>
                      );
                    } catch (error) {
                      return (
                        <div className="text-red-600 dark:text-red-400">
                          Error parsing request data: {error instanceof Error ? error.message : 'Unknown error'}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              <ApiRequestDetails 
                requestData={secondApiCallData.requestData} 
                textColor={textColor} 
              />

              <ApiResponseDetails 
                responseData={secondApiCallData.responseData} 
                textColor={textColor} 
              />

              <CostAnalysis 
                costData={secondApiCallData.costData} 
                responseData={secondApiCallData.responseData} 
                textColor={textColor} 
              />

              <PerformanceTiming 
                performance={{ 
                  componentTimings: { 
                    intentClassification: 0,
                    entityExtraction: 0,
                    leadScoring: 0,
                    responseGeneration: secondApiCallData.responseData.processingTime,
                    total: secondApiCallData.responseData.processingTime
                  },
                  cacheHits: 0,
                  dbQueries: 0,
                  apiCalls: 1
                }} 
                textColor={textColor} 
              />
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No second API call data available. This data will be populated when using Live AI mode.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 