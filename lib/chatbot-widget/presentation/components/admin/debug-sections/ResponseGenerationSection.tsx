import React from 'react';
import { ApiRequestDetails } from '../response-generation/ApiRequestDetails';
import { ApiResponseDetails } from '../response-generation/ApiResponseDetails';
import { CostAnalysis } from '../response-generation/CostAnalysis';
import { PerformanceTiming } from '../response-generation/PerformanceTiming';
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