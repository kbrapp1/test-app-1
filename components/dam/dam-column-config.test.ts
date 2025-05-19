/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { damTableColumns, DamColumnConfig } from './dam-column-config';

describe('damTableColumns Configuration', () => {
  it('should be an array', () => {
    expect(Array.isArray(damTableColumns)).toBe(true);
  });

  it('should not be empty', () => {
    expect(damTableColumns.length).toBeGreaterThan(0);
  });

  it('each item should conform to DamColumnConfig interface', () => {
    damTableColumns.forEach(column => {
      expect(column).toHaveProperty('id');
      expect(typeof column.id).toBe('string');
      
      expect(column).toHaveProperty('headerName');
      expect(typeof column.headerName).toBe('string');

      expect(column).toHaveProperty('headerClassName');
      expect(typeof column.headerClassName).toBe('string');

      expect(column).toHaveProperty('cellClassName');
      expect(typeof column.cellClassName).toBe('string');

      // Optional properties check
      if (column.headerStyle) {
        expect(typeof column.headerStyle).toBe('object');
      }
      if (column.cellStyle) {
        expect(typeof column.cellStyle).toBe('object');
      }
      if (column.isAssetOnly) {
        expect(typeof column.isAssetOnly).toBe('boolean');
      }
      if (column.isFolderOnly) {
        expect(typeof column.isFolderOnly).toBe('boolean');
      }
    });
  });

  it('should contain specific expected column IDs', () => {
    const expectedIds = ['icon', 'name', 'owner', 'size', 'lastModified', 'location', 'tags', 'actions'];
    const actualIds = damTableColumns.map(col => col.id);
    expectedIds.forEach(id => {
      expect(actualIds).toContain(id);
    });
  });

  it('should have isAssetOnly true for size and location columns', () => {
    const sizeColumn = damTableColumns.find(col => col.id === 'size');
    expect(sizeColumn).toBeDefined();
    expect(sizeColumn?.isAssetOnly).toBe(true);

    const locationColumn = damTableColumns.find(col => col.id === 'location');
    expect(locationColumn).toBeDefined();
    expect(locationColumn?.isAssetOnly).toBe(true);
  });

  it('should define headerClassName and cellClassName for icon and actions columns', () => {
    const iconColumn = damTableColumns.find(col => col.id === 'icon');
    expect(iconColumn).toBeDefined();
    expect(iconColumn?.headerClassName).toBeDefined();
    expect(iconColumn?.cellClassName).toBeDefined();

    const actionsColumn = damTableColumns.find(col => col.id === 'actions');
    expect(actionsColumn).toBeDefined();
    expect(actionsColumn?.headerClassName).toBeDefined();
    expect(actionsColumn?.cellClassName).toBeDefined();
  });
}); 