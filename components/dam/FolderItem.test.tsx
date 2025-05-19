/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FolderItem, type FolderItemProps } from './FolderItem';
import type { FolderNode as ActualFolderNodeType } from '../../lib/store/folderStore';
import type { Folder } from '../../types/dam';
import * as folderStoreModule from '../../lib/store/folderStore';
import * as folderFetchHookModule from '../../hooks/useFolderFetch';

// Derive UseFolderFetchResult using ReturnType
type UseFolderFetchResult = ReturnType<typeof folderFetchHookModule.useFolderFetch>;

// --- Mocks ---
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, legacyBehavior, ...props }: any) => {
    const linkProps = { ...props };
    if (legacyBehavior === undefined) {
      delete linkProps.legacyBehavior;
    }
    return <a href={href} {...linkProps}>{children}</a>;
  }
}));

// Define mocks for dialogs directly in the factory to avoid hoisting issues
const mockRenameDialogFn = vi.fn();
vi.mock('./RenameFolderDialog', () => ({
  RenameFolderDialog: (props: any) => {
    mockRenameDialogFn(props);
    return props.isOpen ? <div data-testid="mock-rename-dialog">{`Rename: ${props.currentName} (ID: ${props.folderId})`}</div> : null;
  }
}));

const mockDeleteDialogFn = vi.fn();
vi.mock('./DeleteFolderDialog', () => ({
  DeleteFolderDialog: (props: any) => {
    mockDeleteDialogFn(props);
    return props.isOpen ? <div data-testid="mock-delete-dialog">{`Delete: ${props.folderName} (ID: ${props.folderId})`}</div> : null;
  }
}));

const mockToggleExpand = vi.fn();
const mockFetchAndSetChildren = vi.fn().mockResolvedValue(undefined);
const mockFetchFolderChildren = vi.fn().mockResolvedValue([]);

vi.mock('../../lib/store/folderStore', async (importOriginal) => {
  const original = await importOriginal<typeof folderStoreModule>();
  return {
    ...original,
    useFolderStore: vi.fn(() => ({
      toggleExpand: mockToggleExpand,
      fetchAndSetChildren: mockFetchAndSetChildren,
    })),
  };
});

vi.mock('../../hooks/useFolderFetch', async (importOriginal) => {
    const original = await importOriginal<typeof folderFetchHookModule>();
    return {
        ...original,
        useFolderFetch: vi.fn(() => ({
            fetchFolderChildren: mockFetchFolderChildren,
            isLoading: false,
            error: null,
        } as UseFolderFetchResult)),
    };
});

const baseFolderData: Folder = {
    id: 'folder1',
    name: 'Test Folder 1',
    parent_folder_id: null,
    user_id: 'user1',
    organization_id: 'org1',
    created_at: new Date().toISOString(),
    type: 'folder',
    ownerName: 'Owner User',
};

const defaultFolderNode: ActualFolderNodeType = {
  ...baseFolderData,
  children: null,
  isExpanded: false,
  isLoading: false,
  hasError: false,
};

const renderFolderItem = (props: Partial<FolderItemProps> = {}) => {
  const user = userEvent.setup();
  const fullProps: FolderItemProps = {
    folderNode: defaultFolderNode,
    level: 0,
    currentFolderId: null,
    ...props,
  };
  return {
    user,
    ...render(<div data-testid="folder-item-container"><FolderItem {...fullProps} /></div>),
  }
};

