'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FolderTreeItem, type FolderTreeItemProps } from './FolderTreeItem';
import type { FolderTreeNode } from './folderPickerUtils';

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const original = await importOriginal<typeof import('lucide-react')>();
  return {
    ...original,
    FolderIcon: () => <svg data-testid="folder-icon" />,
    ChevronRightIcon: () => <svg data-testid="chevron-right-icon" />,
    ChevronDownIcon: () => <svg data-testid="chevron-down-icon" />,
  };
});

const mockNode: FolderTreeNode = {
  id: 'folder1',
  name: 'Folder 1',
  parent_folder_id: null,
  children: [],
};

const mockNodeWithChildren: FolderTreeNode = {
  id: 'folder2',
  name: 'Folder 2 Parent',
  parent_folder_id: null,
  children: [
    {
      id: 'child1',
      name: 'Child Folder 2.1',
      parent_folder_id: 'folder2',
      children: [],
    },
  ],
};

const defaultProps: FolderTreeItemProps = {
  node: mockNode,
  level: 0,
  selectedFolderId: undefined,
  currentAssetFolderId: undefined,
  onSelect: vi.fn(),
  expandedFolders: new Set(),
  toggleExpand: vi.fn(),
};

describe('FolderTreeItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props: Partial<FolderTreeItemProps> = {}) => {
    return render(<FolderTreeItem {...defaultProps} {...props} />);
  };

  it('renders folder name and icon', () => {
    renderComponent();
    expect(screen.getByText('Folder 1')).toBeInTheDocument();
    expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
  });

  it('does not render expand/collapse icon if node has no children', () => {
    renderComponent({ node: mockNode });
    expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    const treeItem = screen.getByRole('treeitem');
    expect(treeItem).not.toHaveAttribute('aria-expanded');
  });

  it('renders expand icon if node has children and is not expanded', () => {
    renderComponent({ node: mockNodeWithChildren, expandedFolders: new Set() });
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    const treeItem = screen.getByRole('treeitem', {name: 'Folder 2 Parent'});
    expect(treeItem).toHaveAttribute('aria-expanded', 'false');
    const expandButton = screen.getByRole('button', {name: 'Expand folder'});
    expect(expandButton).toBeInTheDocument();
  });

  it('renders collapse icon if node has children and is expanded', () => {
    renderComponent({ node: mockNodeWithChildren, expandedFolders: new Set(['folder2']) });
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    const treeItem = screen.getByRole('treeitem', {name: 'Folder 2 Parent'});
    expect(treeItem).toHaveAttribute('aria-expanded', 'true');
    const collapseButton = screen.getByRole('button', {name: 'Collapse folder'});
    expect(collapseButton).toBeInTheDocument();
  });

  it('calls onSelect when folder is clicked and is not current', () => {
    const onSelectMock = vi.fn();
    renderComponent({ node: mockNode, onSelect: onSelectMock, currentAssetFolderId: 'other-folder' });
    const folderButton = screen.getByRole('treeitem', { name: 'Folder 1' });
    fireEvent.click(folderButton);
    expect(onSelectMock).toHaveBeenCalledWith('folder1');
  });

  it('does not call onSelect when folder is current', () => {
    const onSelectMock = vi.fn();
    renderComponent({ node: mockNode, onSelect: onSelectMock, currentAssetFolderId: 'folder1' });
    const folderButton = screen.getByRole('treeitem', { name: 'Folder 1 (Current)' });
    fireEvent.click(folderButton);
    expect(onSelectMock).not.toHaveBeenCalled();
  });

  it('calls toggleExpand when expand icon is clicked', () => {
    const toggleExpandMock = vi.fn();
    renderComponent({ node: mockNodeWithChildren, toggleExpand: toggleExpandMock });
    const expandButton = screen.getByRole('button', { name: 'Expand folder' });
    fireEvent.click(expandButton);
    expect(toggleExpandMock).toHaveBeenCalledWith('folder2');
  });

  it('calls toggleExpand when expand icon is triggered by Space key', () => {
    const toggleExpandMock = vi.fn();
    renderComponent({ node: mockNodeWithChildren, toggleExpand: toggleExpandMock });
    const expandButton = screen.getByRole('button', { name: 'Expand folder' });
    fireEvent.keyDown(expandButton, { key: ' ' });
    expect(toggleExpandMock).toHaveBeenCalledWith('folder2');
  });

  it('calls toggleExpand when expand icon is triggered by Enter key', () => {
    const toggleExpandMock = vi.fn();
    renderComponent({ node: mockNodeWithChildren, toggleExpand: toggleExpandMock });
    const expandButton = screen.getByRole('button', { name: 'Expand folder' });
    fireEvent.keyDown(expandButton, { key: 'Enter' });
    expect(toggleExpandMock).toHaveBeenCalledWith('folder2');
  });

  it('applies selected styles and aria-pressed when selected', () => {
    renderComponent({ node: mockNode, selectedFolderId: 'folder1' });
    const folderButton = screen.getByRole('treeitem', { name: 'Folder 1' });
    expect(folderButton).toHaveClass('bg-secondary');
    expect(folderButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies current folder styles and is disabled when current', () => {
    renderComponent({ node: mockNode, currentAssetFolderId: 'folder1' });
    const folderButton = screen.getByRole('treeitem', { name: 'Folder 1 (Current)' });
    expect(folderButton).toHaveClass('opacity-50 cursor-not-allowed');
    expect(folderButton).toBeDisabled();
    expect(screen.getByText('(Current)')).toBeInTheDocument();
  });

  it('renders child items when expanded', () => {
    renderComponent({ node: mockNodeWithChildren, expandedFolders: new Set(['folder2']) });
    expect(screen.getByText('Child Folder 2.1')).toBeInTheDocument();
    // Check if the child is rendered with an increased level (reflected in style or a data attribute if we add one)
    const childItem = screen.getByText('Child Folder 2.1').closest('[role="treeitem"]');
    // Indirectly check level by padding style
    expect(childItem).toHaveStyle('padding-left: 2rem'); // 0.75 + 1 * 1.25
  });

  it('does not render child items when not expanded', () => {
    renderComponent({ node: mockNodeWithChildren, expandedFolders: new Set() });
    expect(screen.queryByText('Child Folder 2.1')).not.toBeInTheDocument();
  });

  it('applies correct padding based on level', () => {
    renderComponent({ node: mockNode, level: 0 });
    let folderButton = screen.getByRole('treeitem', { name: 'Folder 1' });
    expect(folderButton).toHaveStyle('padding-left: 0.75rem');

    renderComponent({ node: { ...mockNode, name: 'Level 1 Folder' }, level: 1 });
    folderButton = screen.getByRole('treeitem', { name: 'Level 1 Folder' });
    expect(folderButton).toHaveStyle('padding-left: 2rem'); // 0.75 + 1 * 1.25

    renderComponent({ node: { ...mockNode, name: 'Level 2 Folder' }, level: 2 });
    folderButton = screen.getByRole('treeitem', { name: 'Level 2 Folder' });
    expect(folderButton).toHaveStyle('padding-left: 3.25rem'); // 0.75 + 2 * 1.25
  });
}); 