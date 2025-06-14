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

interface IntentClassificationResultsProps {
  intentClassification: IntentClassification;
}

export function IntentClassificationResults({ intentClassification }: IntentClassificationResultsProps) {
  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-green-700 dark:text-green-300">Intent Classification Results:</strong>
      
      <IntentMetrics intentClassification={intentClassification} />
      
      {intentClassification.isAmbiguous && (
        <AmbiguousIntentWarning />
      )}

      {intentClassification.alternativeIntents?.length > 0 && (
        <AlternativeIntents alternatives={intentClassification.alternativeIntents} />
      )}

      {intentClassification.rawClassificationResult && (
        <RawClassificationData 
          rawResult={intentClassification.rawClassificationResult} 
        />
      )}
    </div>
  );
}

function IntentMetrics({ intentClassification }: { intentClassification: IntentClassification }) {
  const isHighConfidence = intentClassification.confidence >= intentClassification.threshold;
  
  return (
    <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
      <div>
        <div className="flex items-center gap-2">
          <strong>Detected Intent:</strong>
          <Badge variant={isHighConfidence ? "default" : "secondary"}>
            {intentClassification.detectedIntent}
          </Badge>
        </div>
      </div>
      <div>
        <strong>Confidence:</strong> 
        <span className={`ml-1 ${isHighConfidence ? 'text-green-600' : 'text-orange-600'}`}>
          {(intentClassification.confidence * 100).toFixed(1)}%
        </span>
      </div>
      <div>
        <strong>Business Category:</strong> 
        <Badge variant="outline" className="ml-1">
          {intentClassification.category}
        </Badge>
      </div>
      <div>
        <strong>Threshold Required:</strong> {(intentClassification.threshold * 100).toFixed(0)}%
      </div>
      {intentClassification.processingTime && (
        <div><strong>Processing Time:</strong> {intentClassification.processingTime}ms</div>
      )}
      {intentClassification.modelUsed && (
        <div><strong>Model Used:</strong> {intentClassification.modelUsed}</div>
      )}
    </div>
  );
}

function AmbiguousIntentWarning() {
  return (
    <div className="text-orange-600 text-sm bg-orange-50 dark:bg-orange-950/20 p-2 rounded mt-2">
      ⚠ <strong>Ambiguous Intent:</strong> Confidence below threshold - may trigger clarification questions
    </div>
  );
}

function AlternativeIntents({ 
  alternatives 
}: { 
  alternatives: Array<{ intent: string; confidence: number }> 
}) {
  return (
    <div className="mt-2">
      <strong className="text-xs">Alternative Intent Candidates:</strong>
      <div className="mt-1 space-y-1">
        {alternatives.map((alt, idx) => (
          <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded flex justify-between">
            <span className="font-medium">{alt.intent}</span>
            <span className="text-blue-600">{(alt.confidence * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RawClassificationData({ rawResult }: { rawResult: any }) {
  return (
    <div className="mt-2">
      <strong className="text-xs">Raw Classification Result:</strong>
      <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2 max-w-full overflow-hidden">
        <ScrollArea className="h-40 w-full">
          <pre className="font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all max-w-full overflow-wrap-anywhere">
            {JSON.stringify(rawResult, null, 2)}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
} 