/**
 * Domain Value Object for DAM Data Results
 * 
 * Represents the combined result of DAM operations
 * containing both assets and folders
 */

import { Asset } from '../entities/Asset';
import { Folder } from '../entities/Folder';

export interface GetDamDataResult {
  assets: Asset[];
  folders: Folder[];
}