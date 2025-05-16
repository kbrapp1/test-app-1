import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssetDetailsDialog } from './AssetDetailsDialog';
import { Asset } from '@/types/dam';
import { vi } from 'vitest';

// Mock utilities
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual, // Import and retain all original exports, including cn
    formatBytes: (bytes: number) => `${bytes} B`, // Simplified mock for formatBytes
  };
});

vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('date-fns')>();
  return {
    ...actual, // Import and retain all exports
    format: vi.fn((date: Date | number | string, formatString: string) => {
      // Provide a consistent, simple format for testing
      if (date && formatString) return new Date(date).toISOString().split('T')[0] + ' ' + formatString;
      return 'Invalid Date';
    }),
  };
});


const mockOnOpenChange = vi.fn();

const mockAsset: Asset = {
  id: 'asset-123',
  name: 'Test Image.jpg',
  user_id: 'user-abc',
  organization_id: 'org-xyz',
  created_at: new Date().toISOString(),
  type: 'asset',
  storage_path: 'path/to/image.jpg',
  mime_type: 'image/jpeg',
  size: 102400, // 100 KB
  folder_id: 'folder-456',
  publicUrl: 'http://example.com/image.jpg',
};

const defaultProps = {
  isOpen: true,
  onOpenChange: mockOnOpenChange,
  asset: mockAsset,
};

const TestWrapper: React.FC<Partial<typeof defaultProps>> = (props) => {
  return <AssetDetailsDialog {...defaultProps} {...props} />;
};

describe('AssetDetailsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open and asset is provided', () => {
    render(<TestWrapper />);
    expect(screen.getByRole('heading', { name: /Asset Details/i })).toBeInTheDocument();
    expect(screen.getByText(/Viewing details for the asset: Test Image.jpg/i)).toBeInTheDocument();
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Test Image.jpg')).toBeInTheDocument();

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('image/jpeg')).toBeInTheDocument();

    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('102400 B')).toBeInTheDocument(); // Check mocked formatBytes

    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(new Date(mockAsset.created_at).toISOString().split('T')[0] + ' PPpp'))).toBeInTheDocument();

    // Check for the footer close button specifically
    const closeButtons = screen.getAllByRole('button', { name: /Close/i });
    const footerCloseButton = closeButtons.find(button => button.textContent === 'Close' && !button.querySelector('svg'));
    expect(footerCloseButton).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<TestWrapper isOpen={false} />);
    expect(screen.queryByRole('heading', { name: /Asset Details/i })).not.toBeInTheDocument();
  });

  it('does not render when asset is null', () => {
    render(<TestWrapper asset={null as any} />); // Cast to any to satisfy linter for this specific test case
    expect(screen.queryByRole('heading', { name: /Asset Details/i })).not.toBeInTheDocument();
  });

  it('calls onOpenChange(false) when Close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    const closeButtons = screen.getAllByRole('button', { name: /Close/i });
    // Find the footer button (text content is "Close" and no SVG)
    const footerButton = closeButtons.find(button => button.textContent === 'Close' && !button.querySelector('svg'));
    expect(footerButton).toBeInTheDocument(); // Ensure we found the correct button
    if (!footerButton) throw new Error("Could not find the footer close button");

    await user.click(footerButton);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when Escape key is pressed', () => {
    render(<TestWrapper />);
    // The dialog role is 'dialog' for shadcn/ui Dialog
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
  
  it('displays N/A for missing or undefined values if applicable', () => {
    const assetWithMissingDetails: Asset = {
      ...mockAsset,
      mime_type: undefined as any, // Simulate missing mime_type
    };
    render(<TestWrapper asset={assetWithMissingDetails} />);
    
    const typeLabel = screen.getByText('Type');
    const typeValueElement = typeLabel.nextElementSibling;
    expect(typeValueElement).toHaveTextContent('N/A');
  });
}); 