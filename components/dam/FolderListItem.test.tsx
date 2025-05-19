/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, fireEvent, waitFor, act, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Import userEvent
import { DndContext, useDroppable } from '@dnd-kit/core'; // Import useDroppable for mocking
import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { FolderListItem, type FolderListItemProps } from './FolderListItem';
import type { Folder } from '@/types/dam';
import { useToast } from '@/components/ui/use-toast';
import * as ActualFolderActions from '@/lib/actions/dam/folder.actions'; // Import actual actions

// --- Mocks ---

// We will spy on these later, so no vi.mock for folder.actions itself initially
let mockRenameFolderClient: any;
let mockDeleteFolderClient: any;

// Mock DnD kit module so useDroppable can be stubbed
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual, // Spread actual implementations
    useDroppable: vi.fn(() => ({ // Provide a default mock for useDroppable
      setNodeRef: vi.fn(),
      isOver: false,
      active: null,
      rect: { current: null },
      node: { current: null },
      over: null,
    })),
    // DndContext will be the actual implementation due to the spread
  };
});

// Mock Next.js Link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock lucide-react icons (synchronous version)
vi.mock('lucide-react', () => ({
  __esModule: true,
  Folder: () => <div data-testid="icon-folder" />,
  MoreHorizontal: () => <div data-testid="icon-more-horizontal" />,
  Edit3: () => <div data-testid="icon-edit3" />,
  Trash2: () => <div data-testid="icon-trash2" />,
  // If other icons are used by the component or its children not covered here,
  // they would need to be added or a default export mock provided.
}));

// Mock UI components & hooks
const mockUIToastFn = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: mockUIToastFn })),
}));

vi.mock('./dialogs/InputDialog', () => ({
  InputDialog: (props: any) => props.isOpen ? (
    <div data-testid="mock-input-dialog">
      <span>{props.title}</span>
      <input 
        defaultValue={props.initialValue} 
        data-testid="rename-input" 
        placeholder={props.inputPlaceholder}
      />
      <button onClick={() => {
        const inputElement = document.querySelector('[data-testid="rename-input"]') as HTMLInputElement;
        props.onSubmit(inputElement ? inputElement.value : '');
      }}>SubmitRename</button>
      <button onClick={() => props.onOpenChange(false)}>CancelRename</button>
    </div>
  ) : null,
}));

vi.mock('./dialogs/ConfirmationDialog', () => ({
  ConfirmationDialog: (props: any) => props.isOpen ? (
    <div data-testid="mock-confirmation-dialog">
      <span>{props.title}</span>
      <button onClick={props.onConfirm} disabled={props.isLoading}>ConfirmDelete</button>
      <button onClick={() => props.onOpenChange(false)}>CancelDelete</button>
    </div>
  ) : null,
}));

const mockFolderData: Folder = {
  id: 'folder123',
  name: 'Test Folder Name',
  type: 'folder',
  user_id: 'user1',
  organization_id: 'org1',
  created_at: '2023-01-01T00:00:00Z',
  parent_folder_id: null,
  ownerName: 'Test User',
};

const defaultProps: FolderListItemProps = {
  folder: mockFolderData,
  onDataChange: vi.fn(),
};

// Helper to render with DndContext
const renderWithDnd = (ui: React.ReactElement) => {
    return render(<DndContext>{ui}</DndContext>);
  };

let mockFolder: Folder;
let mockOnDataChange: Mock;
let mockToast: Mock;
let renderSubject: () => RenderResult;

// Overhauled DropdownMenu mock using React state and context
const MockDropdownContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

