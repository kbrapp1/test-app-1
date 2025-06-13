import React from 'react';
import { DebugInfoDto } from '../../../../application/dto/DebugInfoDto';

interface RequestPreprocessingStepProps {
  requestData: DebugInfoDto['requestData'];
}

export function RequestPreprocessingStep({ requestData }: RequestPreprocessingStepProps) {
  if (!requestData) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <span className="bg-slate-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
          Request Preprocessing & Validation
        </h4>
        <div className="space-y-2">
          <div className="bg-white dark:bg-gray-900 rounded p-3 border">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No request data available. Please send a message to see preprocessing details.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
        <span className="bg-slate-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
        Request Preprocessing & Validation
      </h4>
      <div className="space-y-2">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border">
          <div className="text-sm">
            <strong>Business Logic:</strong> System receives user message, validates session, loads chatbot configuration, and prepares request for AI processing.
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="break-words">
              <strong>User Message:</strong> "{requestData.userMessage}"
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date(requestData.timestamp).toLocaleTimeString()}
            </div>
            <div>
              <strong>Model Selected:</strong> {requestData.model}
            </div>
            <div>
              <strong>Temperature:</strong> {requestData.temperature}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 