import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FunctionCall {
  name: string;
  arguments: any;
  result: any;
  executionTime: number;
  success: boolean;
  error?: string;
}

interface Function {
  name: string;
  description: string;
  parameters: any;
}

interface FirstApiCall {
  functions: Function[];
  functionCallsMade: FunctionCall[];
  totalFunctionExecutionTime: number;
}

interface FunctionCallDetailsProps {
  firstApiCall: FirstApiCall;
}

export function FunctionCallDetails({ firstApiCall }: FunctionCallDetailsProps) {
  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-green-700 dark:text-green-300">Function Call Configuration:</strong>
      <div className="mt-2 space-y-2">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <strong>Functions Available:</strong> {firstApiCall.functions.length}
          </div>
          <div>
            <strong>Total Execution Time:</strong> {firstApiCall.totalFunctionExecutionTime}ms
          </div>
        </div>
        
        {/* Function Schema & Choices */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <strong className="text-xs">Function Schema & Available Choices:</strong>
          <div className="mt-2 space-y-3">
            {firstApiCall.functions.map((func, idx) => (
              <FunctionSchemaDisplay key={idx} func={func} />
            ))}
          </div>
        </div>
        
        {/* Available Functions Summary */}
        <FunctionsSummary functions={firstApiCall.functions} />

        {/* Function Calls Made */}
        {firstApiCall.functionCallsMade.length > 0 && (
          <FunctionCallsExecuted functionCalls={firstApiCall.functionCallsMade} />
        )}
      </div>
    </div>
  );
}

function FunctionSchemaDisplay({ func }: { func: Function }) {
  return (
    <div className="border rounded p-2 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline">{func.name}</Badge>
        <span className="text-xs text-muted-foreground">{func.description}</span>
      </div>
      
      {func.parameters?.properties && (
        <div className="space-y-2">
          {Object.entries(func.parameters.properties).map(([propName, propSchema]: [string, any]) => (
            <ParameterDisplay 
              key={propName} 
              propName={propName} 
              propSchema={propSchema}
              required={func.parameters.required?.includes(propName)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ParameterDisplay({ 
  propName, 
  propSchema, 
  required 
}: { 
  propName: string; 
  propSchema: any; 
  required?: boolean;
}) {
  return (
    <div className="text-xs">
      <div className="flex items-center gap-2">
        <strong className="text-blue-600 dark:text-blue-400">{propName}:</strong>
        <span className="text-muted-foreground">{propSchema.type}</span>
        {required && (
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
  );
}

function FunctionsSummary({ functions }: { functions: Function[] }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-2">
      <strong className="text-xs text-blue-700 dark:text-blue-300">Functions Summary:</strong>
      <div className="mt-1 space-y-1">
        {functions.map((func, idx) => (
          <div key={idx} className="text-xs">
            <Badge variant="outline" className="mr-2">{func.name}</Badge>
            <span className="text-muted-foreground">{func.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunctionCallsExecuted({ functionCalls }: { functionCalls: FunctionCall[] }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
      <strong className="text-xs">Function Calls Executed:</strong>
      <div className="mt-2 space-y-2">
        {functionCalls.map((call, idx) => (
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
  );
} 