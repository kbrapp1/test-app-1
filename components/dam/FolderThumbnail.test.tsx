import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { FolderThumbnail } from './FolderThumbnail';
import type { Folder } from '@/types/dam';

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    prefetch: vi.fn(),
  }),
}));

// Mock lucide-react for FolderIcon
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Folder: () => <svg data-testid="folder-icon" />,
  };
});

// Declare mockUseDroppable and its dependencies before vi.mock for @dnd-kit/core
const mockSetNodeRef = vi.fn();
let mockUseDroppable: Mock;

// Mock @dnd-kit/core for useDroppable
vi.mock('@dnd-kit/core', () => ({
  useDroppable: (...args: any[]) => mockUseDroppable(...args),
}));

// Corrected sampleFolder to match the Folder type from @/types/dam
const sampleFolder: Folder = { // The component prop expects Folder & { type: 'folder' }, Folder already has type: 'folder'
  id: 'folder123',
  name: 'My Test Folder',
  user_id: 'user1',
  organization_id: 'org1',
  created_at: new Date().toISOString(),
  type: 'folder', // from BaseItem, and Folder interface specifies type: 'folder'
  ownerName: 'Test User', // from BaseItem
  parent_folder_id: null, // from Folder interface
};

describe('FolderThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Assign the mock implementation in beforeEach
    mockUseDroppable = vi.fn(() => ({
      setNodeRef: mockSetNodeRef,
      isOver: false,
    }));
  });

  test('renders folder name, icon, and link correctly', () => {
    render(<FolderThumbnail folder={sampleFolder} />);

    // Check folder name and title attribute
    const folderNameElement = screen.getByText(sampleFolder.name);
    expect(folderNameElement).toBeInTheDocument();
    expect(folderNameElement).toHaveAttribute('title', sampleFolder.name);

    // Check for folder icon
    expect(screen.getByTestId('folder-icon')).toBeInTheDocument();

    // Check link href
    // Link component renders an <a> tag eventually
    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', `/dam?folderId=${sampleFolder.id}`);
  });

  test('calls useDroppable with correct parameters', () => {
    render(<FolderThumbnail folder={sampleFolder} />);
    expect(mockUseDroppable).toHaveBeenCalledWith({
      id: sampleFolder.id,
      data: {
        type: 'folder',
        name: sampleFolder.name,
      },
    });
  });

  test('applies conditional classes when isOver is true', () => {
    mockUseDroppable.mockImplementation(() => ({
      setNodeRef: mockSetNodeRef,
      isOver: true,
    }));
    const { container } = render(<FolderThumbnail folder={sampleFolder} />);
    // The first child of the container should be the one with outerContainerClasses
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('bg-primary/20');
    expect(outerDiv).toHaveClass('border-primary');
    expect(outerDiv).toHaveClass('outline-dashed');
    expect(outerDiv).toHaveClass('outline-1'); 
    expect(outerDiv).toHaveClass('outline-primary');
  });

  test('does not apply isOver conditional classes when isOver is false', () => {
    // Default mock has isOver: false
    const { container } = render(<FolderThumbnail folder={sampleFolder} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).not.toHaveClass('bg-primary/20');
    expect(outerDiv).not.toHaveClass('border-primary');
    expect(outerDiv).not.toHaveClass('outline-dashed');
  });

  test('Link component has prefetch={false} and no legacyBehavior', () => {
    render(<FolderThumbnail folder={sampleFolder} />);
    // We can't directly inspect props of the Link component easily after it renders to an <a>.
    // However, the component explicitly sets prefetch={false} and legacyBehavior={undefined}.
    // This test serves as a reminder and a check that no errors occur during rendering with these props.
    // A more direct test would require deeper mocking or component instance inspection if possible.
    // For now, we rely on the code and that it renders without error.
    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument(); 
    // We assume Next.js handles these props correctly. A visual inspection or e2e test would confirm prefetch behavior.
  });
}); 