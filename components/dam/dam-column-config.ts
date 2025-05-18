import type React from 'react';

export interface DamColumnConfig {
  id: string;
  headerName: string;
  headerClassName: string;
  cellClassName: string;
  headerStyle?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
  isAssetOnly?: boolean;
  isFolderOnly?: boolean; 
}

export const damTableColumns: DamColumnConfig[] = [
  {
    id: 'icon',
    headerName: '',
    headerClassName: 'flex-shrink-0 flex items-center justify-center',
    cellClassName: 'flex-shrink-0 flex items-center justify-center',
    headerStyle: { width: '1.25rem' },
    cellStyle: { width: '1.25rem' },
  },
  {
    id: 'name',
    headerName: 'Name',
    headerClassName: 'flex-shrink-0 flex-grow w-40 max-w-80 font-semibold text-sm',
    cellClassName: 'flex-shrink-0 flex-grow w-40 max-w-80 text-sm',
  },
  {
    id: 'owner',
    headerName: 'Owner',
    headerClassName: 'flex-shrink-0 flex-grow min-w-10 max-w-35 font-semibold text-sm text-left',
    cellClassName: 'flex-shrink-0 flex-grow min-w-10 max-w-35 text-xs text-muted-foreground min-w-0 truncate text-left',
  },
  {
    id: 'size',
    headerName: 'Size',
    headerClassName: 'flex-shrink-0 flex-grow min-w-10 max-w-20 font-semibold text-sm text-left',
    cellClassName: 'flex-shrink-0 flex-grow min-w-10 max-w-20 text-xs text-muted-foreground text-left truncate',
    isAssetOnly: true,
  },
  {
    id: 'lastModified',
    headerName: 'Last Modified',
    headerClassName: 'flex-shrink-0 flex-grow max-w-40 font-semibold text-sm text-left min-w-0',
    cellClassName: 'flex-shrink-0 flex-grow max-w-40 text-xs text-muted-foreground min-w-0 text-left truncate',
  },
  {
    id: 'location',
    headerName: 'Location',
    headerClassName: 'flex-shrink-0 flex-grow w-48 font-semibold text-sm',
    cellClassName: 'flex-shrink-0 flex-grow text-xs text-muted-foreground w-48 truncate',
    isAssetOnly: true,
  },
  {
    id: 'actions',
    headerName: '',
    headerClassName: 'flex-shrink-0 flex items-center justify-center',
    cellClassName: 'flex-shrink-0 flex items-center justify-center',
    headerStyle: { width: '2rem' },
    cellStyle: { width: '2rem' },
  },
]; 