vi.mock('@/components/ui/dropdown-menu', () => ({
  __esModule: true,
  DropdownMenu: ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
      <MockDropdownContext.Provider value={{ isOpen, setIsOpen }}>
        <div data-testid="mock-dropdown-menu">{children}</div>
      </MockDropdownContext.Provider>
    );
  },
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => {
    const context = React.useContext(MockDropdownContext);
    if (!context) throw new Error("MockDropdownMenuTrigger must be used within MockDropdownMenu");
    const { setIsOpen } = context;

    const handleClick = () => {
      setIsOpen(true);
    };

    if (asChild && React.isValidElement(children)) {
      const childElement = React.Children.only(children) as React.ReactElement;
      return React.cloneElement(childElement, {
        ...(childElement.props as any),
        onClick: (e: React.MouseEvent) => {
          handleClick();
          (childElement.props as any)?.onClick?.(e);
        },
        'aria-haspopup': 'menu',
        'aria-expanded': context.isOpen,
      } as any);
    }
    return <button onClick={handleClick} aria-haspopup="menu" aria-expanded={context.isOpen}>{children}</button>;
  },
  DropdownMenuContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
    const context = React.useContext(MockDropdownContext);
    if (!context) throw new Error("MockDropdownMenuContent must be used within MockDropdownMenu");
    return context.isOpen ? <div role="menu" data-testid="mock-dropdown-content" {...props}>{children}</div> : null;
  },
  DropdownMenuItem: ({ children, onSelect, className, ...props }: { children: React.ReactNode; onSelect?: (event?: Event) => void; className?: string; [key: string]: any }) => {
    const context = React.useContext(MockDropdownContext);
    if (!context) throw new Error("MockDropdownMenuItem must be used within MockDropdownMenu");
    const { setIsOpen } = context;

    return (
      <div
        role="menuitem"
        tabIndex={-1}
        {...props}
        className={className}
        onClick={(e) => {
          onSelect?.(e as any);
          setIsOpen(false);
        }}
        data-testid={`mock-menu-item-${typeof children === "string" ? children.toString().replace(/\s+/g, '-').toLowerCase() : "custom"}`}
      >
        {children}
      </div>
    );
  },
  DropdownMenuSeparator: () => <hr data-testid="mock-dropdown-separator" />,
}));

