// Re-export the main FolderItem component for backward compatibility
export { FolderItem } from './FolderItem';

// Export additional components and hooks for advanced usage
export { FolderItemList } from './components/FolderItemList';
export { FolderItemGrid } from './components/FolderItemGrid';
export { FolderThumbnail } from './components/FolderThumbnail';
export { FolderActionMenu } from './components/FolderActionMenu';
export { SelectionOverlay } from './components/SelectionOverlay';
export { useFolderItemState } from './hooks/useFolderItemState';
export { useFolderItemActions } from './hooks/useFolderItemActions';
export { DateFormatters } from './utils/dateFormatters'; 