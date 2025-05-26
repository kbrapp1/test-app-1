import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AssetDetailsDto } from '../../../../application/use-cases/assets/GetAssetDetailsUseCase';
import { DomainTagEditor } from '../../assets/DomainTagEditor';
import { ColoredTag } from '../../assets/ColoredTag';
import { TagColorName } from '../../../../domain/value-objects/TagColor';
import type { PlainTag } from '../../../../application/dto/DamApiRequestDto';

// Utility function for date formatting
const formatDate = (date: Date | string): string => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (error) {
    return 'Invalid date';
  }
};

// Detail row component
interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon: Icon, label, value, className }) => (
  <div className={cn("flex items-start space-x-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-150", className)}>
    <div className="flex-shrink-0">
      <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value || 'N/A'}</p>
    </div>
  </div>
);

// Icon components as inline SVGs to avoid imports
const FileTypeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const HardDriveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const LayersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

// Asset Details Section
export const AssetDetailsSection: React.FC<{ asset: AssetDetailsDto | null }> = ({ asset }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center">
        <InfoIcon className="mr-2 h-5 w-5 text-gray-500" />
        Asset Details
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-0 p-0">
      <DetailRow icon={FileTypeIcon} label="Type" value={asset?.mimeType} />
      <DetailRow icon={HardDriveIcon} label="Size" value={asset?.humanReadableSize} />
      <DetailRow icon={CalendarIcon} label="Created" value={asset ? formatDate(asset.createdAt) : 'N/A'} />
      {asset?.updatedAt && (
        <DetailRow icon={ClockIcon} label="Modified" value={formatDate(asset.updatedAt)} />
      )}
    </CardContent>
  </Card>
);

// Asset Tags Section
interface AssetTagsSectionProps {
  asset: AssetDetailsDto | null;
  isUpdatingTag: boolean;
  onTagAdded: (tag: PlainTag, allTags: PlainTag[]) => void;
  onRemoveTag: (tag: PlainTag) => void;
}

export const AssetTagsSection: React.FC<AssetTagsSectionProps> = ({ 
  asset, 
  isUpdatingTag, 
  onTagAdded, 
  onRemoveTag 
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center">
        <TagIcon className="mr-2 h-5 w-5 text-gray-500" />
        Tags
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {(asset?.tags && asset.tags.length > 0) ? (
        <div className="flex flex-wrap gap-2">
          {asset.tags.map((tag: PlainTag) => (
            <ColoredTag
              key={tag.id}
              name={tag.name}
              color={tag.color as TagColorName}
              size="sm"
              removable={true}
              onRemove={() => !isUpdatingTag && onRemoveTag(tag)}
              disabled={isUpdatingTag}
              className="transition-all duration-200"
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic py-2">No tags assigned yet</p>
      )}
      
      {asset && asset.organizationId && (
        <div className="pt-2 border-t">
          <DomainTagEditor 
            assetId={asset.id} 
            organizationId={asset.organizationId}
            currentTags={asset.tags || []}
            onTagAdded={onTagAdded} 
          />
        </div>
      )}
    </CardContent>
  </Card>
);

// Asset Capabilities Section
export const AssetCapabilitiesSection: React.FC<{ asset: AssetDetailsDto | null }> = ({ asset }) => {
  if (!asset?.capabilities) return null;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <LayersIcon className="mr-2 h-5 w-5 text-gray-500" />
          Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className={cn("p-2 rounded", asset.capabilities.canRename ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500")}>
            <span className="font-medium">Rename:</span> {asset.capabilities.canRename ? 'Yes' : 'No'}
          </div>
          <div className={cn("p-2 rounded", asset.capabilities.canDelete ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500")}>
            <span className="font-medium">Delete:</span> {asset.capabilities.canDelete ? 'Yes' : 'No'}
          </div>
          <div className={cn("p-2 rounded", asset.capabilities.canMove ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500")}>
            <span className="font-medium">Move:</span> {asset.capabilities.canMove ? 'Yes' : 'No'}
          </div>
          <div className={cn("p-2 rounded", asset.capabilities.isEditable ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500")}>
            <span className="font-medium">Edit:</span> {asset.capabilities.isEditable ? 'Yes' : 'No'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 
