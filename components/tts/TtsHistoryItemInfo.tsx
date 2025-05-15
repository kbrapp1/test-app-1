import React from 'react';
import type { Database } from '@/types/supabase';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

export interface TtsHistoryItemInfoProps {
  item: TtsPredictionRow; // May not be fully needed if all display strings are passed
  statusDisplay: string;
  formattedDate: string;
  inputTextSnippet: string;
  voiceIdDisplay: string;
}

export function TtsHistoryItemInfo({
  item,
  statusDisplay,
  formattedDate,
  inputTextSnippet,
  voiceIdDisplay,
}: TtsHistoryItemInfoProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          statusDisplay === 'succeeded' ? 'bg-green-100 text-green-700' :
          statusDisplay === 'failed' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {statusDisplay}
        </span>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
      <p className="text-sm text-gray-800 mb-1 truncate" title={item.inputText || ''}>
        {inputTextSnippet}
      </p>
      <p className="text-xs text-gray-600 mb-3">Voice: {voiceIdDisplay}</p>
    </>
  );
} 