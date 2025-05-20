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
    headerClassName: 'flex flex-grow min-w-10 max-w-10 items-center justify-center',
    cellClassName: 'flex flex-grow min-w-10 max-w-10 items-center justify-center',

  },
  {
    id: 'name',
    headerName: 'Name',
    headerClassName: 'min-w-[200px] max-w-[300px] w-full whitespace-nowrap font-semibold overflow-hidden text-ellipsis text-sm',
    cellClassName: 'min-w-[200px] max-w-[300px] w-full whitespace-nowrap overflow-hidden text-ellipsis text-xs',
  },
  {
    id: 'owner',
    headerName: 'Owner',
    headerClassName: 'min-w-[100px] max-w-[100px] w-full whitespace-nowrap font-semibold overflow-hidden text-ellipsis text-sm',
    cellClassName: 'min-w-[100px] max-w-[100px] w-full whitespace-nowrap text-muted-foreground overflow-hidden text-ellipsis text-xs',
  },
  {
    id: 'size',
    headerName: 'Size',
    headerClassName: 'min-w-[50px] max-w-[100px] w-full whitespace-nowrap font-semibold text-left overflow-hidden text-ellipsis text-sm',
    cellClassName: 'min-w-[50px] max-w-[100px] w-full whitespace-nowrap text-muted-foreground text-left overflow-hidden text-ellipsis text-xs',
    isAssetOnly: true,
  },
  {
    id: 'lastModified',
    headerName: 'Last Modified',
    headerClassName: 'min-w-[150px] max-w-[150px] w-full whitespace-nowrap font-semibold text-left overflow-hidden text-ellipsis text-sm',
    cellClassName: 'min-w-[150px] max-w-[150px] w-full whitespace-nowrap text-muted-foreground text-left overflow-hidden text-ellipsis text-xs',
  },
  {
    id: 'location',
    headerName: 'Location',
    headerClassName: 'min-w-[50px] max-w-[100px] w-full whitespace-nowrap font-semibold text-left overflow-hidden text-ellipsis text-sm',
    cellClassName: 'min-w-[50px] max-w-[100px] w-full whitespace-nowrap text-muted-foreground text-left overflow-hidden text-ellipsis text-xs',
    isAssetOnly: true,
  },
  {
    id: 'tags',
    headerName: 'Tags',
    headerClassName: 'min-w-[200px] max-w-[200px] w-full whitespace-nowrap font-semibold text-left overflow-hidden text-ellipsis text-sm',
    cellClassName: 'min-w-[200px] max-w-[200px] w-full whitespace-nowrap text-muted-foreground text-left overflow-hidden text-ellipsis text-xs',
    isAssetOnly: true,
  },
  {
    id: 'actions',
    headerName: '',
    headerClassName: 'sticky right-0 min-w-[20px] max-w-[20px] w-full whitespace-nowrap font-semibold text-right overflow-hidden text-ellipsis text-sm bg-muted/50 z-10',
    cellClassName: 'sticky right-0 min-w-[20px] max-w-[20px] w-full whitespace-nowrap text-muted-foreground text-right overflow-hidden text-ellipsis text-xs bg-background z-10',
  },
]; 