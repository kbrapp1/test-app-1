import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
  category: 'core_business' | 'advanced' | 'contact';
  sourceText?: string;
  position?: { start: number; end: number };
  normalizedValue?: string;
}

interface EntityExtraction {
  extractedEntities: ExtractedEntity[];
  totalEntitiesFound: number;
  extractionMode: 'basic' | 'comprehensive' | 'custom';
  rawExtractionResult?: any;
  processingTime?: number;
  patternsMatched?: string[];
}

interface EntityExtractionResultsProps {
  entityExtraction: EntityExtraction;
}

export function EntityExtractionResults({ entityExtraction }: EntityExtractionResultsProps) {
  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-green-700 dark:text-green-300">Entity Extraction Results:</strong>
      
      <ExtractionMetrics entityExtraction={entityExtraction} />
      
      {entityExtraction.extractedEntities.length > 0 ? (
        <ExtractedEntitiesList entities={entityExtraction.extractedEntities} />
      ) : (
        <NoEntitiesFound />
      )}

      {entityExtraction.patternsMatched && entityExtraction.patternsMatched.length > 0 && (
        <PatternsMatched patterns={entityExtraction.patternsMatched} />
      )}

      {entityExtraction.rawExtractionResult && (
        <RawExtractionData rawResult={entityExtraction.rawExtractionResult} />
      )}
    </div>
  );
}

function ExtractionMetrics({ entityExtraction }: { entityExtraction: EntityExtraction }) {
  return (
    <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
      <div>
        <strong>Total Entities Found:</strong> 
        <Badge variant={entityExtraction.totalEntitiesFound > 0 ? "default" : "secondary"} className="ml-1">
          {entityExtraction.totalEntitiesFound}
        </Badge>
      </div>
      <div>
        <strong>Extraction Strategy:</strong> 
        <Badge variant="outline" className="ml-1">
          {entityExtraction.extractionMode}
        </Badge>
      </div>
      {entityExtraction.processingTime && (
        <div><strong>Processing Time:</strong> {entityExtraction.processingTime}ms</div>
      )}
      {entityExtraction.patternsMatched && (
        <div><strong>Patterns Matched:</strong> {entityExtraction.patternsMatched.length}</div>
      )}
    </div>
  );
}

function ExtractedEntitiesList({ entities }: { entities: ExtractedEntity[] }) {
  const entitiesByCategory = entities.reduce((acc, entity) => {
    if (!acc[entity.category]) {
      acc[entity.category] = [];
    }
    acc[entity.category].push(entity);
    return acc;
  }, {} as Record<string, ExtractedEntity[]>);

  return (
    <div className="mt-2 space-y-2">
      {Object.entries(entitiesByCategory).map(([category, categoryEntities]) => (
        <EntityCategory 
          key={category} 
          category={category} 
          entities={categoryEntities} 
        />
      ))}
    </div>
  );
}

function EntityCategory({ 
  category, 
  entities 
}: { 
  category: string; 
  entities: ExtractedEntity[] 
}) {
  const categoryColors = {
    core_business: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    advanced: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
    contact: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
  };

  return (
    <div className={`p-2 rounded border ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-50 dark:bg-gray-800'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="text-xs">
          {category.replace('_', ' ').toUpperCase()}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {entities.length} {entities.length === 1 ? 'entity' : 'entities'}
        </span>
      </div>
      
      <div className="space-y-1">
        {entities.map((entity, idx) => (
          <EntityDisplay key={idx} entity={entity} />
        ))}
      </div>
    </div>
  );
}

function EntityDisplay({ entity }: { entity: ExtractedEntity }) {
  const confidenceColor = entity.confidence >= 0.8 ? 'text-green-600' : 
                         entity.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="text-xs bg-white dark:bg-gray-900 p-2 rounded border">
      <div className="flex justify-between items-center">
        <span>
          <strong className="text-blue-600 dark:text-blue-400">{entity.type}:</strong> {entity.value}
        </span>
        <span className={`font-medium ${confidenceColor}`}>
          {(entity.confidence * 100).toFixed(1)}%
        </span>
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
  );
}

function NoEntitiesFound() {
  return (
    <div className="text-muted-foreground text-sm mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
      No extractable business data found in the message
    </div>
  );
}

function PatternsMatched({ patterns }: { patterns: string[] }) {
  return (
    <div className="mt-2">
      <strong className="text-xs">Patterns Matched:</strong>
      <div className="flex flex-wrap gap-1 mt-1">
        {patterns.map((pattern, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {pattern}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function RawExtractionData({ rawResult }: { rawResult: any }) {
  return (
    <div className="mt-2">
      <strong className="text-xs">Raw Extraction Result:</strong>
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