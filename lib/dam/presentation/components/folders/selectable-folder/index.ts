// Re-exports for clean API surface and backward compatibility
export { SelectableFolderItem } from './SelectableFolderItem';
export { SelectableFolderList } from './components/SelectableFolderList';
export { SelectableFolderGrid } from './components/SelectableFolderGrid';
export { FolderActionMenu } from './components/FolderActionMenu';
export { FolderThumbnail } from './components/FolderThumbnail';
export { InteractionHint } from './components/InteractionHint';
export { useSelectableFolderState } from './hooks/useSelectableFolderState';
export { useDragClickSeparation } from './hooks/useDragClickSeparation';
export { formatDate } from './utils/dateFormatters';
export type { 
  SelectableFolderItemProps, 
  SelectableFolderState, 
  FolderComponentProps 
} from './types'; 