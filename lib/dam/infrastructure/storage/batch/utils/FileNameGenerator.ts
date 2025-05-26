/**
 * FileNameGenerator - Infrastructure Layer Utility
 * 
 * Single Responsibility: Generate user-friendly filenames for downloads
 * Follows DDD principles by focusing on filename generation logic
 */
export class FileNameGenerator {
  
  /**
   * Generate user-friendly ZIP filename based on asset data and options
   */
  generateZipFileName(
    assetData: Array<{ id: string; name: string; storagePath: string; folderPath?: string }>,
    options?: { folderNames?: string[]; selectionType?: 'assets' | 'folders' | 'mixed' }
  ): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const assetCount = assetData.length;
    
    // If we have folder information
    if (options?.folderNames && options.folderNames.length > 0) {
      return this.generateFolderBasedName(options.folderNames, dateStr);
    }
    
    // For direct asset selection
    if (options?.selectionType === 'assets') {
      return this.generateAssetBasedName(assetCount, assetData[0]?.name, dateStr);
    }
    
    // Mixed or general selection
    return this.generateGenericName(assetCount, options?.selectionType, dateStr);
  }

  /**
   * Generate filename based on folder names
   */
  private generateFolderBasedName(folderNames: string[], dateStr: string): string {
    if (folderNames.length === 1) {
      return `${this.sanitize(folderNames[0])}_Assets_${dateStr}.zip`;
    } else if (folderNames.length <= 3) {
      const folderStr = folderNames.map(name => this.sanitize(name)).join('_');
      return `${folderStr}_Assets_${dateStr}.zip`;
    } else {
      return `${folderNames.length}_Folders_Assets_${dateStr}.zip`;
    }
  }

  /**
   * Generate filename based on asset selection
   */
  private generateAssetBasedName(assetCount: number, firstName: string | undefined, dateStr: string): string {
    if (assetCount === 1 && firstName) {
      const name = firstName.includes('.') 
        ? firstName.substring(0, firstName.lastIndexOf('.'))
        : firstName;
      return `${this.sanitize(name)}_${dateStr}.zip`;
    } else {
      return `${assetCount}_Selected_Assets_${dateStr}.zip`;
    }
  }

  /**
   * Generate generic filename for mixed selections
   */
  private generateGenericName(
    assetCount: number, 
    selectionType: 'assets' | 'folders' | 'mixed' | undefined, 
    dateStr: string
  ): string {
    switch (selectionType) {
      case 'folders':
        return `Selected_Folders_${dateStr}.zip`;
      case 'mixed':
        return `Mixed_Selection_${dateStr}.zip`;
      default:
        return `${assetCount}_Items_${dateStr}.zip`;
    }
  }

  /**
   * Sanitize filename by removing invalid characters
   */
  private sanitize(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
  }
} 