describe('FolderListItem', () => {
  beforeEach(() => {
    mockFolder = {
      id: 'folder-1',
      name: 'Mock Folder',
      parent_folder_id: null,
      created_at: '2023-01-01',
      user_id: 'user-123',
      organization_id: 'org-123',
      type: 'folder',
      ownerName: 'Test User',
    };
    mockOnDataChange = vi.fn();
    mockToast = vi.fn();

    // Spy on the actual imported actions and provide mock implementations
    mockRenameFolderClient = vi.spyOn(ActualFolderActions, 'renameFolderClient').mockImplementation(vi.fn());
    mockDeleteFolderClient = vi.spyOn(ActualFolderActions, 'deleteFolderClient').mockImplementation(vi.fn());
    
    // Stub useDroppable hook
    vi.mocked(useDroppable).mockClear();
    vi.mocked(useDroppable).mockReturnValue({
      setNodeRef: vi.fn(),
      isOver: false,
      active: null,
      rect: { current: null } as React.MutableRefObject<any>,
      node: { current: null } as React.MutableRefObject<any>,
      over: null,
    });

    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    });

    renderSubject = () => render(
      <DndContext>
        <FolderListItem folder={mockFolder} onDataChange={mockOnDataChange} />
      </DndContext>
    );
  });

  afterEach(() => {
    vi.clearAllMocks(); // Clear all mocks after each test
  });

  it('renders folder name and icon', () => {
    renderWithDnd(<FolderListItem {...defaultProps} />);
    expect(screen.getByText(mockFolderData.name)).toBeInTheDocument();
    expect(screen.getByTestId('icon-folder')).toBeInTheDocument();
  });

  it('calls useDroppable with correct parameters', () => {
    renderWithDnd(<FolderListItem {...defaultProps} />);
    expect(useDroppable).toHaveBeenCalledWith({
      id: mockFolderData.id,
      data: {
        type: 'folder',
        accepts: ['asset'],
      },
    });
  });

  it('opens rename dialog on menu item click and submits new name', async () => {
    mockRenameFolderClient.mockResolvedValue({ success: true });
    renderWithDnd(<FolderListItem {...defaultProps} />);
    
    const menuTrigger = screen.getByRole('button', { name: `Actions for folder ${mockFolderData.name}` });
    await userEvent.click(menuTrigger);
    const renameMenuItem = await screen.findByRole('menuitem', { name: /rename/i });
    await userEvent.click(renameMenuItem);

    await waitFor(() => expect(screen.getByTestId('mock-input-dialog')).toBeInTheDocument());
    const renameInput = screen.getByTestId('rename-input') as HTMLInputElement;
    await userEvent.clear(renameInput);
    await userEvent.type(renameInput, 'New Folder Name');
    
    await userEvent.click(screen.getByText('SubmitRename'));

    await waitFor(() => {
      expect(mockRenameFolderClient).toHaveBeenCalledWith(mockFolderData.id, 'New Folder Name');
      expect(defaultProps.onDataChange).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Folder renamed' }));
    });
  });

  it('shows error toast if rename fails', async () => {
    mockRenameFolderClient.mockResolvedValue({ success: false, error: 'Rename failed' });
    renderWithDnd(<FolderListItem {...defaultProps} />);
    const menuTrigger = screen.getByRole('button', { name: `Actions for folder ${mockFolderData.name}` });
    await userEvent.click(menuTrigger);
    const renameMenuItem = await screen.findByRole('menuitem', { name: /rename/i });
    await userEvent.click(renameMenuItem);
    
    const renameInput = screen.getByTestId('rename-input') as HTMLInputElement;
    await userEvent.clear(renameInput);
    await userEvent.type(renameInput, 'Attempted Name');

    await userEvent.click(screen.getByText('SubmitRename'));
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error Renaming', description: 'Rename failed' }));
    });
  });

  it('opens delete dialog and confirms deletion', async () => {
    mockDeleteFolderClient.mockResolvedValue({ success: true });
    renderWithDnd(<FolderListItem {...defaultProps} />);
    const menuTrigger = screen.getByRole('button', { name: `Actions for folder ${mockFolderData.name}` });
    await userEvent.click(menuTrigger);
    const deleteMenuItem = await screen.findByRole('menuitem', { name: /delete/i });
    await userEvent.click(deleteMenuItem);

    await waitFor(() => expect(screen.getByTestId('mock-confirmation-dialog')).toBeInTheDocument());
    await userEvent.click(screen.getByText('ConfirmDelete'));

    await waitFor(() => {
      expect(mockDeleteFolderClient).toHaveBeenCalledWith(mockFolderData.id);
      expect(defaultProps.onDataChange).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Folder Deleted' }));
    });
  });

  it('shows error toast if delete fails', async () => {
    mockDeleteFolderClient.mockResolvedValue({ success: false, error: 'Delete failed' });
    renderWithDnd(<FolderListItem {...defaultProps} />);
    const menuTrigger = screen.getByRole('button', { name: `Actions for folder ${mockFolderData.name}` });
    await userEvent.click(menuTrigger);
    const deleteMenuItem = await screen.findByRole('menuitem', { name: /delete/i });
    await userEvent.click(deleteMenuItem);

    await waitFor(() => expect(screen.getByTestId('mock-confirmation-dialog')).toBeInTheDocument());
    await userEvent.click(screen.getByText('ConfirmDelete'));
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error Deleting Folder', description: 'Delete failed' }));
    });
  });

  it('should call onDataChange and show toast on successful folder rename', async () => {
    mockRenameFolderClient.mockResolvedValue({ success: true });
    const { getByPlaceholderText } = renderSubject();

    const menuTrigger = screen.getByRole('button', { name: /actions for folder Mock Folder/i });
    await userEvent.click(menuTrigger);
    const renameMenuItem = await screen.findByRole('menuitem', { name: /rename/i });
    await userEvent.click(renameMenuItem);

    const input = getByPlaceholderText('Enter new folder name');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Folder Name');
    await userEvent.click(screen.getByText('SubmitRename'));

    await waitFor(() => {
      expect(mockRenameFolderClient).toHaveBeenCalledWith('folder-1', 'New Folder Name');
      expect(mockToast).toHaveBeenCalledWith({ title: 'Folder renamed', description: 'Folder "Mock Folder" was successfully renamed to "New Folder Name".' });
      expect(mockOnDataChange).toHaveBeenCalled();
    });
  });

  it('should show error toast on failed folder rename', async () => {
    mockRenameFolderClient.mockResolvedValue({ success: false, error: 'Rename failed' });
    const { getByText, getByPlaceholderText } = renderSubject();

    const menuTrigger = screen.getByRole('button', { name: /actions for folder Mock Folder/i });
    await userEvent.click(menuTrigger);
    const renameMenuItem = await screen.findByRole('menuitem', { name: /rename/i });
    await userEvent.click(renameMenuItem);

    const input = getByPlaceholderText('Enter new folder name');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Folder Name');
    await userEvent.click(screen.getByText('SubmitRename'));

    await waitFor(() => {
      expect(mockRenameFolderClient).toHaveBeenCalledWith('folder-1', 'New Folder Name');
      expect(mockToast).toHaveBeenCalledWith({ title: 'Error Renaming', description: 'Rename failed' });
      expect(mockOnDataChange).not.toHaveBeenCalled();
    });
  });

  it('should call onDataChange and show toast on successful folder delete', async () => {
    mockDeleteFolderClient.mockResolvedValue({ success: true });
    const { getByText: renderSubjectGetByText } = renderSubject();

    const menuTrigger = screen.getByRole('button', { name: /actions for folder Mock Folder/i });
    await userEvent.click(menuTrigger);
    const deleteMenuItem = await screen.findByRole('menuitem', { name: /delete/i });
    await userEvent.click(deleteMenuItem);

    await userEvent.click(screen.getByText('ConfirmDelete'));

    await waitFor(() => {
      expect(mockDeleteFolderClient).toHaveBeenCalledWith('folder-1');
      expect(mockToast).toHaveBeenCalledWith({ title: 'Folder Deleted', description: 'Folder "Mock Folder" was successfully deleted.' });
      expect(mockOnDataChange).toHaveBeenCalled();
    });
  });

  it('should show error toast on failed folder delete', async () => {
    mockDeleteFolderClient.mockResolvedValue({ success: false, error: 'Delete failed' });
    const { getByText: renderSubjectGetByText } = renderSubject();

    const menuTrigger = screen.getByRole('button', { name: /actions for folder Mock Folder/i });
    await userEvent.click(menuTrigger);
    const deleteMenuItem = await screen.findByRole('menuitem', { name: /delete/i });
    await userEvent.click(deleteMenuItem);
    await userEvent.click(screen.getByText('ConfirmDelete'));

    await waitFor(() => {
      expect(mockDeleteFolderClient).toHaveBeenCalledWith('folder-1');
      expect(mockToast).toHaveBeenCalledWith({ title: 'Error Deleting Folder', description: 'Delete failed', variant: 'destructive' });
      expect(mockOnDataChange).not.toHaveBeenCalled();
    });
  });

  it('should apply specific styles when isOver is true', () => {
    vi.mocked(useDroppable).mockReturnValueOnce({
      setNodeRef: vi.fn(),
      isOver: true,
      active: null,
      rect: { current: null } as React.MutableRefObject<any>,
      node: { current: null } as React.MutableRefObject<any>,
      over: null,
    });
    const { container } = renderSubject();
    const mainDiv = container.querySelector('div[class*="group"]');
    expect(mainDiv).toHaveClass('bg-blue-100');
    expect(mainDiv).toHaveClass('ring-2');
    expect(mainDiv).toHaveClass('ring-blue-500');
  });

  it('should navigate to the correct folder path on link click', () => {
    const { getByRole } = renderSubject();
    const link = getByRole('link');
    expect(link).toHaveAttribute('href', '/dam?folderId=folder-1');
  });

  it('should not allow submitting an empty folder name if default validation is used', async () => {
    mockRenameFolderClient.mockResolvedValue({ success: false, error: 'Folder name cannot be empty' });

    renderWithDnd(<FolderListItem {...defaultProps} />);
    const menuTrigger = screen.getByRole('button', { name: `Actions for folder ${mockFolderData.name}` });
    await userEvent.click(menuTrigger);
    const renameMenuItem = await screen.findByRole('menuitem', { name: /rename/i });
    await userEvent.click(renameMenuItem);

    const input = screen.getByTestId('rename-input') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.click(screen.getByText('SubmitRename'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error Renaming', description: 'Folder name cannot be empty' }));
    });
  });
}); 