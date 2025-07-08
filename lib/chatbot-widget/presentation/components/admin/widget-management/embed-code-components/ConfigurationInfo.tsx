'use client';

/** ConfigurationInfo Component */
interface ConfigurationInfoProps {
  widgetId: string;
  lastUpdated: string;
}

export function ConfigurationInfo({ widgetId, lastUpdated }: ConfigurationInfoProps) {
  return (
    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
      <div>
        <div className="text-sm font-medium">Widget ID</div>
        <div className="text-xs text-gray-600 font-mono">{widgetId}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Last Updated</div>
        <div className="text-xs text-gray-600">
          {new Date(lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
} 