describe('FolderItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRenameDialogFn.mockClear();
    mockDeleteDialogFn.mockClear();

    vi.mocked(folderStoreModule.useFolderStore).mockReturnValue({
        toggleExpand: mockToggleExpand,
        fetchAndSetChildren: mockFetchAndSetChildren,
    } as any); 
    vi.mocked(folderFetchHookModule.useFolderFetch).mockReturnValue({
        fetchFolderChildren: mockFetchFolderChildren,
        isLoading: false,
        error: null,
    } as UseFolderFetchResult);
  });

  it('renders folder name and icon', () => {
    renderFolderItem();
    expect(screen.getByText(defaultFolderNode.name)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: defaultFolderNode.name })).toBeInTheDocument();
    expect(document.querySelector('svg.lucide-folder')).toBeInTheDocument();
  });

  it('constructs the correct link href', () => {
    renderFolderItem();
    const link = screen.getByRole('link', { name: defaultFolderNode.name });
    expect(link).toHaveAttribute('href', `/dam?folderId=${defaultFolderNode.id}`);
  });

  it('applies active styles when currentFolderId matches', () => {
    const { container } = renderFolderItem({ currentFolderId: defaultFolderNode.id });
    expect(container.firstChild?.firstChild?.firstChild).toHaveClass('bg-blue-100');
  });

  it('does not apply active styles when currentFolderId does not match', () => {
    const { container } = renderFolderItem({ currentFolderId: 'some-other-folder' });
    expect(container.firstChild?.firstChild?.firstChild).not.toHaveClass('bg-blue-100');
  });
  
  it('applies correct padding based on level', () => {
    const { container } = renderFolderItem({ level: 2 });
    const itemDiv = container.firstChild?.firstChild?.firstChild as HTMLElement;
    expect(itemDiv?.style.paddingLeft).toBe('2.5rem');
  });

  describe('Expansion Logic', () => {
    it('calls toggleExpand on expand button click', async () => {
      const { user } = renderFolderItem();
      const expandButton = screen.getAllByRole('button')[0]; 
      await user.click(expandButton);
      expect(mockToggleExpand).toHaveBeenCalledWith(defaultFolderNode.id);
    });

    it('calls fetchAndSetChildren if expanding and children are null', async () => {
      const { user } = renderFolderItem({ folderNode: { ...defaultFolderNode, isExpanded: false, children: null } });
      mockToggleExpand.mockImplementationOnce(() => {});
      const expandButton = screen.getAllByRole('button')[0];
      await user.click(expandButton);
      await waitFor(() => {
        expect(mockFetchAndSetChildren).toHaveBeenCalledWith(defaultFolderNode.id, mockFetchFolderChildren);
      });
    });

    it('does not call fetchAndSetChildren if expanding but children already exist', async () => {
      const childData: Folder = { ...baseFolderData, id: 'child1', name: 'Child 1', parent_folder_id: defaultFolderNode.id, ownerName: 'Child Owner' };
      const childNode: ActualFolderNodeType = { ...childData, children: null, isExpanded: false, isLoading: false, hasError: false };
      const { user } = renderFolderItem({ folderNode: { ...defaultFolderNode, isExpanded: false, children: [childNode] }}); 
      const expandButton = screen.getAllByRole('button')[0];
      await user.click(expandButton);
      await waitFor(() => {
        expect(mockFetchAndSetChildren).not.toHaveBeenCalled();
      });
    });
    
    it('renders children when expanded and children are present', () => {
        const childData: Folder = { ...baseFolderData, id: 'child1', name: 'Child Folder 1', parent_folder_id: defaultFolderNode.id, ownerName: 'Child Owner' };
        const childNode: ActualFolderNodeType = { ...childData, children: null, isExpanded: false, isLoading: false, hasError: false };
        const nodeWithChildrenExpanded: ActualFolderNodeType = { ...defaultFolderNode, isExpanded: true, children: [childNode] };
        renderFolderItem({ folderNode: nodeWithChildrenExpanded });
        expect(screen.getByText(childNode.name)).toBeInTheDocument();
    });
  });

  describe('Dropdown Menu Actions', () => {
    it('opens RenameFolderDialog when "Rename" is clicked', async () => {
      const { user } = renderFolderItem();
      const menuTrigger = screen.getByRole('button', { name: 'Folder options' });
      expect(menuTrigger).toHaveAttribute('data-state', 'closed');
      await user.click(menuTrigger);
      await waitFor(() => expect(menuTrigger).toHaveAttribute('data-state', 'open'));

      const renameButton = await screen.findByRole('menuitem', { name: /rename/i });
      await user.click(renameButton);

      expect(screen.getByTestId('mock-rename-dialog')).toBeInTheDocument();
      expect(mockRenameDialogFn).toHaveBeenCalled();
      expect(mockRenameDialogFn.mock.lastCall?.[0].isOpen).toBe(true);
      expect(mockRenameDialogFn.mock.lastCall?.[0].folderId).toBe(defaultFolderNode.id);
    });

    it('opens DeleteFolderDialog when "Delete" is clicked', async () => {
      const { user } = renderFolderItem();
      const menuTrigger = screen.getByRole('button', { name: 'Folder options' });
      expect(menuTrigger).toHaveAttribute('data-state', 'closed');
      await user.click(menuTrigger);
      await waitFor(() => expect(menuTrigger).toHaveAttribute('data-state', 'open'));

      const deleteButton = await screen.findByRole('menuitem', { name: /delete/i });
      await user.click(deleteButton);
      
      expect(screen.getByTestId('mock-delete-dialog')).toBeInTheDocument();
      expect(mockDeleteDialogFn).toHaveBeenCalled();
      expect(mockDeleteDialogFn.mock.lastCall?.[0].isOpen).toBe(true);
      expect(mockDeleteDialogFn.mock.lastCall?.[0].folderId).toBe(defaultFolderNode.id);
    });
  });

}); 