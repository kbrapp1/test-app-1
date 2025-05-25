// DAM Server Actions - DDD-Compliant Thin Wrappers
// Server actions that delegate to use cases following DDD patterns

export { getAssetDownloadUrl } from './getAssetDownloadUrl.action';
export { listTextAssets, getAssetContent, updateAssetText, saveAsNewTextAsset } from './textAsset.actions';
export { saveDamSearch, listSavedSearches, executeSavedSearch } from './savedSearches.actions';
export { 
  renameFolderAction, 
  deleteFolderAction, 
  createFolderAction,
  renameFolderClientAction,
  deleteFolderClientAction,
  updateFolderAction,
  createFolderActionForm,
  deleteFolderActionForm
} from './folder.actions';

// Navigation actions (DDD compliant)
export {
  getRootFolders,
  getFolderNavigation
} from './navigation.actions'; 
